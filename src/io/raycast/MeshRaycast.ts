import { GeometryBase } from '../../core/geometry/GeometryBase';
import { VertexAttributeName } from '../../core/geometry/VertexAttributeName';
import { MeshAttributeView, MeshBVH, MeshBVHCull, MeshBVHHit, MeshBVHRayOptions } from '../../core/tree/bvh/MeshBVH';
import { Matrix4 } from '../../math/Matrix4';
import { Ray } from '../../math/Ray';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { RaycastHit } from './RaycastHit';
import { MeshDeformer, RaycastDeformation } from './MeshDeformer';
import { MeshRenderer } from '../../components/renderer/MeshRenderer';

/**
 * When a ray query uses a geometry's `MeshBVH`:
 * - `auto`: when one has been built (`MeshBVH.build` / `MeshBVH.get`),
 *   otherwise test every triangle
 * - `always`: build one on first use
 * - `never`: always test every triangle
 * @group IO
 */
export type RaycastBVHMode = 'auto' | 'always' | 'never';

/**
 * Options for `MeshRaycast.intersect`. Distances are world space.
 * @group IO
 */
export interface MeshRaycastOptions {
    /** Ignore hits closer than this. Default 0. */
    near?: number;
    /** Ignore hits farther than this. Default Infinity. */
    far?: number;
    /**
     * Faces to ignore, as they appear in the world (a mirroring transform
     * flips the local winding; that is accounted for). Default `'none'`.
     */
    cull?: MeshBVHCull | boolean;
    /** Default `'auto'`. */
    useBVH?: RaycastBVHMode;
    /** Report every hit instead of only the closest. Default false. */
    all?: boolean;
    /** How skinned / morphed renderers are handled by `intersectRenderer`. Default `'cpu'`. */
    deformation?: RaycastDeformation;
    /**
     * Per-hit predicate, given the local hit and whether it is a front face
     * in world space. Rejected hits do not hide hits behind them.
     */
    accept?: (hit: MeshBVHHit, frontFace: boolean) => boolean;
}

/**
 * World-space ray queries against one geometry under a transform. Shared by
 * `Raycaster` and `MeshColliderShape`, so both report the same hit data.
 * @group IO
 */
export class MeshRaycast {
    // Matrix4 storage comes from a pool that exists only after engine init: create lazily.
    private static _inv: Matrix4;
    private static _o: Vector3 = new Vector3();
    private static _d: Vector3 = new Vector3();
    private static _opts: MeshBVHRayOptions = {};

    /**
     * Intersect `ray` (world space) with `geometry` placed by `worldMatrix`
     * and append the hits to `out` (closest only unless `options.all`).
     * Hits are not sorted across calls; the ones added by one call are.
     * @returns number of hits appended
     */
    public static intersect(geometry: GeometryBase, worldMatrix: Matrix4, ray: Ray, options: MeshRaycastOptions, out: RaycastHit[]): number {
        if (!geometry || !MeshBVH.getAttributeView(geometry, VertexAttributeName.position)) return 0;

        const inv = (MeshRaycast._inv ||= new Matrix4()).copy(worldMatrix).invert();
        const o = Matrix4.transformPoint(inv, ray.origin, MeshRaycast._o);
        const d = Matrix4.transformVector(inv, ray.direction, MeshRaycast._d);
        const len = d.length;
        if (!(len > 0) || !isFinite(len)) return 0;
        d.set(d.x / len, d.y / len, d.z / len);
        // A world distance s along the unit world direction is s * len along the unit local one.
        const near = options.near ?? 0, far = options.far ?? Infinity;

        // A mirroring transform reverses the winding the rasterizer sees.
        const mirrored = MeshRaycast._determinant3(worldMatrix) < 0;
        let cull = options.cull === true ? 'back' : (options.cull || 'none') as MeshBVHCull;
        if (mirrored && cull !== 'none') cull = cull === 'back' ? 'front' : 'back';

        const opts = MeshRaycast._opts;
        opts.near = near * len;
        opts.far = far * len;
        opts.cull = cull;

        const mode = options.useBVH ?? 'auto';
        const bvh = mode === 'always' || (mode === 'auto' && MeshBVH.has(geometry)) ? MeshBVH.get(geometry) : null;

        let local: MeshBVHHit[];
        if (options.all || options.accept) {
            local = bvh ? bvh.raycastAll(o, d, opts) : MeshBVH.raycastGeometryAll(geometry, o, d, opts);
            if (options.accept) local = local.filter(h => options.accept(h, h.frontFace !== mirrored));
            if (!options.all && local.length > 1) local.length = 1;
        } else {
            const h = bvh ? bvh.raycast(o, d, opts) : MeshBVH.raycastGeometry(geometry, o, d, opts);
            local = h ? [h] : [];
        }
        if (local.length === 0) return 0;

        const normals = MeshBVH.getAttributeView(geometry, VertexAttributeName.normal);
        const uvs = MeshBVH.getAttributeView(geometry, VertexAttributeName.uv);
        const uvs1 = MeshBVH.getAttributeView(geometry, VertexAttributeName.TEXCOORD_1);
        const idx = geometry.getAttribute(VertexAttributeName.indices);
        const I = idx && idx.data && idx.data.length > 0 ? idx.data as ArrayLike<number> : null;
        for (const h of local) {
            out.push(MeshRaycast._toWorld(h, worldMatrix, inv, ray, I, normals, uvs, uvs1, mirrored));
        }
        return local.length;
    }

    /**
     * Intersect a renderer's mesh as it is drawn. Skinned and morph-target
     * meshes are deformed on the CPU first (see `MeshDeformer`) unless
     * `options.deformation` says otherwise; a deformed mesh is always
     * queried through a (refit) BVH unless `useBVH` is `'never'`. For
     * skinned meshes `localPoint` is the hit expressed in the renderer's
     * local space (the deformed surface, not the bind pose).
     * @returns number of hits appended
     */
    public static intersectRenderer(renderer: MeshRenderer, ray: Ray, options: MeshRaycastOptions, out: RaycastHit[]): number {
        const world = renderer.transform.worldMatrix;
        const mode = options.deformation ?? 'cpu';
        if (mode !== 'bindPose' && MeshDeformer.isDeformed(renderer)) {
            if (mode === 'skip') return 0;
            const deformed = MeshDeformer.deform(renderer);
            if (deformed) {
                const opts: MeshRaycastOptions = { ...options, useBVH: options.useBVH === 'never' ? 'never' : 'always' };
                if (!deformed.worldSpace) return MeshRaycast.intersect(deformed.geometry, world, ray, opts, out);
                const first = out.length;
                const n = MeshRaycast.intersect(deformed.geometry, MeshRaycast._identity(), ray, opts, out);
                const inv = (MeshRaycast._inv2 ||= new Matrix4()).copy(world).invert();
                for (let i = first; i < out.length; i++) Matrix4.transformPoint(inv, out[i].point, out[i].localPoint);
                return n;
            }
        }
        return MeshRaycast.intersect(renderer.geometry, world, ray, options, out);
    }

    private static _inv2: Matrix4;
    private static _ident: Matrix4;
    private static _identity(): Matrix4 {
        return (MeshRaycast._ident ||= new Matrix4()).identity();
    }

    private static _toWorld(h: MeshBVHHit, world: Matrix4, inv: Matrix4, ray: Ray, I: ArrayLike<number> | null,
        normals: MeshAttributeView | null, uvs: MeshAttributeView | null, uvs1: MeshAttributeView | null, mirrored: boolean): RaycastHit {
        const k = h.triIndex * 3;
        const i0 = I ? I[k] : k, i1 = I ? I[k + 1] : k + 1, i2 = I ? I[k + 2] : k + 2;
        const w0 = 1 - h.u - h.v, w1 = h.u, w2 = h.v;

        const point = Matrix4.transformPoint(world, h.point, new Vector3());
        const faceNormal = MeshRaycast.transformNormal(inv, h.faceNormal, new Vector3());
        let normal: Vector3;
        if (normals) {
            const N = normals.data, s = normals.stride, f = normals.offset;
            const a = i0 * s + f, b = i1 * s + f, c = i2 * s + f;
            normal = new Vector3(
                N[a] * w0 + N[b] * w1 + N[c] * w2,
                N[a + 1] * w0 + N[b + 1] * w1 + N[c + 1] * w2,
                N[a + 2] * w0 + N[b + 2] * w1 + N[c + 2] * w2,
            );
            MeshRaycast.transformNormal(inv, normal, normal);
            if (normal.length === 0) normal.copy(faceNormal);
        } else {
            normal = faceNormal.clone();
        }

        return {
            distance: Vector3.distance(ray.origin, point),
            point,
            localPoint: h.point.clone(),
            normal,
            faceNormal,
            faceIndex: h.triIndex,
            barycentric: new Vector3(w0, w1, w2),
            frontFace: h.frontFace !== mirrored,
            uv: MeshRaycast._lerp2(uvs, i0, i1, i2, w0, w1, w2),
            uv1: MeshRaycast._lerp2(uvs1, i0, i1, i2, w0, w1, w2),
            subGeometryIndex: h.subGeometryIndex,
            object3D: null,
            renderer: null,
        };
    }

    private static _lerp2(view: MeshAttributeView | null, i0: number, i1: number, i2: number, w0: number, w1: number, w2: number): Vector2 | null {
        if (!view) return null;
        const D = view.data, s = view.stride, f = view.offset;
        const a = i0 * s + f, b = i1 * s + f, c = i2 * s + f;
        return new Vector2(D[a] * w0 + D[b] * w1 + D[c] * w2, D[a + 1] * w0 + D[b + 1] * w1 + D[c + 1] * w2);
    }

    /**
     * Transform a local-space normal to world space with the inverse
     * transpose of the local → world matrix (normals stay perpendicular
     * under non-uniform scale), then normalize.
     * @param invMatrix inverse of the local → world matrix
     * @param n local-space normal
     * @param out result (may alias `n`)
     */
    public static transformNormal(invMatrix: Matrix4, n: Vector3, out: Vector3): Vector3 {
        const d = invMatrix.rawData;
        const x = n.x, y = n.y, z = n.z;
        out.set(
            x * d[0] + y * d[1] + z * d[2],
            x * d[4] + y * d[5] + z * d[6],
            x * d[8] + y * d[9] + z * d[10],
        );
        return out.normalize();
    }

    private static _determinant3(m: Matrix4): number {
        const d = m.rawData;
        return d[0] * (d[5] * d[10] - d[6] * d[9]) - d[4] * (d[1] * d[10] - d[2] * d[9]) + d[8] * (d[1] * d[6] - d[2] * d[5]);
    }
}

import { Camera3D } from '../../core/Camera3D';
import { Object3D } from '../../core/entities/Object3D';
import { MeshBVHCull, MeshBVHHit } from '../../core/tree/bvh/MeshBVH';
import { InstanceDrawComponent } from '../../components/renderer/InstanceDrawComponent';
import { MeshRenderer } from '../../components/renderer/MeshRenderer';
import { VisibleLayer } from '../../gfx/renderJob/config/VisibleLayer';
import { Material } from '../../materials/Material';
import { Ray } from '../../math/Ray';
import { Vector3 } from '../../math/Vector3';
import { CameraUtil } from '../../util/CameraUtil';
import { MeshRaycast, MeshRaycastOptions, RaycastBVHMode } from './MeshRaycast';
import { RaycastDeformation } from './MeshDeformer';
import { RaycastHit } from './RaycastHit';

/**
 * Which faces a `Raycaster` can hit:
 * - `material`: whatever each sub-mesh's material renders (its `cullMode`)
 * - `front` / `back`: only front / only back faces
 * - `double`: both
 * @group IO
 */
export type RaycastSide = 'material' | 'front' | 'back' | 'double';

/**
 * CPU ray picking against mesh triangles, in the style of three.js
 * `Raycaster`: build a ray (from the camera or by hand), then intersect
 * objects and get sorted hits with point, distance, normals, face index,
 * barycentric coordinates and UVs. Unlike `PickFire`, no `ColliderComponent`
 * is needed: any `MeshRenderer` in the given hierarchy is tested.
 *
 * Geometry with a `MeshBVH` (see `MeshBVH.build`) is tested through the
 * tree; other geometry is scanned triangle by triangle unless `useBVH` is
 * `'always'`.
 *
 * ```ts
 * const raycaster = new Raycaster();
 * raycaster.setFromCamera(view.camera, input.mouseX, input.mouseY);
 * const hits = raycaster.intersectObject(view.scene);
 * if (hits.length) console.log(hits[0].object3D.name, hits[0].point, hits[0].uv);
 * ```
 *
 * Skinned and morph-target meshes are deformed on the CPU as the vertex
 * shader does (see `deformation` and `MeshDeformer`). Renderers
 * batched by an `InstanceDrawComponent` are tested even though the batch
 * disables them individually.
 * @group IO
 */
export class Raycaster {
    /** The world-space ray (direction normalized). */
    public ray: Ray = new Ray();
    /** Hits closer than this are ignored. */
    public near: number = 0;
    /** Hits farther than this are ignored. */
    public far: number = Infinity;
    /** Only renderers whose `visibleLayer` shares a bit with this mask are tested. */
    public layerMask: number = VisibleLayer.All;
    /** Which faces can be hit. Default `'material'`. */
    public side: RaycastSide = 'material';
    /** Report only the closest hit per mesh instead of every crossing. */
    public firstHitOnly: boolean = false;
    /** When to use a geometry's `MeshBVH`. Default `'auto'`. */
    public useBVH: RaycastBVHMode = 'auto';
    /**
     * Skinned / morph-target meshes: `'cpu'` (default) deforms them on the
     * CPU like the vertex shader so hits match what is drawn; `'bindPose'`
     * tests the undeformed geometry; `'skip'` ignores them.
     */
    public deformation: RaycastDeformation = 'cpu';
    /** Optional per-renderer filter; return false to skip a renderer. */
    public filter: ((renderer: MeshRenderer) => boolean) | null = null;

    private static _a: Vector3 = new Vector3();
    private static _b: Vector3 = new Vector3();

    /**
     * @param origin optional world-space ray origin
     * @param direction optional world-space ray direction (normalized here)
     */
    constructor(origin?: Vector3, direction?: Vector3) {
        if (origin && direction) this.set(origin, direction);
    }

    /** Set the ray from an origin and a direction (normalized here). */
    public set(origin: Vector3, direction: Vector3): this {
        this.ray.origin.copy(origin);
        this.ray.direction = direction;
        return this;
    }

    /**
     * Set the ray through a canvas pixel (CSS pixels relative to the canvas'
     * top-left, as in `InputSystem.mouseX/Y` and `PointerEvent3D.mouseX/Y`).
     */
    public setFromCamera(camera: Camera3D, screenX: number, screenY: number): this {
        const r = camera.screenPointToRay(screenX, screenY);
        this.ray.origin.copy(r.origin);
        this.ray.direction = r.direction;
        return this;
    }

    /** Set the ray through a point in normalized device coordinates (x, y in [-1, 1], y up). */
    public setFromCameraNDC(camera: Camera3D, ndcX: number, ndcY: number): this {
        const a = CameraUtil.UnProjectionNDC(ndcX, ndcY, 0.01, camera, Raycaster._a);
        const b = CameraUtil.UnProjectionNDC(ndcX, ndcY, 1.0, camera, Raycaster._b);
        this.ray.origin.copy(a);
        this.ray.direction = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
        return this;
    }

    /**
     * Intersect an object (and, if `recursive`, its descendants). Hits are
     * appended to `out`, which is then sorted by distance.
     */
    public intersectObject(object: Object3D, recursive: boolean = true, out: RaycastHit[] = []): RaycastHit[] {
        this._collect(object, recursive, renderer => { this._intersectRenderer(renderer, this.far, !this.firstHitOnly, out); });
        out.sort((x, y) => x.distance - y.distance);
        return out;
    }

    /** `intersectObject` over several roots; `out` is sorted by distance. */
    public intersectObjects(objects: Object3D[], recursive: boolean = true, out: RaycastHit[] = []): RaycastHit[] {
        for (const object of objects) {
            this._collect(object, recursive, renderer => { this._intersectRenderer(renderer, this.far, !this.firstHitOnly, out); });
        }
        out.sort((x, y) => x.distance - y.distance);
        return out;
    }

    /**
     * Closest hit over one or more roots, or null. Cheaper than
     * `intersectObjects(...)[0]`: each mesh is only searched up to the best
     * distance found so far.
     */
    public intersectFirst(objects: Object3D | Object3D[], recursive: boolean = true): RaycastHit | null {
        const roots = Array.isArray(objects) ? objects : [objects];
        const tmp: RaycastHit[] = [];
        let best: RaycastHit = null;
        for (const object of roots) {
            this._collect(object, recursive, renderer => {
                tmp.length = 0;
                this._intersectRenderer(renderer, best ? best.distance : this.far, false, tmp);
                if (tmp.length && (!best || tmp[0].distance < best.distance)) best = tmp[0];
            });
        }
        return best;
    }

    private _collect(object: Object3D, recursive: boolean, visit: (renderer: MeshRenderer) => void): void {
        // Renderers batched by an InstanceDrawComponent are disabled
        // individually but still drawn, so they stay pickable.
        let instanced = false;
        for (let p = object.transform.parent?.object3D; p && !instanced; p = p.transform.parent?.object3D) instanced = Raycaster._batches(p);
        const walk = (obj: Object3D, inBatch: boolean) => {
            // Detached objects report enable=false; only honour it inside a scene.
            if (obj.transform.scene3D && !obj.transform.enable) return;
            inBatch = inBatch || Raycaster._batches(obj);
            obj.components.forEach(c => {
                if (!(c instanceof MeshRenderer)) return;
                if ((!c.enable && !inBatch) || !c.geometry) return;
                if ((c.visibleLayer & this.layerMask) === 0) return;
                if (this.filter && !this.filter(c)) return;
                visit(c);
            });
            if (!recursive) return;
            for (const child of obj.entityChildren) {
                if (child instanceof Object3D) walk(child, inBatch);
            }
        };
        walk(object, instanced);
    }

    private static _batches(obj: Object3D): boolean {
        const c = obj.getComponent(InstanceDrawComponent);
        return !!c && c.enable;
    }

    private _intersectRenderer(renderer: MeshRenderer, far: number, all: boolean, out: RaycastHit[]): void {
        const opts: MeshRaycastOptions = { near: this.near, far, useBVH: this.useBVH, all, deformation: this.deformation };
        const subs = Math.max(1, renderer.geometry.subGeometries.length);
        const materials = renderer.materials || [];
        const materialOf = (sub: number): Material => materials[sub] || materials[0] || null;

        // Work out whether every sub-mesh can share one cull mode.
        let uniform: MeshBVHCull | null = null, mixed = false;
        for (let i = 0; i < subs; i++) {
            const m = materialOf(i);
            if (!Raycaster._drawsTriangles(m)) { mixed = true; break; }
            const c = this._cullFor(m);
            if (uniform === null) uniform = c;
            else if (uniform !== c) { mixed = true; break; }
        }
        if (!mixed) {
            opts.cull = uniform ?? 'none';
        } else {
            opts.cull = 'none';
            opts.accept = (h: MeshBVHHit, frontFace: boolean) => {
                const m = materialOf(h.subGeometryIndex);
                if (!Raycaster._drawsTriangles(m)) return false;
                const c = this._cullFor(m);
                return c === 'none' || (c === 'back' ? frontFace : !frontFace);
            };
        }

        const first = out.length;
        MeshRaycast.intersectRenderer(renderer, this.ray, opts, out);
        for (let i = first; i < out.length; i++) {
            out[i].object3D = renderer.object3D;
            out[i].renderer = renderer;
        }
    }

    private _cullFor(material: Material | null): MeshBVHCull {
        switch (this.side) {
            case 'front': return 'back';
            case 'back': return 'front';
            case 'double': return 'none';
        }
        const mode = material ? material.cullMode : 'back';
        return mode === 'front' ? 'front' : mode === 'none' ? 'none' : 'back';
    }

    private static _drawsTriangles(material: Material | null): boolean {
        if (!material) return true;
        if (material.enable === false) return false;
        const topology = material.topology;
        return !topology || topology === 'triangle-list';
    }
}

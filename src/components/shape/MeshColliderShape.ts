import { GeometryBase } from "../../core/geometry/GeometryBase";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { ColliderShape, ColliderShapeType, HitInfo } from "./ColliderShape";
import { MeshRaycast, MeshRaycastOptions, RaycastBVHMode } from "../../io/raycast/MeshRaycast";
import { RaycastHit } from "../../io/raycast/RaycastHit";


/**
 * Mesh collision body
 * @group Collider
 */
export class MeshColliderShape extends ColliderShape {
    /**
     * Geometry to pick against. When left unset, `ColliderComponent` uses the
     * geometry of the `MeshRenderer` on the same object.
     */
    public mesh: GeometryBase;

    /** Skip triangles whose front face points away from the ray. */
    public backfaceCulling: boolean = false;

    /**
     * When to use the geometry's `MeshBVH`. Default `'always'`: the tree is
     * built on the first pick and cached per geometry. Use `'auto'` to only
     * use a tree built elsewhere (`MeshBVH.build`), `'never'` to always test
     * every triangle.
     */
    public useBVH: RaycastBVHMode = 'always';

    /** Ignore hits farther than this (world units). */
    public maxDistance: number = Infinity;

    private _opts: MeshRaycastOptions = {};
    private _hits: RaycastHit[] = [];

    constructor() {
        super();
        this._shapeType = ColliderShapeType.Mesh;
    }

    /**
     * Closest triangle hit along `ray` (world space), or null. With the
     * default `useBVH` the cost is O(log n) triangles. `distance`,
     * `intersectPoint`, `normal` (interpolated vertex normal, face normal
     * when the geometry has none) and `faceNormal` are world space; the
     * result also carries `localPoint`, `faceIndex`, `barycentric`, `uv`,
     * `uv1`, `subGeometryIndex` and `frontFace`.
     */
    public rayPick(ray: Ray, fromMatrix: Matrix4): HitInfo {
        if (!this.mesh) return null;
        const opts = this._opts;
        opts.cull = this.backfaceCulling ? 'back' : 'none';
        opts.far = this.maxDistance;
        opts.useBVH = this.useBVH;
        const hits = this._hits;
        hits.length = 0;
        if (MeshRaycast.intersect(this.mesh, fromMatrix, ray, opts, hits) === 0) return null;
        const h = hits[0];
        hits.length = 0;
        const ret: HitInfo = {
            intersectPoint: h.point,
            normal: h.normal,
            distance: h.distance,
            localPoint: h.localPoint,
            faceNormal: h.faceNormal,
            faceIndex: h.faceIndex,
            barycentric: h.barycentric,
            subGeometryIndex: h.subGeometryIndex,
            frontFace: h.frontFace,
        };
        if (h.uv) ret.uv = h.uv;
        if (h.uv1) ret.uv1 = h.uv1;
        return ret;
    }
}

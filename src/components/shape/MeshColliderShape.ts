import { GeometryBase } from "../../core/geometry/GeometryBase";
import { VertexAttributeName } from "../../core/geometry/VertexAttributeName";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";
import { ColliderShape, ColliderShapeType, HitInfo } from "./ColliderShape";
import { MeshBVH } from "../../core/tree/bvh/MeshBVH";


/**
 * Mesh collision body
 * @group Collider
 */
export class MeshColliderShape extends ColliderShape {
    /**
     * meshComponent
     */
    public mesh: GeometryBase;

    /** Skip triangles whose front face points away from the ray. */
    public backfaceCulling: boolean = false;
    private _pickRet: HitInfo;

    constructor() {
        super();
        this._shapeType = ColliderShapeType.Mesh;
    }

    /**
     * Closest triangle hit along `ray` (world space). Uses a cached
     * `MeshBVH` per geometry, so the cost is O(log n) triangles instead of a
     * full scan, and the result is the *nearest* hit rather than the first
     * triangle in index order. `distance` and `intersectPoint` are in world
     * space; `normal` is the smooth vertex normal when the geometry has one,
     * otherwise the face normal.
     */
    public rayPick(ray: Ray, fromMatrix: Matrix4): HitInfo {
        if (!this.mesh) return null;

        const helpMatrix = ColliderShape.helpMatrix;
        helpMatrix.copy(fromMatrix).invert();

        const helpRay = ColliderShape.helpRay.copy(ray);
        helpRay.applyMatrix(helpMatrix);
        // A non-uniform scale in `fromMatrix` leaves the local direction
        // un-normalized; normalize so BVH `t` is a local distance and we can
        // convert the hit point back to world space for the true distance.
        helpRay.direction.normalize();

        const bvh = MeshBVH.get(this.mesh);
        const hit = bvh.raycast(helpRay.origin, helpRay.direction, this.backfaceCulling);
        if (!hit) return null;

        this._pickRet ||= { intersectPoint: new Vector3(), distance: 0, normal: new Vector3() };
        const ret = this._pickRet;
        Matrix4.transformVector4(fromMatrix, hit.point, ret.intersectPoint);
        ret.distance = Vector3.distance(ray.origin, ret.intersectPoint);

        const normalAttribute = this.mesh.getAttribute(VertexAttributeName.normal);
        const n = ret.normal;
        if (normalAttribute && normalAttribute.data && normalAttribute.data.length > 0) {
            const N = normalAttribute.data;
            const [i0, i1, i2] = bvh.getTriangle(hit.triIndex, MeshColliderShape._tri);
            const w0 = 1 - hit.u - hit.v, w1 = hit.u, w2 = hit.v;
            n.set(
                N[i0 * 3] * w0 + N[i1 * 3] * w1 + N[i2 * 3] * w2,
                N[i0 * 3 + 1] * w0 + N[i1 * 3 + 1] * w1 + N[i2 * 3 + 1] * w2,
                N[i0 * 3 + 2] * w0 + N[i1 * 3 + 2] * w1 + N[i2 * 3 + 2] * w2,
            );
        } else {
            n.copy(hit.faceNormal);
        }
        Matrix4.transformVector(fromMatrix, n, n);
        n.normalize();
        return ret;
    }

    private static _tri: [number, number, number] = [0, 0, 0];
}

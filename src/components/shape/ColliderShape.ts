import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";
import { ColliderComponent } from "../ColliderComponent";

/**
 * Result of `ColliderShape.rayPick`. `intersectPoint`, `normal` and
 * `distance` are in world space (distance is measured from the world ray
 * origin), so hits from different shapes and transforms can be compared.
 */
export type HitInfo = {
    /** Hit point in world space. */
    intersectPoint?: Vector3;
    /** Surface normal in world space (unit length). */
    normal?: Vector3;
    /** World-space distance from the ray origin to `intersectPoint`. */
    distance: number;
    /** Collider that produced the hit (filled in by the caller). */
    collider?: ColliderComponent;
    /** Hit point in the collider's local space. */
    localPoint?: Vector3;
};

export enum ColliderShapeType {
    None,
    Box,
    Capsule,
    Sphere,
    Mesh,
}

/**
 * Shape of collider body, Base class of collider shape
 * @group Collider
 */
export class ColliderShape {
    private _center: Vector3;
    private _size: Vector3;
    private _halfSize: Vector3;
    protected _shapeType: ColliderShapeType = ColliderShapeType.None;


    protected static v3_help_0: Vector3;
    protected static helpMatrix: Matrix4;
    protected static helpRay: Ray;

    constructor() {
        ColliderShape.v3_help_0 ||= new Vector3();
        ColliderShape.helpMatrix ||= new Matrix4();
        ColliderShape.helpRay ||= new Ray();

        this._center = new Vector3();
        this._size = new Vector3();
        this._halfSize = new Vector3();
    }

    public get shapeType() {
        return this._shapeType;
    }

    /**
     * Set the position and size of collision objects
     * @param ct The position of the collision object in the local space of the object.
     * @param sz The size of the collision body in the X, Y, and Z directions.
     * @returns
     */
    public setFromCenterAndSize(ct?: Vector3, sz?: Vector3): this {
        ct && this._center.copy(ct);
        sz && this._size.copy(sz);
        return this;
    }

    /**
     * The position of the collision object in the local space of the object.
     */
    public get center(): Vector3 {
        return this._center;
    }

    public set center(value: Vector3) {
        this._center.copy(value);
    }

    /**
     *
     * The size of the collision body in the X, Y, and Z directions.
     * @returns Vector3
     */
    public get size(): Vector3 {
        return this._size;
    }

    public set size(value: Vector3) {
        this._size.copy(value);
        this._halfSize.copy(value).multiplyScalar(0.5);
    }

    /**
     * Half the size of the collision body.
     */
    public get halfSize(): Vector3 {
        return this._halfSize;
    }

    /**
     * Ray pickup.Emit a ray from a designated location to detect objects colliding with the ray.
     * @param ray emit ray
     * @param fromMatrix matrix
     * @returns Pick result intersect: whether to collide;
     *  IntersectPoint: collision point;
     *  Distance: The distance from the origin of the ray to the collision point.
     */
    public rayPick(ray: Ray, fromMatrix: Matrix4): HitInfo {
        return null;
    }

    /**
     * Build a world-space `HitInfo` from a local-space hit.
     * @param ray the world-space ray that was cast
     * @param fromMatrix local → world matrix
     * @param invMatrix inverse of `fromMatrix`
     * @param localPoint hit point in local space
     * @param localNormal surface normal in local space, if known
     */
    protected static toWorldHit(ray: Ray, fromMatrix: Matrix4, invMatrix: Matrix4, localPoint: Vector3, localNormal?: Vector3): HitInfo {
        const point = Matrix4.transformPoint(fromMatrix, localPoint, new Vector3());
        const hit: HitInfo = {
            intersectPoint: point,
            localPoint: new Vector3(localPoint.x, localPoint.y, localPoint.z),
            distance: Vector3.distance(ray.origin, point),
        };
        if (localNormal) {
            hit.normal = ColliderShape.transformNormal(invMatrix, localNormal, new Vector3());
        }
        return hit;
    }

    /**
     * Transform a local-space normal to world space with the inverse
     * transpose of the local → world matrix, which keeps it perpendicular
     * to the surface under non-uniform scale.
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

}

import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";


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

    constructor() {
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
    public rayPick(ray: Ray, fromMatrix: Matrix4): { intersect: boolean; intersectPoint?: Vector3; distance: number } {
        return null;
    }

}

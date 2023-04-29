import { Ray } from './Ray';
import { Vector3 } from './Vector3';

/**
 * Plane mathematics class
 * @group Math
 */
export class Plane {
    /**
     * Center position of plane
     */
    public point: Vector3 = new Vector3();

    /**
     * Plane normal vector
     */
    public normal: Vector3 = Vector3.UP;

    /**
     * @internal
     */
    private _tmpVecA: Vector3 = new Vector3();

    /**
     * Constructs a new plane object
     * @param pos Plane position
     * @param normal Plane normal quantity
     */
    constructor(pos: Vector3, normal: Vector3) {
        this.point = pos;
        this.normal = normal;
    }

    /**
     * Clones the current plane object
     * @returns New plane object
     */
    public clone(): Plane {
        let plane: Plane = new Plane(this.point.clone(), this.normal.clone());
        return plane;
    }

    /**
     * Determine whether the plane intersects a line segment and calculate the intersection point
     * @param start Starting point of line segment
     * @param end End point of line segment
     * @param point Point of output intersection
     * @returns Returns whether it intersects
     */
    public intersectsLine(start: Vector3, end: Vector3, point: Vector3) {
        var d = -this.normal.dotProduct(this.point);
        var d0 = this.normal.dotProduct(start) + d;
        var d1 = this.normal.dotProduct(end) + d;

        var t = d0 / (d0 - d1);
        var intersects = t >= 0 && t <= 1;
        if (intersects && point) {
            point.lerp(start, end, t);
        }

        return intersects;
    }

    /**
     * Determine whether the plane intersects a ray and calculate the intersection point
     * @param ray Ray of input
     * @param outPoint Point of output intersection
     * @returns Returns whether it intersects
     */
    public intersectsRay(ray: Ray, targetPoint?: Vector3) {
        targetPoint ||= this._tmpVecA;
        targetPoint.copy(this.point).subtract(ray.origin, targetPoint);
        var t = this.normal.dotProduct(targetPoint) / this.normal.dotProduct(ray.direction);
        var intersects = t >= 0;

        if (intersects) {
            targetPoint.copyFrom(ray.direction).multiplyScalar(t).add(ray.origin, targetPoint);
        }

        return intersects;
    }
}

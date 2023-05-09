import { Frustum } from './Frustum';
import { IBound } from './IBound';
import { Object3D } from '../entities/Object3D';
import { Ray } from '../../math/Ray';
import { Vector3 } from '../../math/Vector3';

/**
 * BoundingSphere
 * @internal
 * @group Core
 */
export class BoundingSphere implements IBound {

    public center = new Vector3();
    public extents!: Vector3; //= new Vector3();
    public max!: Vector3; //= new Vector3();
    public min!: Vector3; // = new Vector3();
    public size!: Vector3; //= new Vector3();

    public tmpVecA = new Vector3();
    public tmpVecB = new Vector3();
    public tmpVecC = new Vector3();
    public tmpVecD = new Vector3();

    public radius: number = 0;
    public diffBetweenPoints = new Vector3();
    public owner: any;
    public forward: Vector3 = new Vector3(0, 0, 1);

    public worldCenter: Vector3;
    public worldSize: Vector3;

    public worldMax: Vector3;
    public worldMin: Vector3;

    /**
     * @internal
     */
    private _center = new Vector3();
    constructor(center?: Vector3, radius?: number) {
        this.center = center || new Vector3(0, 0, 0);
        this.radius = radius === undefined ? 0.5 : radius;
    }

    updateBound() {
        throw new Error('Method not implemented.');
    }

    public containsPoint(point: Vector3) {
        var lenSq = this.tmpVecA.subtract(point, this.center).lengthSquared;
        var r = this.radius;
        return lenSq < r * r;
    }

    /**
     * @function
     * @name pc.BoundingSphere#intersectsRay
     * @description Test if a ray intersects with the sphere.
     * @param {pc.Ray} ray Ray to test against (direction must be normalized).
     * @param {pc.Vec3} [point] If there is an intersection, the intersection point will be copied into here.
     * @returns {Boolean} True if there is an intersection.
     */
    public intersectsRay(ray: Ray, point: Vector3) {
        var m = this.tmpVecA.copyFrom(ray.origin).subtract(this.center);
        var b = m.dotProduct(this.tmpVecB.copyFrom(ray.direction).normalize());
        var c = m.dotProduct(m) - this.radius * this.radius;

        // exit if ray's origin outside of sphere (c > 0) and ray pointing away from s (b > 0)
        if (c > 0 && b > 0) return null;

        var discr = b * b - c;
        // a negative discriminant corresponds to ray missing sphere
        if (discr < 0) return false;

        // ray intersects sphere, compute smallest t value of intersection
        var t = Math.abs(-b - Math.sqrt(discr));

        // if t is negative, ray started inside sphere so clamp t to zero
        if (point) point.copyFrom(ray.direction).scaleBy(t).add(ray.origin);

        return true;
    }

    /**
     * @function
     * @name pc.BoundingSphere#intersectsBoundingSphere
     * @description Test if a Bounding Sphere is overlapping, enveloping, or inside this Bounding Sphere.
     * @param {pc.BoundingSphere} sphere Bounding Sphere to test.
     * @returns {Boolean} true if the Bounding Sphere is overlapping, enveloping, or inside this Bounding Sphere and false otherwise.
     */
    public intersectsBoundingSphere(sphere: BoundingSphere) {
        this.tmpVecA.subtract(sphere.center, this.center);
        var totalRadius = sphere.radius + this.radius;
        if (this.tmpVecA.lengthSquared <= totalRadius * totalRadius) {
            return true;
        }
        return false;
    }

    public calculateTransform(obj: Object3D) {
        this.update(obj);
    }


    public containsFrustum(obj: Object3D, frustum: Frustum) {
        return frustum.containsSphere(obj);
    }

    public clone(): IBound {
        return new BoundingSphere(this.center.clone(), this.radius);
    }

    public update(obj: Object3D) {
        this.owner = obj;
        this._center.add(obj.transform.worldMatrix.position, this.center);
        this.forward = obj.transform.forward;
    }
    /**
     * @internal
     */
    public merge(bound: IBound) {
        throw new Error('BoundingSphere merge is not ready!');
    }

    public setFromCenterAndSize(center: Vector3, size: number) {
        this.center.copy(center);
        this.radius = size;
    }
}

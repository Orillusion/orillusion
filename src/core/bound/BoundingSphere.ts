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

    /** The center of the sphere. */
    public center = new Vector3();
    /** Half-size extents (provided for {@link IBound} compatibility). */
    public extents!: Vector3; //= new Vector3();
    /** Maximum corner of the enclosing box (for {@link IBound} compatibility). */
    public max!: Vector3; //= new Vector3();
    /** Minimum corner of the enclosing box (for {@link IBound} compatibility). */
    public min!: Vector3; // = new Vector3();
    /** Full size of the enclosing box (for {@link IBound} compatibility). */
    public size!: Vector3; //= new Vector3();

    /** Scratch vector A used by intersection tests. */
    public tmpVecA = new Vector3();
    /** Scratch vector B used by intersection tests. */
    public tmpVecB = new Vector3();
    /** Scratch vector C used by intersection tests. */
    public tmpVecC = new Vector3();
    /** Scratch vector D used by intersection tests. */
    public tmpVecD = new Vector3();

    /** Radius of the sphere. */
    public radius: number = 0;
    /** Scratch vector holding the difference between two points. */
    public diffBetweenPoints = new Vector3();
    /** The object that owns this bound. */
    public owner: any;
    /** The owner's forward direction in world space. */
    public forward: Vector3 = new Vector3(0, 0, 1);

    /** The sphere center in world space. */
    public worldCenter: Vector3;
    /** The sphere size in world space. */
    public worldSize: Vector3;

    /**
     * @internal
     */
    private _center = new Vector3();
    constructor(center?: Vector3, radius?: number) {
        this.center = center || new Vector3(0, 0, 0);
        this.radius = radius === undefined ? 0.5 : radius;
    }

    /**
     * Recompute the derived AABB fields (`extents`, `size`, `min`, `max`)
     * from `center` and `radius`, so a sphere can stand in wherever an
     * `IBound` is expected (frustum tests, `Ray.intersectBox`, octrees).
     */
    updateBound() {
        const r = this.radius;
        this.extents ||= new Vector3();
        this.size ||= new Vector3();
        this.min ||= new Vector3();
        this.max ||= new Vector3();
        this.extents.set(r, r, r);
        this.size.set(r * 2, r * 2, r * 2);
        this.min.set(this.center.x - r, this.center.y - r, this.center.z - r);
        this.max.set(this.center.x + r, this.center.y + r, this.center.z + r);
    }

    /**
     * Whether the given point lies inside the sphere.
     * @param point the point to test
     */
    public containsPoint(point: Vector3) {
        Vector3.sub(this.tmpVecA, point, this.center);
        var lenSq = this.center.lengthSquared;
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
        var m = this.tmpVecA.copy(ray.origin).sub(this.center);
        var b = m.dotProduct(this.tmpVecB.copy(ray.direction).normalize());
        var c = m.dotProduct(m) - this.radius * this.radius;

        // exit if ray's origin outside of sphere (c > 0) and ray pointing away from s (b > 0)
        if (c > 0 && b > 0) return null;

        var discr = b * b - c;
        // a negative discriminant corresponds to ray missing sphere
        if (discr < 0) return false;

        // ray intersects sphere, compute smallest t value of intersection
        var t = Math.abs(-b - Math.sqrt(discr));

        // if t is negative, ray started inside sphere so clamp t to zero
        if (point) point.copy(ray.direction).multiplyScalar(t).add(ray.origin);

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
        Vector3.sub(this.tmpVecA, sphere.center, this.center);
        var totalRadius = sphere.radius + this.radius;
        if (this.tmpVecA.lengthSquared <= totalRadius * totalRadius) {
            return true;
        }
        return false;
    }

    /**
     * Recompute the sphere from the given object's transform.
     * @param obj the owning object
     */
    public calculateTransform(obj: Object3D) {
        this.update(obj);
    }


    /**
     * Whether the object's sphere bound is inside the given frustum.
     * @param obj the object whose bound is tested
     * @param frustum the frustum to test against
     */
    public inFrustum(obj: Object3D, frustum: Frustum) {
        return frustum.containsSphere(obj);
    }

    /**
     * Create a copy of this bounding sphere.
     * @returns a new sphere with the same center and radius
     */
    public clone(): IBound {
        return new BoundingSphere(this.center.clone(), this.radius);
    }

    /**
     * Update the world-space center and forward direction from the object's transform.
     * @param obj the owning object
     */
    public update(obj: Object3D) {
        this.owner = obj;
        Vector3.add(this._center, obj.transform.worldMatrix.position, this.center);
        this.forward = obj.transform.forward;
    }
    /**
     * @internal
     */
    public merge(bound: IBound) {
        throw new Error('BoundingSphere merge is not ready!');
    }

    /**
     * Set the sphere from a center and radius.
     * @param center the center of the sphere
     * @param size the radius of the sphere
     */
    public setFromCenterAndSize(center: Vector3, size: number) {
        this.center.copy(center);
        this.radius = size;
        this.updateBound();
    }
}

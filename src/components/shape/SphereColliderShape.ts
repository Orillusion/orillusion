import { BoundingSphere } from "../../core/bound/BoundingSphere";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";
import { ColliderShape, ColliderShapeType, HitInfo } from "./ColliderShape";


/**
 * Spherical collision body
 * @group Collider
 */
export class SphereColliderShape extends ColliderShape {

    private readonly box: BoundingSphere;

    /**
     * radius of this collider
     */
    public radius: number = 0.5;

    /**
     * @constructor
     * @param radius radius of this collider
     */
    constructor(radius: number) {
        super();
        this._shapeType = ColliderShapeType.Sphere;
        this.radius = radius;
        this.box = new BoundingSphere(new Vector3(), 1);
    }

    /**
     * Entry point of `ray` on the sphere (exit point when the ray starts
     * inside). Point, normal and distance are world space; the local hit
     * point is in `localPoint`.
     * @param ray world-space ray
     * @param fromMatrix local → world matrix
     */
    public rayPick(ray: Ray, fromMatrix: Matrix4): HitInfo {
        let box = this.box;
        box.setFromCenterAndSize(this.center, this.radius);

        let helpMatrix = ColliderShape.helpMatrix;
        helpMatrix.copy(fromMatrix).invert();

        let helpRay = ColliderShape.helpRay.copy(ray);
        helpRay.applyMatrix(helpMatrix);

        const o = helpRay.origin, d = helpRay.direction, c = box.center, r = box.radius;
        const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
        const a = d.x * d.x + d.y * d.y + d.z * d.z;
        const b = 2 * (ox * d.x + oy * d.y + oz * d.z);
        const cc = ox * ox + oy * oy + oz * oz - r * r;
        const disc = b * b - 4 * a * cc;
        if (disc < 0 || a === 0) return null;
        const sq = Math.sqrt(disc);
        let t = (-b - sq) / (2 * a);
        if (t < 0) t = (-b + sq) / (2 * a);
        if (t < 0) return null;

        const local = ColliderShape.v3_help_0.set(o.x + d.x * t, o.y + d.y * t, o.z + d.z * t);
        const n = SphereColliderShape._normal.set(local.x - c.x, local.y - c.y, local.z - c.z);
        return ColliderShape.toWorldHit(ray, fromMatrix, helpMatrix, local, n);
    }

    private static _normal: Vector3 = new Vector3();
}

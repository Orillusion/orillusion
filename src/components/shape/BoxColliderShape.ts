import { BoundingBox } from "../../core/bound/BoundingBox";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";
import { ColliderShape, ColliderShapeType, HitInfo } from "./ColliderShape";


/**
 * Box shaped collision body.
 * It is a basic box shaped primitive collision body.
 * @group Collider
 */
export class BoxColliderShape extends ColliderShape {
    private readonly box: BoundingBox;

    /**
     * @constructor
     */
    constructor() {
        super();
        this._shapeType = ColliderShapeType.Box;
        this.box = new BoundingBox(new Vector3(), new Vector3());
    }

    /**
     * @internal
     * Entry point of `ray` on the box (exit point when the ray starts
     * inside). Point, normal and distance are world space; the local hit
     * point is in `localPoint`.
     * @param ray world-space ray
     * @param fromMatrix local → world matrix
     */
    public rayPick(ray: Ray, fromMatrix: Matrix4): HitInfo {
        let box = this.box;
        box.setFromCenterAndSize(this.center, this.size);

        let helpMatrix = ColliderShape.helpMatrix;
        helpMatrix.copy(fromMatrix).invert();

        let helpRay = ColliderShape.helpRay.copy(ray);
        helpRay.applyMatrix(helpMatrix);

        let local = helpRay.intersectBox(box, ColliderShape.v3_help_0);
        if (!local) return null;

        // Normal of the face the hit point lies on (the nearest face plane).
        const n = BoxColliderShape._normal;
        let best = Infinity;
        const faces = [
            local.x - box.min.x, box.max.x - local.x,
            local.y - box.min.y, box.max.y - local.y,
            local.z - box.min.z, box.max.z - local.z,
        ];
        let face = 0;
        for (let i = 0; i < 6; i++) {
            const d = Math.abs(faces[i]);
            if (d < best) { best = d; face = i; }
        }
        const sign = face % 2 === 0 ? -1 : 1;
        const axis = face >> 1;
        n.set(axis === 0 ? sign : 0, axis === 1 ? sign : 0, axis === 2 ? sign : 0);
        return ColliderShape.toWorldHit(ray, fromMatrix, helpMatrix, local, n);
    }

    private static _normal: Vector3 = new Vector3();
}

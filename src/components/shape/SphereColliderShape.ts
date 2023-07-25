import { BoundingSphere } from "../../core/bound/BoundingSphere";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";
import { ColliderShape, ColliderShapeType } from "./ColliderShape";


/**
 * Spherical collision body
 * @group Collider
 */
export class SphereColliderShape extends ColliderShape {

    private _pickRet: { intersect: boolean; intersectPoint?: Vector3; distance: number };
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

    public rayPick(ray: Ray, fromMatrix: Matrix4): { intersect: boolean; intersectPoint?: Vector3; distance: number } {
        let box = this.box;
        box.setFromCenterAndSize(this.center, this.radius);

        let helpMatrix = ColliderShape.helpMatrix;
        helpMatrix.copyFrom(fromMatrix).invert();

        let helpRay = ColliderShape.helpRay.copy(ray);
        helpRay.applyMatrix(helpMatrix);

        let pick = helpRay.intersectSphere(helpRay.origin, helpRay.direction, this.box.center, this.box.radius);
        if (pick) {
            if (!this._pickRet) {
                this._pickRet = { intersect: false, intersectPoint: new Vector3(), distance: 0 };
            }
            this._pickRet.intersect = true;
            this._pickRet.intersectPoint = pick;
            this._pickRet.distance = Vector3.distance(helpRay.origin, ColliderShape.v3_help_0);
            return this._pickRet;
        }
        return null;
    }
}

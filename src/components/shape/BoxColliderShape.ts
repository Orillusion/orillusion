import { BoundingBox } from "../../core/bound/BoundingBox";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector3 } from "../../math/Vector3";
import { ColliderShape, ColliderShapeType } from "./ColliderShape";


/**
 * Box shaped collision body.
 * It is a basic box shaped primitive collision body.
 * @group Collider
 */
export class BoxColliderShape extends ColliderShape {
    private _pickRet: { intersect: boolean; intersectPoint?: Vector3; distance: number };
    private readonly box: BoundingBox;

    private static v3_help_0: Vector3 = new Vector3();
    private static helpMatrix: Matrix4 = new Matrix4();
    private static helpRay: Ray = new Ray();

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
     * @param ray 
     * @param fromMatrix 
     * @returns 
     */
    public rayPick(ray: Ray, fromMatrix: Matrix4): { intersect: boolean; intersectPoint?: Vector3; distance: number } {
        let box = this.box;
        box.setFromCenterAndSize(this.center, this.size);

        let helpMatrix = BoxColliderShape.helpMatrix;
        helpMatrix.copyFrom(fromMatrix).invert();

        let helpRay = BoxColliderShape.helpRay.copy(ray);
        helpRay.applyMatrix(helpMatrix);

        let pick = helpRay.intersectBox(this.box, BoxColliderShape.v3_help_0);
        if (pick) {
            if (!this._pickRet) {
                this._pickRet = { intersect: false, intersectPoint: new Vector3(), distance: 0 };
            }
            this._pickRet.intersect = true;
            this._pickRet.intersectPoint = pick;
            this._pickRet.distance = Vector3.distance(helpRay.origin, BoxColliderShape.v3_help_0);
            return this._pickRet;
        }
        return null;
    }
}

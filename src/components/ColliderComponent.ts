import { Engine3D } from "../Engine3D";
import { Ray } from "../math/Ray";
import { Vector3 } from "../math/Vector3";
import { ComponentBase } from "./ComponentBase";
import { BoxColliderShape } from "./shape/BoxColliderShape";
import { ColliderShape } from "./shape/ColliderShape";

/**
 * collider component
 * @group Components
 */
export class ColliderComponent extends ComponentBase {
    private _shape: ColliderShape;

    constructor() {
        super();
        this._shape = new BoxColliderShape();
    }
    /**
     * @internal
     */
    public start(): void {
        if (Engine3D.setting.pick.mode == `pixel`) {
            this.transform.scene3D.view.pickFire.mouseEnableMap.set(this.transform.worldMatrix.index, this);
        }
    }

    /**
     * Returns the shape of collider
     */
    public get shape(): ColliderShape {
        return this._shape;
    }

    /**
     * Set the shape of collider
     */
    public set shape(value: ColliderShape) {
        this._shape = value;
    }

    /**
     * @internal
     * @param ray
     * @returns
     */
    public rayPick(ray: Ray): { intersect: boolean; intersectPoint?: Vector3; distance: number } {
        if (this._enable) {
            return this._shape.rayPick(ray, this.transform.worldMatrix);
        }
        return null;
    }
    /**
     * @internal
     */
    public destroy(force?: boolean) {
        if (Engine3D.setting.pick.mode == `pixel`) {
            this.transform.scene3D.view.pickFire.mouseEnableMap.delete(this.transform.worldMatrix.index);
        }
        super.destroy(force);
    }

}

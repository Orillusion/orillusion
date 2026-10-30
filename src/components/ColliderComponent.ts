import { ComponentCollect, View3D } from "..";
import { Ray } from "../math/Ray";
import { Vector3 } from "../math/Vector3";
import { ComponentBase } from "./ComponentBase";
import { BoxColliderShape } from "./shape/BoxColliderShape";
import { ColliderShape, ColliderShapeType, HitInfo } from "./shape/ColliderShape";
import type { MeshColliderShape } from "./shape/MeshColliderShape";
import { MeshRenderer } from "./renderer/MeshRenderer";

/**
 * collider component
 * @group Collider
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
        const view = this.transform.scene3D?.view;
        if (view?.engine3D?.setting.pick.mode == `pixel`) {
            view.pickFire.mouseEnableMap.set(this.transform.worldMatrix.index, this);
        }
    }

    public onEnable(view?: View3D) {
        ComponentCollect.bindEnablePick(view, this, null);
    }

    public onDisable(view?: View3D) {
        ComponentCollect.unBindEnablePick(view, this);
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
    public rayPick(ray: Ray): HitInfo {
        if (this._enable) {
            const shape = this._shape;
            if (shape.shapeType === ColliderShapeType.Mesh) {
                const meshShape = shape as MeshColliderShape;
                if (!meshShape.mesh || !meshShape.renderer) {
                    // A mesh collider without a mesh picks the geometry drawn by
                    // this object; knowing the renderer lets skinned / morphed
                    // meshes be picked as drawn.
                    const renderer = this._renderer();
                    if (!meshShape.mesh) meshShape.mesh = renderer ? renderer.geometry : null;
                    if (renderer && renderer.geometry === meshShape.mesh) meshShape.renderer = renderer;
                }
            }
            return shape.rayPick(ray, this.transform.worldMatrix);
        }
        return null;
    }

    private _renderer(): MeshRenderer {
        let renderer: MeshRenderer = null;
        this.object3D.components.forEach(c => {
            if (!renderer && c instanceof MeshRenderer && c.geometry) renderer = c;
        });
        return renderer;
    }

    public beforeDestroy(force?: boolean) {
        const view = this.transform.scene3D?.view;
        if (view?.engine3D?.setting.pick.mode == `pixel`) {
            view.pickFire.mouseEnableMap.delete(this.transform.worldMatrix.index);
        }
        super.beforeDestroy(force);
    }

}

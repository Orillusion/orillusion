import { View3D } from "../../../core/View3D";
import { BillboardComponent } from "../../BillboardComponent";
import { BillboardType, GUISpace } from "../GUIConfig";
import { GUIMesh } from "../core/GUIMesh";
import { UIComponentBase } from "./UIComponentBase";

/**
 * Container for UI components
 * @group GPU GUI
 */
export class UIPanel extends UIComponentBase {
    public order: number;
    public readonly space: number = GUISpace.World;
    public needUpdateGeometry: boolean = true;
    public panelOrder: number = 0;
    public needSortOnCameraZ?: boolean;
    protected _mesh: GUIMesh;
    protected _billboard: BillboardComponent;

    public readonly isUIPanel = true;
    public get guiMesh(): GUIMesh {
        return this._mesh;
    }

    start() {
        // throw new Error("Method not implemented.");
    }
    stop() {
        // throw new Error("Method not implemented.");
    }
    onEnable?(view?: View3D) {
        // throw new Error("Method not implemented.");
    }
    onDisable?(view?: View3D) {
        // throw new Error("Method not implemented.");
    }

    onBeforeUpdate?(view?: View3D) {
        // throw new Error("Method not implemented.");
    }
    onCompute?(view?: View3D, command?: GPUCommandEncoder) {
        // throw new Error("Method not implemented.");
    }
    onGraphic?(view?: View3D) {
        // throw new Error("Method not implemented.");
    }

    destroy(force?: boolean) {
        // throw new Error("Method not implemented.");
    }
    public copyComponent(from: this): this {
        this.visible = from.visible;
        this.order = from.order;
        this.panelOrder = from.panelOrder;
        this.needSortOnCameraZ = from.needSortOnCameraZ;
        this.cullMode = from.cullMode;
        this.billboard = from.billboard;
        return this;
    }

    init(param?: any) {
        super.init(param);
        this._mesh = new GUIMesh(this.space, param);
        this.object3D.addChild(this._mesh);
    }

    public set billboard(type: BillboardType) {
        if (this.space == GUISpace.View) {
            type = BillboardType.None;
        } else {
            console.warn('Cannot enable billboard in view space');
        }
        if (type == BillboardType.BillboardXYZ || type == BillboardType.BillboardY) {
            this._billboard = this._mesh.getOrAddComponent(BillboardComponent);
            this._billboard.type = type;
        } else {
            this._mesh.removeComponent(BillboardComponent);
            this._billboard = null;
        }
    }

    public get billboard() {
        return this._billboard?.type;
    }

    public set cullMode(value: GPUCullMode) {
        if (this.space == GUISpace.World) {
            this._mesh.uiRenderer.material.cullMode = value;
        } else {
            console.warn('Cannot change cullMode in view space');
        }
    }

    public get cullMode() {
        return this._mesh.uiRenderer.material.cullMode;
    }

}

import { View3D } from "../../..";
import { GUISpace } from "../GUIConfig";
import { GUIMesh } from "../core/GUIMesh";
import { UIComponentBase } from "./UIComponentBase";

//Container for UI components
export class UIPanel extends UIComponentBase {
    public order: number;
    public space: number = GUISpace.World;
    public needUpdateGeometry: boolean = true;
    public panelOrder: number = 0;
    public needSortOnCameraZ?: boolean;
    protected _mesh: GUIMesh;

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
    onUpdate?(view?: View3D) {
        // throw new Error("Method not implemented.");
    }
    onLateUpdate?(view?: View3D) {
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
        return this;
    }

    init(param?: any) {
        super.init(param);
        this._mesh = new GUIMesh(this.space, param);
        this.object3D.addChild(this._mesh);
    }

}

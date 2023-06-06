import { Object3D, UITransform, View3D } from "../../..";
import { BillboardComponent } from "../../BillboardComponent";
import { BillboardType, GUISpace } from "../GUIConfig";
import { GUIMesh } from "../core/GUIMesh";
import { UIImage } from "./UIImage";

/**
 * Container for UI components
 * @group GPU GUI
 */
export class UIPanel extends UIImage {
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

    public cloneTo(obj: Object3D): void {
        let component = obj.addComponent(UIPanel);
        component.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
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
        this.visible = false;
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
        return this._billboard ? this._billboard.type : BillboardType.None;
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

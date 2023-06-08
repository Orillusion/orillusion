import { View3D } from "../../../core/View3D";
import { Object3D } from "../../../core/entities/Object3D";
import { webGPUContext } from "../../../gfx/graphics/webGpu/Context3D";
import { BillboardComponent } from "../../BillboardComponent";
import { BillboardType, GUIConfig, GUISpace } from "../GUIConfig";
import { GUICanvas } from "../core/GUICanvas";
import { GUIGeometryRebuild } from "../core/GUIGeometryRebuild";
import { GUIMesh } from "../core/GUIMesh";
import { UIImage } from "./UIImage";
import { UITransform } from "./UITransform";

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
    private _rebuild: GUIGeometryRebuild;

    public scissorEnable: boolean = false;
    public scissorCornerRadius: number = 0;
    public scissorFadeOutSize: number = 0;

    public readonly isUIPanel = true;

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
        //scissor
        this.scissorEnable = from.scissorEnable;
        this.scissorCornerRadius = from.scissorCornerRadius;
        this.scissorFadeOutSize = from.scissorFadeOutSize;

        return this;
    }

    init(param?: any) {
        super.init(param);
        this._mesh = new GUIMesh(this.space);
        this.object3D.addChild(this._mesh);
        this.visible = false;
        this._rebuild = new GUIGeometryRebuild();
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

    public onUpdate(view?: View3D) {
        super.onUpdate?.(view);
        this.rebuildGUIMesh(view);
    }

    private _collectTransform: UITransform[] = [];
    private rebuildGUIMesh(view: View3D) {
        let panel = this;
        let camera = view?.camera;
        let screenWidth = webGPUContext.canvas.clientWidth;
        let screenHeight = webGPUContext.canvas.clientHeight;
        let transforms: UITransform[] = panel._collectTransform;
        transforms.length = 0;
        panel.object3D.getComponents(UITransform, transforms);
        if (transforms.length > 0) {
            this._rebuild.build(transforms, this._mesh, panel.needUpdateGeometry);
            this._mesh.updateGUIData(screenWidth, screenHeight, camera);
            for (const t of transforms) {
                t.needUpdateQuads = false;
            }
        }

        //calc render order
        let canvas = panel.object3D.getComponentFromParent(GUICanvas);
        let canvasIndex = canvas ? canvas.index : 0;
        this._mesh.uiRenderer.enable = transforms.length > 0;

        let renderStart = panel['isViewPanel'] ? GUIConfig.SortOrderStartView : GUIConfig.SortOrderStartWorld;
        this._mesh.uiRenderer.renderOrder = canvasIndex * GUIConfig.SortOrderCanvasSpan + renderStart + panel.panelOrder;
        this._mesh.uiRenderer.needSortOnCameraZ = panel.needSortOnCameraZ;

        //update material
        let material = this._mesh['_uiMaterial'];
        material.setLimitVertex(this._mesh.limitVertexCount);
        material.setScissorEnable(panel.scissorEnable);
        if (panel.scissorEnable) {
            let maskQuad = panel.mainQuads[0];
            material.setScissorRect(maskQuad.left, maskQuad.bottom, maskQuad.right, maskQuad.top);
            material.setScissorCorner(panel.scissorCornerRadius, panel.scissorFadeOutSize);
        }

        //clear flag
        panel.needUpdateGeometry = false;
    }

}

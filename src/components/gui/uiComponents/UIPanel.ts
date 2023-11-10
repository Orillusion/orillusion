import { BoundingBox, Vector3 } from "../../..";
import { View3D } from "../../../core/View3D";
import { Object3D } from "../../../core/entities/Object3D";
import { webGPUContext } from "../../../gfx/graphics/webGpu/Context3D";
import { BillboardComponent } from "../../BillboardComponent";
import { BillboardType, GUIConfig, GUISpace } from "../GUIConfig";
import { GUICanvas } from "../core/GUICanvas";
import { GUIGeometry } from "../core/GUIGeometry";
import { GUIGeometryRebuild } from "../core/GUIGeometryRebuild";
import { GUIMaterial } from "../core/GUIMaterial";
import { GUIRenderer } from "../core/GUIRenderer";
import { UIImage } from "./UIImage";
import { UITransform } from "./UITransform";

/**
 * Container for UI components
 * @group GPU GUI
 */
export class UIPanel extends UIImage {
    public readonly space: number = GUISpace.World;
    public needUpdateGeometry: boolean = true;
    public panelOrder: number = 0;
    public needSortOnCameraZ?: boolean;
    protected _billboard: BillboardComponent;
    private _rebuild: GUIGeometryRebuild;

    public scissorEnable: boolean = false;
    public scissorCornerRadius: number = 0;
    public scissorFadeOutSize: number = 0;

    protected _uiRenderer: GUIRenderer;
    protected _geometry: GUIGeometry;
    protected _maxCount: number = 128;

    public readonly isUIPanel = true;

    public cloneTo(obj: Object3D): void {
        let component = obj.getOrAddComponent(UIPanel);
        component.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
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
        this.create(this.space);
        this.visible = false;
    }

    public updateDrawCallSegment(index: number, indexStart: number, indexCount: number) {
        this._geometry.updateSubGeometry(index, indexStart, indexCount);
        let firstMaterial = this._uiRenderer.material;
        let newMaterial: GUIMaterial = this._uiRenderer.materials[index] as GUIMaterial;
        if (!newMaterial) {
            newMaterial = new GUIMaterial(this.space);
            let newMaterials = this._uiRenderer.materials.slice();
            newMaterials.push(newMaterial);
            this._uiRenderer.materials = newMaterials;
            newMaterial.cullMode = firstMaterial.cullMode;
            newMaterial.depthCompare = firstMaterial.depthCompare;
        }
    }

    private create(space: GUISpace) {
        this._maxCount = this.space == GUISpace.World ? GUIConfig.quadMaxCountForWorld : GUIConfig.quadMaxCountForView;
        this._uiRenderer = this.object3D.addComponent(GUIRenderer);
        this._geometry = this._uiRenderer.geometry = new GUIGeometry(this._maxCount).create();
        this._uiRenderer.material = new GUIMaterial(space);
        this._uiRenderer.renderOrder = GUIConfig.SortOrderStartWorld;

        this._rebuild = new GUIGeometryRebuild();
        this.object3D.bound = new BoundingBox(new Vector3(), new Vector3(1, 1, 1).multiplyScalar(Number.MAX_VALUE * 0.1));
    }

    /**
    * Return How many Quads can a single GUIGeometry support at most
    */
    public get quadMaxCount(): number {
        return this._maxCount;
    }

    public set billboard(type: BillboardType) {
        if (this.space == GUISpace.View) {
            type = BillboardType.None;
        } else {
            console.warn('Cannot enable billboard in view space');
        }
        if (type == BillboardType.BillboardXYZ || type == BillboardType.BillboardY) {
            this._billboard = this.object3D.getOrAddComponent(BillboardComponent);
            this._billboard.type = type;
        } else {
            this.object3D.removeComponent(BillboardComponent);
            this._billboard = null;
        }
    }

    public get billboard() {
        return this._billboard ? this._billboard.type : BillboardType.None;
    }

    public set cullMode(value: GPUCullMode) {
        if (this.space == GUISpace.World) {
            for (let item of this._uiRenderer.materials) {
                item.cullMode = value;
            }
        } else {
            console.warn('Cannot change cullMode in view space');
        }
    }

    public get cullMode() {
        return this._uiRenderer.material.cullMode;
    }

    public onUpdate(view?: View3D) {
        super.onUpdate?.(view);
        this.rebuildGUIMesh(view);
    }

    private _collectTransform: UITransform[] = [];
    private rebuildGUIMesh(view: View3D) {
        let panel = this;

        let transforms: UITransform[] = panel._collectTransform;
        transforms.length = 0;
        panel.object3D.getComponents(UITransform, transforms);
        if (transforms.length > 0) {
            panel._rebuild.build(transforms, panel, panel.needUpdateGeometry);
            for (const t of transforms) {
                t.needUpdateQuads = false;
            }
        }

        //calc render order
        let canvas = panel.object3D.getComponentFromParent(GUICanvas);
        let canvasIndex = canvas ? canvas.index : 0;
        panel._uiRenderer.enable = transforms.length > 0;

        let renderStart = panel['isViewPanel'] ? GUIConfig.SortOrderStartView : GUIConfig.SortOrderStartWorld;
        panel._uiRenderer.renderOrder = canvasIndex * GUIConfig.SortOrderCanvasSpan + renderStart + panel.panelOrder;
        panel._uiRenderer.needSortOnCameraZ = panel.needSortOnCameraZ;

        //update material
        for (let item of panel['_uiRenderer'].materials) {
            let material = item as GUIMaterial;
            material.setGUISolution(GUIConfig.solution, GUIConfig.pixelRatio);
            material.setScreenSize(webGPUContext.canvas.clientWidth, webGPUContext.canvas.clientHeight);
            material.setScissorEnable(panel.scissorEnable);
            if (panel.scissorEnable) {
                let maskQuad = panel.mainQuads[0];
                material.setScissorRect(maskQuad.left, maskQuad.bottom, maskQuad.right, maskQuad.top);
                material.setScissorCorner(panel.scissorCornerRadius, panel.scissorFadeOutSize);
            }
        }


        //clear flag
        panel.needUpdateGeometry = false;
    }

}

import { View3D } from "../../../core/View3D";
import { webGPUContext } from "../../../gfx/graphics/webGpu/Context3D";
import { BillboardComponent } from "../../BillboardComponent";
import { BillboardType, GUIConfig, GUISpace } from "../GUIConfig";
import { GUIGeometryRebuild } from "../core/GUIGeometryRebuild";
import { GUIMaterial } from "../core/GUIMaterial";
import { GUIMesh } from "../core/GUIMesh";
import { UIComponentBase } from "./UIComponentBase";
import { UITransform } from "./UITransform";

/**
 * Container for UI components, and it rebuld gui mesh
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
    private _rebuild: GUIGeometryRebuild;

    public readonly isUIPanel = true;
    public get guiMesh(): GUIMesh {
        return this._mesh;
    }

    start() {
        super.start?.();
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
        this._rebuild = new GUIGeometryRebuild();
    }

    public set billboard(type: BillboardType) {
        if (this.space == GUISpace.View) {
            type = BillboardType.Normal;
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

    onUpdate?(view?: View3D) {
        super.onUpdate?.(view);
        this.rebuildMesh(view);
    }

    private _childrenTransfrom: UITransform[];
    private rebuildMesh(view?: View3D): void {
        let screenWidth = webGPUContext.canvas.clientWidth;
        let screenHeight = webGPUContext.canvas.clientHeight;
        let camera = view?.camera;

        let mesh: GUIMesh = this.guiMesh;
        this._childrenTransfrom ||= [];
        this._childrenTransfrom.length = 0;
        let transforms: UITransform[] = this.object3D.getComponents(UITransform, this._childrenTransfrom);
        if (transforms.length > 0) {
            this._rebuild.build(transforms, mesh, this.needUpdateGeometry);
            mesh.updateGUIData(screenWidth, screenHeight, camera);
            for (const t of transforms) {
                t.needUpdateQuads = false;
            }
        }
        mesh.uiRenderer.enable = transforms.length > 0;
        let start = this['isViewPanel'] ? GUIConfig.SortOrderStartView : GUIConfig.SortOrderStartWorld;
        mesh.uiRenderer.renderOrder = start + this.panelOrder;
        mesh.uiRenderer.needSortOnCameraZ = this.needSortOnCameraZ;
        (this.guiMesh.uiRenderer.material as GUIMaterial).setLimitVertex(mesh.limitVertexCount);
        this.needUpdateGeometry = false;
    }

}

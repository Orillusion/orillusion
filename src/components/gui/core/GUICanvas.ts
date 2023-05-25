import { Object3D } from "../../../core/entities/Object3D";
import { webGPUContext } from "../../../gfx/graphics/webGpu/Context3D";
import { Ctor } from "../../../util/Global";
import { ComponentBase } from "../../ComponentBase";
import { GUIConfig } from "../GUIConfig";
import { UIPanel } from "../uiComponents/UIPanel";
import { UITransform } from "../uiComponents/UITransform";
import { ViewPanel } from "../uiComponents/ViewPanel";
import { WorldPanel } from "../uiComponents/WorldPanel";
import { GUIGeometryRebuild } from "./GUIGeometryRebuild";
import { GUIMesh } from "./GUIMesh";

export class GUICanvas extends ComponentBase {
    private _rebuild: GUIGeometryRebuild;

    init() {
        super.init();
        this._rebuild = new GUIGeometryRebuild();
    }

    /**
     *
     * Add an Object3D
     * @param child Object3D
     * @returns
     */
    public addChild(child: Object3D): this {
        this.object3D.addChild(child);
        return this;
    }

    /**
    *
    * Remove the child
    * @param child Removed Object3D
    */
    public removeChild(child: Object3D): this {
        this.object3D.removeChild(child);
        return this;
    }

    onUpdate() {
        this.rebuildGUIMesh();
    }

    private rebuildGUIMesh() {
        this.buildGUIMesh(WorldPanel);
        this.buildGUIMesh(ViewPanel);
    }

    private buildGUIMesh(ctor: Ctor<UIPanel>): void {
        let camera = this.object3D?.transform?.view3D?.camera;

        let screenWidth = webGPUContext.canvas.clientWidth;
        let screenHeight = webGPUContext.canvas.clientHeight;
        let panelList = this.object3D.getComponentsExt(ctor);

        panelList.forEach(panel => {
            let guiMesh: GUIMesh = panel.guiMesh;
            let transforms: UITransform[] = panel.object3D.getComponents(UITransform);
            if (transforms.length > 0) {
                this._rebuild.build(transforms, guiMesh, panel.needUpdateGeometry);
                guiMesh.updateGUIData(screenWidth, screenHeight, camera);
                for (const t of transforms) {
                    t.needUpdateQuads = false;
                }
            }
            // panel.guiMesh.enable = transforms.length > 0;
            guiMesh.uiRenderer.enable = transforms.length > 0;
            guiMesh.uiRenderer.renderOrder = GUIConfig.SortOrderStart + panel.panelOrder;
            guiMesh.uiRenderer.needSortOnCameraZ = panel.needSortOnCameraZ;
            panel.needUpdateGeometry = false;
        });
    }

    public cloneTo(obj: Object3D) {
        console.error('UICanvas Can not be Clone!');
    }
}

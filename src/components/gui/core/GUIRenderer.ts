import { View3D } from "../../../core/View3D";
import { ClusterLightingBuffer } from "../../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";
import { RendererMask } from "../../../gfx/renderJob/passRenderer/state/RendererMask";
import { RendererPassState } from "../../../gfx/renderJob/passRenderer/state/RendererPassState";
import { RendererType } from "../../../gfx/renderJob/passRenderer/state/RendererType";
import { MeshRenderer } from "../../renderer/MeshRenderer";
import { GUIGeometry } from "./GUIGeometry";
import { GUIMaterial } from "./GUIMaterial";

/**
 * GUI Renderer
 * Used to update Geometry and Buffer.
 * @group GUI
 */
export class GUIRenderer extends MeshRenderer {

    protected _guiGeometry: GUIGeometry;

    /**
     * init renderer
     * @param param {count:number, space: GUISpace}
     * @returns
     */
    init(param?: any) {
        super.init();
        this.addRendererMask(RendererMask.UI);

        this.removeRendererMask(RendererMask.Default);
        let { count, space } = param;

        this._guiGeometry = new GUIGeometry(count).create();
        this.geometry = this._guiGeometry;
        this.material = new GUIMaterial(space);
        this.castGI = false;
        this.castShadow = false;
        this.alwaysRender = true;

        this._ignoreEnvMap = this._ignorePrefilterMap = true;
    }

    /**
     * @internal
     * @param view
     * @param rendererType
     * @param renderPassState
     * @param clusterLightingBuffer
     */
    public nodeUpdate(view: View3D, rendererType: RendererType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        for (let i = 0; i < this.materials.length; i++) {
            const material = this.materials[i];
            let passes = material.renderPasses.get(rendererType);
            let vp = this._guiGeometry.vPositionBuffer;
            let vu = this._guiGeometry.vUniformBuffer;
            if (passes) {
                for (let j = 0; j < passes.length; j++) {
                    const renderShader = passes[j].renderShader;
                    if (!renderShader.pipeline) {
                        renderShader.setStorageBuffer('vPositionBuffer', vp);
                        renderShader.setStorageBuffer('vUniformBuffer', vu);
                    }
                }
            }
        }
        super.nodeUpdate(view, rendererType, renderPassState, clusterLightingBuffer);
    }

    public onUpdate(view?: View3D) {
        this.transform.updateWorldMatrix();
    }

}

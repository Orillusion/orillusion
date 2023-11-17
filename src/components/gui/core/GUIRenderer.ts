import { GeometryBase } from "../../..";
import { View3D } from "../../../core/View3D";
import { ClusterLightingBuffer } from "../../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";
import { RendererMask } from "../../../gfx/renderJob/passRenderer/state/RendererMask";
import { RendererPassState } from "../../../gfx/renderJob/passRenderer/state/RendererPassState";
import { PassType } from "../../../gfx/renderJob/passRenderer/state/RendererType";
import { MeshRenderer } from "../../renderer/MeshRenderer";
import { GUIGeometry } from "./GUIGeometry";

/**
 * GUI Renderer
 * Used to update Geometry and Buffer.
 * @group GPU GUI
 */
export class GUIRenderer extends MeshRenderer {

    protected _guiGeometry: GUIGeometry;

    /**
     * init renderer
     * @returns
     */
    init(param?: any) {
        super.init();
        this.addRendererMask(RendererMask.UI);

        this.removeRendererMask(RendererMask.Default);

        this.castGI = false;
        this.castShadow = false;
        this.alwaysRender = true;

        this._ignoreEnvMap = this._ignorePrefilterMap = true;
    }

    public get geometry(): GeometryBase {
        return super.geometry;
    }
    public set geometry(value: GeometryBase) {
        super.geometry = value;
        this._guiGeometry = value as GUIGeometry;
    }

    /**
     * @internal
     * @param view
     * @param rendererType
     * @param renderPassState
     * @param clusterLightingBuffer
     */
    public nodeUpdate(view: View3D, rendererType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        for (let i = 0; i < this.materials.length; i++) {
            const material = this.materials[i];
            let passes = material.getPass(rendererType);
            let vPosition = this._guiGeometry.getPositionBuffer();
            let vSprite = this._guiGeometry.getSpriteBuffer();
            let vColor = this._guiGeometry.getColorBuffer();
            if (passes) {
                for (let j = 0; j < passes.length; j++) {
                    const renderShader = passes[j];
                    if (!renderShader.pipeline) {
                        renderShader.setStorageBuffer('vPositionBuffer', vPosition);
                        renderShader.setStorageBuffer('vSpriteBuffer', vSprite);
                        renderShader.setStorageBuffer('vColorBuffer', vColor);
                    }
                }
            }
        }
        super.nodeUpdate(view, rendererType, renderPassState, clusterLightingBuffer);
    }

    public onUpdate(view?: View3D) {
        // this.transform.updateWorldMatrix();
    }

}

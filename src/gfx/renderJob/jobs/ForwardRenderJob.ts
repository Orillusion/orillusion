import { Engine3D } from '../../../Engine3D';
import { View3D } from '../../../core/View3D';
import { GlobalBindGroup } from '../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { ColorPassRenderer } from '../passRenderer/color/ColorPassRenderer';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RendererJob } from './RendererJob';
import { DDGIProbeRenderer } from '../passRenderer/ddgi/DDGIProbeRenderer';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { RTResourceConfig } from '../config/RTResourceConfig';
import { RTResourceMap } from '../frame/RTResourceMap';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { GUIPassRenderer } from '../passRenderer/color/GUIPassRenderer';
/**
 * Forward+
 * Every time a forward rendering is performed, 
 * the entity of the object is rendered, and 
 * the color and depth buffer values are calculated. 
 * The depth buffer will determine whether a tile is visible. 
 * If visible, the values in the color buffer will be updated.
 * @group engine3D
 */
export class ForwardRenderJob extends RendererJob {
    constructor(view: View3D) {
        super(view);
    }

    public start(): void {
        super.start();
        {
            let colorPassRenderer = new ColorPassRenderer();
            let rtFrame = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer);

            if (Engine3D.setting.render.zPrePass) {
                rtFrame.zPreTexture = this.depthPassRenderer.rendererPassState.depthTexture;
            }

            colorPassRenderer.setRenderStates(rtFrame);

            if (Engine3D.setting.gi.enable) {
                let lightEntries = GlobalBindGroup.getLightEntries(this.view.scene);
                this.ddgiProbeRenderer = new DDGIProbeRenderer(lightEntries.irradianceVolume);
                this.ddgiProbeRenderer.setInputTexture([
                    this.shadowMapPassRenderer.depth2DArrayTexture,
                    this.pointLightShadowRenderer.cubeArrayTexture
                ]);
                colorPassRenderer.setIrradiance(this.ddgiProbeRenderer.irradianceColorMap, this.ddgiProbeRenderer.irradianceDepthMap);
                this.rendererMap.addRenderer(this.ddgiProbeRenderer);
            }

            this.rendererMap.addRenderer(colorPassRenderer);
        }

        {
            let guiFrame = GBufferFrame.getGUIBufferFrame();
            let guiPassRenderer = new GUIPassRenderer();
            guiPassRenderer.setRenderStates(guiFrame);
            this.rendererMap.addRenderer(guiPassRenderer);
        }

        if (Engine3D.setting.render.debug) {
            this.debug();
        }
    }

    /**
     * @internal
     */
    public debug() {
    }

}

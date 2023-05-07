import { Engine3D } from '../../../Engine3D';
import { View3D } from '../../../core/View3D';
import { GlobalBindGroup } from '../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { ColorPassRenderer } from '../passRenderer/color/ColorPassRenderer';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RendererJob } from './RendererJob';
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
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        {
            let debugTextures = [];
            let colorPassRenderer = new ColorPassRenderer();

            if (Engine3D.setting.render.zPrePass) {
                rtFrame.zPreTexture = this.depthPassRenderer.rendererPassState.depthTexture;
            }

            colorPassRenderer.setRenderStates(rtFrame);

            // if (Engine3D.setting.gi.enable) {
                // this.ddgiProbeRenderer = new DDGIProbeRenderer(GlobalBindGroup.getLightEntries(this.view.scene).irradianceVolume);
                // this.ddgiProbeRenderer.clusterLightingRender = this.clusterLightingRender;
                // this.ddgiProbeRenderer.setInputTexture([
                //     this.shadowMapPassRenderer.depth2DTextureArray,
                //     this.pointLightShadowRenderer.cubeTextureArray
                // ]);

                // colorPassRenderer.setIrradiance(this.ddgiProbeRenderer.irradianceColorMap, this.ddgiProbeRenderer.irradianceDepthMap);

                // this.rendererMap.addRenderer(this.ddgiProbeRenderer);

                // debugTextures.push(
                //     this.ddgiProbeRenderer.positionMap,
                //     this.ddgiProbeRenderer.normalMap,
                //     this.ddgiProbeRenderer.colorMap,
                //     this.ddgiProbeRenderer.lightingPass.lightingTexture,
                //     this.ddgiProbeRenderer.irradianceColorMap,
                //     this.ddgiProbeRenderer.irradianceDepthMap,
                // );
            // }

            if (this.postRenderer) {
                this.postRenderer.setDebugTexture(debugTextures);
            }

            this.rendererMap.addRenderer(colorPassRenderer);
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

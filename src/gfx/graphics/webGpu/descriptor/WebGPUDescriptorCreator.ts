import { RTFrame } from '../../../renderJob/frame/RTFrame';
import { RTResourceConfig } from '../../../renderJob/config/RTResourceConfig';
import { GPUTextureFormat } from '../WebGPUConst';
import { webGPUContext } from '../Context3D';
import { RendererPassState } from '../../../renderJob/passRenderer/state/RendererPassState';
import { CResizeEvent } from '../../../../event/CResizeEvent';
import { GBufferFrame } from '../../../renderJob/frame/GBufferFrame';
/**
 * @internal
 * @author sirxu
 */
export class WebGPUDescriptorCreator {

    private static rendererPassState: Map<RTFrame, RendererPassState> = new Map<RTFrame, RendererPassState>();
    public static createRendererPassState(rtFrame: RTFrame, loadOp: GPULoadOp = null) {
        let rps: RendererPassState = WebGPUDescriptorCreator.rendererPassState.get(rtFrame);
        if (!rps) {
            rps = new RendererPassState();
            rps.label = rtFrame.label;
            rps.customSize = rtFrame.customSize;
            rps.rtFrame = rtFrame;
            rps.zPreTexture = rtFrame.zPreTexture;
            rps.depthTexture = rtFrame.depthTexture;
            rps.depthViewIndex = rtFrame.depthViewIndex;
            rps.isOutTarget = rtFrame.isOutTarget;
            rps.depthCleanValue = rtFrame.depthCleanValue;
            rps.depthLoadOp = rtFrame.depthLoadOp;
            WebGPUDescriptorCreator.rendererPassState.set(rtFrame, rps);
        }

        if (rtFrame && rtFrame.renderTargets.length > 0) {
            rps.renderTargets = rtFrame.renderTargets;
            rps.rtTextureDescriptors = rtFrame.rtDescriptors;
            rps.renderPassDescriptor = WebGPUDescriptorCreator.getRenderPassDescriptor(rps);
            if (rps.renderPassDescriptor.depthStencilAttachment) {
                rps.renderPassDescriptor.depthStencilAttachment.depthLoadOp = rtFrame.depthLoadOp;
            }
            if (loadOp == 'load' && rtFrame?.renderTargets[0] && rtFrame.renderTargets[0].name.startsWith(GBufferFrame.gui_GBuffer)) {
                rps.renderPassDescriptor.colorAttachments[0].loadOp = 'load'
            }
            rps.depthLoadOp = rtFrame.depthLoadOp;
            rps.renderBundleEncoderDescriptor = WebGPUDescriptorCreator.getRenderBundleDescriptor(rps);
            rps.renderTargetTextures = [];
            for (let i = 0; i < rtFrame.renderTargets.length; i++) {
                const element = rtFrame.renderTargets[i];
                rps.renderTargetTextures[i] = {
                    format: element.format,
                };
                if (element.name.indexOf(RTResourceConfig.colorBufferTex_NAME) != -1) {
                    rps.outColor = i;
                }
            }

        } else {
            rps.renderPassDescriptor = WebGPUDescriptorCreator.getRenderPassDescriptor(rps, loadOp);
            rps.renderBundleEncoderDescriptor = WebGPUDescriptorCreator.getRenderBundleDescriptor(rps);
            // if(!rps.customSize){
            rps.renderTargetTextures = [
                {
                    format: webGPUContext.presentationFormat,
                },
            ];
            // }
            rps.outColor = 0;
        }
        return rps;
    }

    /**
     * Get RenderPass Descriptor
     * Use AttachMentTextures , Texture Format Is Key
     * @param attachMentTextures
     * @param useDepth
     * @param cleanColor
     * @returns
     */
    // static getRenderPassDescriptor(attachMentTextures: VirtualTexture[], renderPassState:RenderPassState): any {
    public static getRenderPassDescriptor(renderPassState: RendererPassState, loadOp: GPULoadOp = null): any {
        if (renderPassState.renderPassDescriptor) return renderPassState.renderPassDescriptor;
        let device = webGPUContext.device;
        let presentationSize = webGPUContext.presentationSize;
        let attachMentTexture = [];

        let size = [];
        if (renderPassState.renderTargets && renderPassState.renderTargets.length > 0) {
            size = [renderPassState.renderTargets[0].width, renderPassState.renderTargets[0].height];
            for (let i = 0; i < renderPassState.renderTargets.length; i++) {
                const texture = renderPassState.renderTargets[i];
                const rtDesc = renderPassState.rtTextureDescriptors[i];
                attachMentTexture.push({
                    view: texture.getGPUView(),
                    resolveTarget: undefined,
                    loadOp: rtDesc.loadOp,// webGPUContext.canvasConfig && webGPUContext.canvasConfig.alpha ? `load` : `clear`,
                    clearValue: rtDesc.clearValue,
                    storeOp: rtDesc.storeOp,
                });
            }
        } else {
            if (!renderPassState.customSize) {
                let clearValue = webGPUContext.canvasConfig && webGPUContext.canvasConfig.alpha ? [1.0, 1.0, 1.0, 0.0] : [0.0, 0.0, 0.0, 1.0]
                size = presentationSize;
                if (renderPassState.isOutTarget == true) {
                    attachMentTexture.push({
                        view: undefined,
                        resolveTarget: undefined,
                        loadOp: (webGPUContext.canvasConfig && webGPUContext.canvasConfig.alpha) || loadOp != null ? `load` : `clear`,
                        clearValue: clearValue,
                        storeOp: 'store',
                    });
                }
            }
        }

        let renderPassDescriptor: GPURenderPassDescriptor = null;
        if (renderPassState.depthTexture || renderPassState.zPreTexture) {
            //if set zPreTexture
            if (renderPassState.zPreTexture) {
                renderPassState.depthTexture = renderPassState.zPreTexture;
            }

            renderPassDescriptor = {
                label: `${renderPassState.label} renderPassDescriptor zPreTexture${renderPassState.zPreTexture ? `load` : `clear`}`,
                colorAttachments: attachMentTexture,
                depthStencilAttachment: {
                    view: renderPassState.depthTexture.getGPUView() as GPUTextureView,
                    depthLoadOp: renderPassState.zPreTexture ? `load` : renderPassState.depthLoadOp,
                    depthClearValue: renderPassState.zPreTexture ? 1 : renderPassState.depthCleanValue,
                    depthStoreOp: "store",
                    // stencilClearValue: 0,
                    // stencilLoadOp: 'clear',
                    // stencilStoreOp: 'store',
                },
            };
        } else {
            renderPassDescriptor = {
                colorAttachments: attachMentTexture,
                label: 'renderPassDescriptor not writeDepth',
            };
        }
        renderPassState.renderPassDescriptor = renderPassDescriptor;
        return renderPassDescriptor;
    }

    /**
     * Get RenderPass Descriptor
     * Use AttachMentTextures , Texture Format Is Key
     * @param attachMentTextures
     * @param useDepth
     * @param cleanColor
     * @returns
     */
    public static getRenderBundleDescriptor(renderPassState: RendererPassState): GPURenderBundleEncoderDescriptor {
        if (renderPassState.renderBundleEncoderDescriptor) return renderPassState.renderBundleEncoderDescriptor;
        let presentationSize = webGPUContext.presentationSize;
        let attachMentTexture = [];
        let size = [];
        if (renderPassState.renderTargets && renderPassState.renderTargets.length > 0) {
            size = [renderPassState.renderTargets[0].width, renderPassState.renderTargets[0].height];
            for (let i = 0; i < renderPassState.renderTargets.length; i++) {
                const renderTarget = renderPassState.renderTargets[i];
                attachMentTexture.push(renderTarget.format);
            }
        } else {
            size = presentationSize;
            // attachMentTexture.push(GPUTextureFormat.bgra8unorm);
            // attachMentTexture.push();
        }

        let renderPassDescriptor: GPURenderBundleEncoderDescriptor = null;
        if (renderPassState.depthTexture) {
            renderPassDescriptor = {
                colorFormats: attachMentTexture,
                depthStencilFormat: renderPassState.depthTexture.format,
            };
        } else {
            renderPassDescriptor = {
                colorFormats: attachMentTexture,
            };
        }
        renderPassState.renderBundleEncoderDescriptor = renderPassDescriptor;
        return renderPassState.renderBundleEncoderDescriptor;
    }
}

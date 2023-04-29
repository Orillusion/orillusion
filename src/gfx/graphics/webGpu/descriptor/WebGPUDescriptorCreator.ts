import { RTFrame } from '../../../renderJob/frame/RTFrame';
import { RTResourceConfig } from '../../../renderJob/config/RTResourceConfig';
import { GPUTextureFormat } from '../WebGPUConst';
import { webGPUContext } from '../Context3D';
import { RendererPassState } from '../../../renderJob/passRenderer/state/RendererPassState';
/**
 * @internal
 * @author sirxu
 */
export class WebGPUDescriptorCreator {
    public static bindGroupDescriptorCount: number = 0;
    public static bindTextureDescriptorCount: number = 0;
    public static renderPassDescriptorCount: number = 0;
    public static pipelineDescriptorCount: number = 0;

    public static createRendererPassState(rtFrame: RTFrame, loadOp: GPULoadOp = null) {
        let rps = new RendererPassState();
        rps.label = rtFrame.label;
        rps.customSize = rtFrame.customSize;
        rps.rtFrame = rtFrame;
        rps.zPreTexture = rtFrame.zPreTexture;
        rps.depthTexture = rtFrame.depthTexture;
        rps.depthViewIndex = rtFrame.depthViewIndex;
        rps.isOutTarget = rtFrame.isOutTarget;
        rps.depthCleanValue = rtFrame.depthCleanValue;
        rps.depthLoadOp = rtFrame.depthLoadOp;
        if (rtFrame && rtFrame.attachments.length > 0) {
            rps.renderTargets = rtFrame.attachments;
            rps.rtTextureDescripts = rtFrame.rtDescriptors;

            rps.renderPassDescriptor = WebGPUDescriptorCreator.getRenderPassDescriptor(rps);
            rps.renderBundleEncoderDescriptor = WebGPUDescriptorCreator.getRenderBundleDescriptor(rps);
            rps.outAttachments = [];
            for (let i = 0; i < rtFrame.attachments.length; i++) {
                const element = rtFrame.attachments[i];
                rps.outAttachments[i] = {
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
            rps.outAttachments = [
                {
                    format: GPUTextureFormat.bgra8unorm,
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
        let device = webGPUContext.device;
        let presentationSize = webGPUContext.presentationSize;
        let attachMentTexture = [];

        let size = [];
        if (renderPassState.renderTargets && renderPassState.renderTargets.length > 0) {
            size = [renderPassState.renderTargets[0].width, renderPassState.renderTargets[0].height];
            for (let i = 0; i < renderPassState.renderTargets.length; i++) {
                const texture = renderPassState.renderTargets[i];
                const rtDesc = renderPassState.rtTextureDescripts[i];
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

        this.renderPassDescriptorCount++;
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
        this.renderPassDescriptorCount++;
        return renderPassDescriptor;
    }
}

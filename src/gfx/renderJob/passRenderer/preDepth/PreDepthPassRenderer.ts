import { View3D } from "../../../../core/View3D";
import { VirtualTexture } from "../../../../textures/VirtualTexture";
import { ProfilerUtil } from "../../../../util/ProfilerUtil";
import { webGPUContext } from "../../../graphics/webGpu/Context3D";
import { GPUTextureFormat } from "../../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../../graphics/webGpu/descriptor/RTDescriptor";
import { GPUContext } from "../../GPUContext";
import { EntityCollect } from "../../collect/EntityCollect";
import { RTResourceConfig } from "../../config/RTResourceConfig";
import { RTFrame } from "../../frame/RTFrame";
import { RTResourceMap } from "../../frame/RTResourceMap";
import { OcclusionSystem } from "../../occlusion/OcclusionSystem";
import { RendererBase } from "../RendererBase";
import { RendererType } from "../state/RendererType";
import { ZCullingCompute } from "./ZCullingCompute";

/**
 * @internal
 * @group Post
 */
export class PreDepthPassRenderer extends RendererBase {
    public zBufferTexture: VirtualTexture;
    public useRenderBundle: boolean = false;
    shadowPassCount: number;
    zCullingCompute: ZCullingCompute;
    constructor() {
        super();
        this.passType = RendererType.DEPTH;

        let size = webGPUContext.presentationSize;
        let scale = 1;
        this.zBufferTexture = RTResourceMap.createRTTexture(RTResourceConfig.zBufferTexture_NAME, Math.floor(size[0] * scale), Math.floor(size[1] * scale), GPUTextureFormat.rgba16float, false);
        let rtDec = new RTDescriptor()
        rtDec.clearValue = [0, 0, 0, 0];
        rtDec.loadOp = `clear`;
        let rtFrame = new RTFrame([
            this.zBufferTexture
        ], [
            new RTDescriptor()
        ],
            RTResourceMap.createRTTexture(RTResourceConfig.zPreDepthTexture_NAME, Math.floor(size[0]), Math.floor(size[1]), GPUTextureFormat.depth32float, false),
            null,
            true
        );
        this.setRenderStates(rtFrame);
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        return;
    }


}

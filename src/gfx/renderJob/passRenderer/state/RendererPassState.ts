import { Engine3D } from "../../../../Engine3D";
import { Camera3D } from "../../../../core/Camera3D";

import { VirtualTexture } from "../../../../textures/VirtualTexture";
import { Texture } from "../../../graphics/webGpu/core/texture/Texture";
import { RTDescriptor } from "../../../graphics/webGpu/descriptor/RTDescriptor";
import { RTFrame } from "../../frame/RTFrame";

/**
 * @internal
 */
export class RendererPassState {

    public label: string = "";
    public customSize: boolean = false;
    public zPreTexture: VirtualTexture = null;
    public depthTexture: VirtualTexture = null;
    public outAttachments: GPUColorTargetState[];
    public outColor: number = -1;
    public renderTargets: Texture[];
    public rtTextureDescripts: RTDescriptor[];
    // public depthFormat: GPUTextureFormat = 'depth24plus';
    // public depthFormat: GPUTextureFormat = 'depth32float';
    // public depthTexture: GPUTexture;
    public irradianceBuffer: Texture[];
    public multisample: number = 0;
    public multiTexture: GPUTexture;
    public depthViewIndex: number = 0;
    public depthCleanValue: number = 0;
    public isOutTarget: boolean = true;
    public camera3D: Camera3D;
    public rtFrame: RTFrame;
    public renderPassDescriptor: GPURenderPassDescriptor;
    public renderBundleEncoderDescriptor: GPURenderBundleEncoderDescriptor;
    public depthLoadOp: GPULoadOp;


    getLastRenderTexture() {
        if (this.renderTargets) {
            return this.renderTargets.length > 0 ? this.renderTargets[0] : Engine3D.res.redTexture;
        } else {
            return Engine3D.res.redTexture
        }
    }
}

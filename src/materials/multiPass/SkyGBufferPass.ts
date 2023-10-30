import { Vector3 } from '../..';
import { GPUCompareFunction, GPUCullMode } from '../../gfx/graphics/webGpu/WebGPUConst';
import { RenderShaderPass } from '../../gfx/graphics/webGpu/shader/RenderShaderPass';
import { PassType } from '../../gfx/renderJob/passRenderer/state/RendererType';

/**
 * @internal
 * @group Material
 */
export class SkyGBufferPass extends RenderShaderPass {

    constructor() {
        super(`sky_vs_frag_wgsl`, `SkyGBuffer_fs`);
        this.passType = PassType.GI;

        this.setUniformVector3(`eyesPos`, new Vector3());
        this.setUniformFloat(`exposure`, 1.0);
        this.setUniformFloat(`roughness`, 0.0);

        let shaderState = this.shaderState;
        shaderState.frontFace = `ccw`;
        shaderState.cullMode = GPUCullMode.front;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.less;
    }
}

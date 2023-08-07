import { RenderShader, SkyGBuffer_pass } from '../..';
import { GPUCompareFunction, GPUCullMode } from '../../gfx/graphics/webGpu/WebGPUConst';

/**
 * @internal
 * @group Material
 */
export class SkyGBufferPass extends RenderShader {

    constructor() {
        super(`sky_vs_frag_wgsl`, `SkyGBuffer_fs`);
        this.setUniformFloat(`exposure`, 1.0);
        this.setUniformFloat(`roughness`, 0.0);

        let shaderState = this.shaderState;
        shaderState.frontFace = `ccw`;
        shaderState.cullMode = GPUCullMode.front;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.less;
    }
}

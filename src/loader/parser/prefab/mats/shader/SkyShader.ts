import { GPUCompareFunction, GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { BlendMode } from "../../../../../materials/BlendMode";
import { Color } from "../../../../../math/Color";
import { Vector3 } from "../../../../../math/Vector3";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";


@RegisterShader
export class SkyShader extends Shader {

    constructor() {
        super();
        let colorShader = new RenderShaderPass('sky_vs_frag_wgsl', 'sky_fs_frag_wgsl');
        this.addRenderPass(colorShader);

        colorShader.setUniformVector3(`eyesPos`, new Vector3());
        colorShader.setUniformFloat(`exposure`, 1.0);
        colorShader.setUniformFloat(`roughness`, 0.0);

        let shaderState = colorShader.shaderState;
        shaderState.frontFace = `cw`;
        shaderState.cullMode = GPUCullMode.back;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.less;
    }
}
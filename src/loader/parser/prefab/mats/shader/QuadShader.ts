import { Engine3D } from "../../../../../Engine3D";
import { GPUCompareFunction, GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { BlendMode } from "../../../../../materials/BlendMode";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";


@RegisterShader
export class QuadShader extends Shader {

    constructor(vs: string = 'QuadGlsl_vs', fs: string = 'QuadGlsl_fs') {
        super();

        let colorShader = new RenderShaderPass(vs, fs);
        this.addRenderPass(colorShader);

        let shaderState = colorShader.shaderState;
        colorShader.blendMode = BlendMode.NONE;
        shaderState.frontFace = `cw`;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.always;
        shaderState.multisample = 0;

        this.setTexture("baseMap", Engine3D.res.blackTexture);
        this.setUniformFloat(`x`, 0);
        this.setUniformFloat(`y`, 0);
        this.setUniformFloat(`width`, 100);
        this.setUniformFloat(`height`, 100);
    }
}
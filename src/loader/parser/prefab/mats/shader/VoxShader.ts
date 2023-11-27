import { GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { BlendMode } from "../../../../../materials/BlendMode";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";
import { ShaderLib } from "../../../../../assets/shader/ShaderLib";
import { VoxelShader } from "../../../../..";

@RegisterShader
export class VoxShader extends Shader {
    constructor() {
        super();

        ShaderLib.register("VoxelShader", VoxelShader);
        let colorShader = new RenderShaderPass('VoxelShader', 'VoxelShader');
        colorShader.setShaderEntry(`VertMain`, `FragMain`);
        this.addRenderPass(colorShader);

        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
    }
}

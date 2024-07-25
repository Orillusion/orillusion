import { GPUPrimitiveTopology, RenderShaderPass, Shader, ShaderLib, Material } from "@orillusion/core";
import { Graphic3DShader } from "../compute/graphic3d/Graphic3DShader";

/**
 * @internal
 */
export class Graphic3DFixedRenderMaterial extends Material {
    /**
     * @constructor
     */
    constructor(topology: GPUPrimitiveTopology = GPUPrimitiveTopology.triangle_list) {
        super();
        ShaderLib.register('Graphic3DShader', Graphic3DShader);

        let colorPass = new RenderShaderPass('Graphic3DShader', 'Graphic3DShader');
        colorPass.setShaderEntry(`VertMain`, `FragMain`);
        colorPass.noticeValueChange();

        let shader = new Shader();
        shader.addRenderPass(colorPass);
        this.shader = shader;

        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.topology = topology;
    }
}

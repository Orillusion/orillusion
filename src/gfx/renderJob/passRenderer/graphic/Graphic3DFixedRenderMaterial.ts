import { Engine3D, GPUPrimitiveTopology, RenderShaderPass, Shader, ShaderLib, Texture } from "../../../..";
import { Graphic3DShader } from "../../../../assets/shader/graphic/Graphic3DShader";
import { Material } from "../../../../materials/Material";

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

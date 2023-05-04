import { ShaderLib } from '../../assets/shader/ShaderLib';
import { MaterialBase } from '../MaterialBase';
import { registerMaterial } from "../MaterialRegister";
import { ZPassShader_vs } from '../../assets/shader/core/pass/ZPassShader_vs';
import { ZPassShader_fs } from '../../assets/shader/core/pass/ZPassShader_fs';


/**
 * @internal
 * DepthMaterialPass
 * @group Material
 */
export class DepthMaterialPass extends MaterialBase {
    transparency: number;
    constructor() {
        super();
        this.isPassMaterial = true;
        //OutLineSubPass

        ShaderLib.register("ZPass_shader_vs", ZPassShader_vs);
        ShaderLib.register("ZPass_shader_fs", ZPassShader_fs);

        // let shader = this.setShader(`ZPass_shader_vs`,`ZPass_shader_fs`);
        let shader = this.setShader(`ZPass_shader_vs`, `ZPass_shader_fs`);
        shader.useRz = true;
        // shader.setShaderEntry("main");

        let shaderState = shader.shaderState;
        shaderState.receiveEnv = false;
    }
}
registerMaterial('DepthMaterialPass', DepthMaterialPass);
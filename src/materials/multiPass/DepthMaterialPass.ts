import { ShaderLib } from '../../assets/shader/ShaderLib';
import { MaterialBase } from '../MaterialBase';
import { registerMaterial } from "../MaterialRegister";
import { ZPassShader_vs } from '../../assets/shader/core/pass/ZPassShader_vs';
import { ZPassShader_fs } from '../../assets/shader/core/pass/ZPassShader_fs';
import { RenderShader } from '../..';


/**
 * @internal
 * DepthMaterialPass
 * @group Material
 */
export class DepthMaterialPass extends RenderShader {
    constructor() {
        super(`ZPass_shader_vs`, `ZPass_shader_fs`);
        this.useRz = true;
        let shaderState = this.shaderState;
        shaderState.receiveEnv = false;
    }
}
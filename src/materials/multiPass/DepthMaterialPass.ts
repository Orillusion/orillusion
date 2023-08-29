import { RenderShader } from '../..';


/**
 * @internal
 * DepthMaterialPass
 * @group Material
 */
export class DepthMaterialPass extends RenderShader {
    constructor() {
        super(`ZPass_shader_vs`, `ZPass_shader_fs`);
        this.useRz = false;
        let shaderState = this.shaderState;
        shaderState.receiveEnv = false;
    }
}
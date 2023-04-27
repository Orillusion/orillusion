import { Vector3 } from '../../..';
import { CastShadow } from '../../assets/shader/core/pass/CastShadowPass_wgsl';
import { ShaderLib } from '../../assets/shader/ShaderLib';
import { MaterialBase } from '../MaterialBase';
import { registerMaterial } from "../MaterialRegister";

/**
 * @internal
 * CastShadowMaterialPass
 * @group Material
 */
export class CastShadowMaterialPass extends MaterialBase {
    transparency: number;
    constructor() {
        super();
        this.isPassMaterial = true;
        //OutLineSubPass this.shaderState
        ShaderLib.register("shadowCastMap_vert_wgsl", CastShadow.shadowCastMap_vert_wgsl);
        ShaderLib.register("shadowCastMap_frag_wgsl", CastShadow.shadowCastMap_frag_wgsl);
        // let shader = this.setShader(`shadowCastMap_vert_wgsl`,`shadowCastMap_frag_wgsl`);
        let shader = this.setShader(`shadowCastMap_vert_wgsl`, `shadowCastMap_frag_wgsl`);
        shader.setShaderEntry("main");
        shader.setUniformFloat("cameraFar", 5000);
        shader.setUniformVector3("lightWorldPos", Vector3.ZERO);

        let shaderState = shader.shaderState;
        shaderState.receiveEnv = false;
        // this.alphaCutoff = 0.5 ;
    }
}

registerMaterial('CastShadowMaterialPass', CastShadowMaterialPass);
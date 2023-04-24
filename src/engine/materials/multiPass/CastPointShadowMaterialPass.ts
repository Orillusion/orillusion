import { CastShadow } from '../../assets/shader/core/pass/CastShadowPass_wgsl';
import { ShaderLib } from '../../assets/shader/ShaderLib';
import { Vector3 } from '../../math/Vector3';
import { MaterialBase } from '../MaterialBase';
import { registerMaterial } from "../MaterialRegister";

/**
 * @internal
 * CastPointShadowMaterialPass
 * @group Material
 */
export class CastPointShadowMaterialPass extends MaterialBase {
    transparency: number;
    constructor() {
        super();
        this.isPassMaterial = true;
        ShaderLib.register("castPointShadowMap_vert_wgsl", CastShadow.castPointShadowMap_vert_wgsl);
        ShaderLib.register("shadowCastMap_frag_wgsl", CastShadow.shadowCastMap_frag_wgsl);

        let shader = this.setShader(`castPointShadowMap_vert_wgsl`, `shadowCastMap_frag_wgsl`);
        shader.setShaderEntry("main", "main");
        shader.setUniformFloat("cameraFar", 5000);
        shader.setUniformVector3("lightWorldPos", Vector3.ZERO);
        let shaderState = shader.shaderState;
        shaderState.receiveEnv = false;
        // this.alphaCutoff = 0.5 ;
    }
}

registerMaterial('CastShadowMaterialPass', CastPointShadowMaterialPass);
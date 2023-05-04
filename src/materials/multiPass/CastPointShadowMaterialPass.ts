import { ShaderLib } from '../../assets/shader/ShaderLib';
import { castPointShadowMap_vert, shadowCastMap_frag } from '../../assets/shader/core/pass/CastShadow_pass';
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
        ShaderLib.register("castPointShadowMap_vert", castPointShadowMap_vert);
        ShaderLib.register("shadowCastMap_frag", shadowCastMap_frag);

        let shader = this.setShader(`castPointShadowMap_vert`, `shadowCastMap_frag`);
        shader.setShaderEntry("main", "main");
        shader.setUniformFloat("cameraFar", 5000);
        shader.setUniformVector3("lightWorldPos", Vector3.ZERO);
        let shaderState = shader.shaderState;
        shaderState.receiveEnv = false;
        // this.alphaCutoff = 0.5 ;
    }
}

registerMaterial('CastShadowMaterialPass', CastPointShadowMaterialPass);
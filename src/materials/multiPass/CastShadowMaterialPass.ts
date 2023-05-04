import { ShaderLib } from '../../assets/shader/ShaderLib';
import { shadowCastMap_frag, shadowCastMap_vert } from '../../assets/shader/core/pass/CastShadow_pass';
import { Vector3 } from '../../math/Vector3';
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
        ShaderLib.register("shadowCastMap_vert", shadowCastMap_vert);
        ShaderLib.register("shadowCastMap_frag", shadowCastMap_frag);
        // let shader = this.setShader(`shadowCastMap_vert_wgsl`,`shadowCastMap_frag_wgsl`);
        let shader = this.setShader(`shadowCastMap_vert`, `shadowCastMap_frag`);
        shader.setShaderEntry("main");
        shader.setUniformFloat("cameraFar", 5000);
        shader.setUniformVector3("lightWorldPos", Vector3.ZERO);

        let shaderState = shader.shaderState;
        shaderState.receiveEnv = false;
        // this.alphaCutoff = 0.5 ;
    }
}

registerMaterial('CastShadowMaterialPass', CastShadowMaterialPass);
import { RenderShader } from '../..';

/**
 * @internal
 * CastPointShadowMaterialPass
 * @group Material
 */
export class CastPointShadowMaterialPass extends RenderShader {
    constructor() {
        super(`castPointShadowMap_vert`, `shadowCastMap_frag`);
        this.setShaderEntry("main", "main");
        this.setUniformFloat("cameraFar", 5000);
        // this.setUniformVector3("lightWorldPos", Vector3.ZERO);
        this.shaderState.receiveEnv = false;
        this.shaderState.castShadow = false;
        this.shaderState.acceptShadow = false;

        this.setDefine(`USE_ALPHACUT`, true);
    }
}

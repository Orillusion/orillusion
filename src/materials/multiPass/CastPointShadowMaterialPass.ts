import { RenderShaderPass } from "../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { PassType } from "../../gfx/renderJob/passRenderer/state/RendererType";
import { Vector3 } from "../../math/Vector3";

/**
 * @internal
 * CastPointShadowMaterialPass
 * @group Material
 */
export class CastPointShadowMaterialPass extends RenderShaderPass {
    constructor() {
        super(`castPointShadowMap_vert`, `shadowCastMap_frag`);
        this.passType = PassType.POINT_SHADOW;
        this.setShaderEntry("main", "main");
        this.setUniformFloat("cameraFar", 5000);
        this.setUniformVector3("lightWorldPos", Vector3.ZERO);
        this.shaderState.receiveEnv = false;
        this.shaderState.castShadow = false;
        this.shaderState.acceptShadow = false;

        this.setDefine(`USE_ALPHACUT`, true);
    }
}

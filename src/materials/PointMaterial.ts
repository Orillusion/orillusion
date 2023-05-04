import { Engine3D } from '../Engine3D';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { PointShadowDebug } from '../assets/shader/materials/PointShadowDebug';
import { UnLit } from '../assets/shader/materials/UnLit';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';

import { MaterialBase } from './MaterialBase';
import { registerMaterial } from "./MaterialRegister";

/**
 * PointMaterial
 * @group Material
 */
export class PointMaterial extends MaterialBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        ShaderLib.register("UnLitShader", UnLit);
        ShaderLib.register("PointShadowDebug", PointShadowDebug);

        let shader = this.setShader(`UnLitShader`, `PointShadowDebug`);
        shader.setShaderEntry(`VertMain`, `FragMain`)

        shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformFloat(`alphaCutoff`, 0.5);
        let shaderState = shader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
    }

    /**
     * set environment texture, usually referring to cubemap
     */
    public set envMap(texture: Texture) {
        //not need env texture
    }

    /**
     * set shadow map
     */
    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

    debug() {
    }
}

registerMaterial('PointMaterial', PointMaterial);
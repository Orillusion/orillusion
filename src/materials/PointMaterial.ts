import { Material, RenderShader } from '..';
import { Engine3D } from '../Engine3D';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { PointShadowDebug } from '../assets/shader/materials/PointShadowDebug';
import { UnLit } from '../assets/shader/materials/UnLit';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';
import { registerMaterial } from "./MaterialRegister";

/**
 * PointMaterial
 * @group Material
 */
export class PointMaterial extends Material {
    /**
     * @constructor
     */
    constructor() {
        super();
        ShaderLib.register("UnLitShader", UnLit);
        ShaderLib.register("PointShadowDebug", PointShadowDebug);

        let colorPass = new RenderShader(`UnLitShader`, `PointShadowDebug`);
        this.defaultPass = colorPass;
        colorPass.setShaderEntry(`VertMain`, `FragMain`)

        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformFloat(`alphaCutoff`, 0.5);
        let shaderState = colorPass.shaderState;
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
    public set baseMap(texture: Texture) {
        //not need env texture
        this.defaultPass.setTexture(`baseMap`, texture);
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
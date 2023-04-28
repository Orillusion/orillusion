
import { Lambert_shader } from '../assets/shader/materials/Lambert_shader';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';

import { MaterialBase } from './MaterialBase';
import { registerMaterial } from "./MaterialRegister";

/**
 * Lambert Mateiral
 * A non glossy surface material without specular highlights.
 * @group Material
 */
export class LambertMaterial extends MaterialBase {
    /**
     * @constructor
     */
    constructor() {
        super();
        ShaderLib.register("lambert_vert_wgsl", Lambert_shader.lambert_vert_wgsl);
        ShaderLib.register("lambert_frag_wgsl", Lambert_shader.lambert_frag_wgsl);

        let shader = this.setShader(`lambert_vert_wgsl`, `lambert_frag_wgsl`);
        shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformVector4(`dirLight`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`dirLightColor`, new Color());
        shader.setUniformFloat(`alphaCutoff`, 0.5);
        shader.setUniformFloat(`shadowBias`, 0.00035);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = true;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
        this.emissiveMap = Engine3D.res.blackTexture;
        this.baseMap = Engine3D.res.grayTexture;
    }

    /**
     * set base color (tint color)
     */
    set baseColor(color: Color) {
        this.renderShader.setUniformColor(`baseColor`, color);
    }

    /**
     * get base color (tint color)
     */
    get baseColor() {
        return this.renderShader.uniforms[`baseColor`].color;
    }

    /**
     * set environment texture, usually referring to cubemap
     */
    public set envMap(texture: Texture) {
        //not need env texture
    }

    /**
     * @internal
     * set shadow map
     */
    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

}
registerMaterial("LambertMaterial", LambertMaterial);
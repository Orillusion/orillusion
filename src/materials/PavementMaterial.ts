import { ShaderLib } from '../assets/shader/ShaderLib';
import { PavementShader } from '../assets/shader/materials/PavementShader';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';

import { PhysicMaterial } from './PhysicMaterial';
import { registerMaterial } from "../materials/MaterialRegister";
import { Engine3D } from '../Engine3D';
/**
 * PavementMaterial
 * @group Material
 */
export class PavementMaterial extends PhysicMaterial {
    /**
     * @constructor
     */
    constructor() {
        super();

        ShaderLib.register("PavementShader", PavementShader);

        let shader = this.setShader(`PavementShader`, `PavementShader`);
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformColor(`emissiveColor`, new Color());
        shader.setUniformFloat(`envIntensity`, 1);
        shader.setUniformFloat(`normalScale`, 1);
        shader.setUniformFloat(`roughness`, 0.0);
        shader.setUniformFloat(`metallic`, 0.0);
        shader.setUniformFloat(`ao`, 1.0);
        shader.setUniformFloat(`alphaCutoff`, 0.0);

        shader.setDefine("USE_BRDF", true);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;
        shader.setTexture("normalMap", Engine3D.res.normalTexture);
        shader.setTexture("emissiveMap", Engine3D.res.blackTexture);

        // default value
        this.baseMap = Engine3D.res.whiteTexture;

        this.transparent = true;
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

    debug() {
    }
}

registerMaterial('PavementMaterial', PavementMaterial);
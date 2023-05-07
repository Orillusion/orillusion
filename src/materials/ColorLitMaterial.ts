import { Engine3D } from '../Engine3D';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { ColorLitShader } from '../assets/shader/materials/ColorLitShader';
import { Color } from '../math/Color';

import { PhysicMaterial } from './PhysicMaterial';
/**
 * ColorLitMaterial
 * @group Material
 */
export class ColorLitMaterial extends PhysicMaterial {
    static count = 0;
    /**
     * @constructor
     */
    constructor() {
        super();

        ShaderLib.register("ColorLitShader", ColorLitShader.Ori_AllShader);

        let shader = this.setShader(`ColorLitShader`, `ColorLitShader`);
        shader.setDefine("USE_BRDF", true);
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformColor(`emissiveColor`, new Color());
        shader.setUniformFloat(`envIntensity`, 1);
        shader.setUniformFloat(`normalScale`, 1);
        shader.setUniformFloat(`roughness`, 0.0);
        shader.setUniformFloat(`metallic`, 0.0);
        shader.setUniformFloat(`ao`, 1.0);
        shader.setUniformFloat(`alphaCutoff`, 0.0);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;

        shader.setTexture("normalMap", Engine3D.res.normalTexture);
        shader.setTexture("emissiveMap", Engine3D.res.blackTexture);
    }

    clone(): this {
        return null;
    }

    debug() {
    }
}

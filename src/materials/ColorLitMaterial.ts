import { Material, RenderShaderPass, PassType, Shader } from '..';
import { Engine3D } from '../Engine3D';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { ColorLitShader } from '../assets/shader/materials/ColorLitShader';
import { Color } from '../math/Color';

/**
 * ColorLitMaterial
 * @group Material
 */
export class ColorLitMaterial extends Material {
    static count = 0;
    /**
     * @constructor
     */
    constructor() {
        super();

        ShaderLib.register("ColorLitShader", ColorLitShader);

        this.shader = new Shader()
        let renderShader = new RenderShaderPass(`ColorLitShader`, `ColorLitShader`);
        renderShader.passType = PassType.COLOR;
        this.shader.addRenderPass(renderShader);

        renderShader.setDefine("USE_BRDF", true);
        renderShader.setShaderEntry(`VertMain`, `FragMain`)
        renderShader.setUniformColor(`baseColor`, new Color());
        renderShader.setUniformColor(`emissiveColor`, new Color());
        renderShader.setUniformFloat(`envIntensity`, 1);
        renderShader.setUniformFloat(`normalScale`, 1);
        renderShader.setUniformFloat(`roughness`, 0.0);
        renderShader.setUniformFloat(`metallic`, 0.0);
        renderShader.setUniformFloat(`ao`, 1.0);
        renderShader.setUniformFloat(`alphaCutoff`, 0.0);

        let shaderState = renderShader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;

        renderShader.setTexture("normalMap", Engine3D.res.normalTexture);
        renderShader.setTexture("emissiveMap", Engine3D.res.blackTexture);
    }

    clone(): this {
        return null;
    }

    debug() {
    }
}

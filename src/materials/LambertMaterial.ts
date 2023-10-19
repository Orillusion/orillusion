
import { Lambert_shader, Material, PassType, RenderShaderPass, Shader } from '..';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';


/**
 * Lambert Mateiral
 * A non glossy surface material without specular highlights.
 * @group Material
 */
export class LambertMaterial extends Material {
    /**
     * @constructor
     */
    constructor() {
        super();
        let colorPass = new RenderShaderPass(`LambertShader`, `LambertShader`);
        colorPass.setShaderEntry(`VertMain`, `FragMain`)
        colorPass.passType = PassType.COLOR;
        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color(1, 1, 1, 1));
        colorPass.setUniformFloat(`alphaCutoff`, 0.5);

        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;

        let newShader = new Shader();
        newShader.addRenderPass(colorPass);
        this.shader = newShader;
        this.baseMap = Engine3D.res.grayTexture;
    }

    /**
     * set base color map texture
     */
    public set baseMap(tex: Texture) {
        this.shader.setTexture(`baseMap`, tex);
    }

    /**
     * get base color map texture
     */
    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    /**
     * set base color (tint color)
     */
    public set baseColor(color: Color) {
        this.shader.setUniformColor(`baseColor`, color);
    }

    /**
     * get base color (tint color)
     */
    public get baseColor() {
        return this.shader.getUniformColor("baseColor");
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
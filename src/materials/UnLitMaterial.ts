import { Engine3D } from '../Engine3D';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { UnLit } from '../assets/shader/materials/UnLit';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';

import { MaterialBase } from './MaterialBase';
import { registerMaterial } from "./MaterialRegister";

/**
 * material without light
 * A basic material that can be rendered solely based on color and texture information without calculating lighting
 * @group Material
 */
export class UnLitMaterial extends MaterialBase {
    /**
     *@constructor
     */
    constructor() {
        super();
        ShaderLib.register("UnLitShader", UnLit);

        let shader = this.setShader(`UnLitShader`, `UnLitShader`);
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

        shader.setUniformColor("ccc", new Color(1.0, 0.0, 0.0, 1.0));

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
    }

    /**
     * Set material environment map
     */
    public set envMap(texture: Texture) {
        //not need env texture
    }

    /**
     * Set material shadow map
     */
    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

    public clone(): this {
        // console.log(`clone LitMaterial ${this.name}`);

        let ret = new UnLitMaterial();
        ret.baseMap = this.baseMap;
        ret.normalMap = this.normalMap;
        ret.emissiveMap = this.emissiveMap;
        this.uvTransform_1 && (ret.uvTransform_1 = new Vector4().copyFrom(this.uvTransform_1));
        this.uvTransform_2 && (ret.uvTransform_2 = new Vector4().copyFrom(this.uvTransform_2));
        ret.baseColor = this.baseColor.clone();
        ret.emissiveColor = this.emissiveColor.clone();
        ret.envIntensity = this.envIntensity;
        ret.normalScale = this.normalScale;
        ret.emissiveIntensity = this.emissiveIntensity;
        ret.alphaCutoff = this.alphaCutoff;

        ret.transparent = this.transparent;
        ret.cullMode = this.cullMode;
        ret.blendMode = this.blendMode;

        this.cloneObject(this.shaderState, ret.shaderState);
        this.cloneObject(this.renderShader.defineValue, ret.renderShader.shaderState);
        this.cloneObject(this.renderShader.constValues, ret.renderShader.constValues);

        return ret as this;
    }

    debug() {
    }
}

registerMaterial('UnLitMaterial', UnLitMaterial);
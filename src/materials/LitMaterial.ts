import { Engine3D } from '../Engine3D';
import { Vector4 } from '../math/Vector4';

import { registerMaterial } from './MaterialRegister';
import { PhysicMaterial } from './PhysicMaterial';
/**
 * a type of material, based on physical lighting model
 * @group Material
 */
export class LitMaterial extends PhysicMaterial {
    static count = 0;

    /**
     *@constructor 
     */
    constructor() {
        super();

        this.name = this.instanceID;

        this.setShader('PBRLItShader', 'PBRLItShader');

        let shader = this.getShader();
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setDefine("USE_BRDF", true);
        shader.setDefine("USE_NORMALFILPY", Engine3D.setting.material.normalYFlip);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;

        let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
        this.brdfLUT = bdrflutTex;

        this.envIntensity = 0.75;
        this.materialF0 = new Vector4(0.04, 0.04, 0.04, 1.0 - 0.04);
        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        // this.aoMap = defaultTexture.whiteTexture;
        // this.maskMap = defaultTexture.maskTexture;
        // this.maskMap = defaultTexture.grayTexture;
        // shader.setDefine(`USE_ARMC`, false);
        this.emissiveMap = Engine3D.res.blackTexture;
        // this.alphaCutoff = 0.5;
    }

    public clone(): this {
        let ret = new LitMaterial();
        ret.baseMap = this.baseMap;
        ret.normalMap = this.normalMap;
        ret.aoMap = this.aoMap;
        ret.brdfLUT = this.brdfLUT;
        if (this.maskMap) ret.maskMap = this.maskMap;
        ret.emissiveMap = this.emissiveMap;
        this.uvTransform_1 && (ret.uvTransform_1 = new Vector4().copyFrom(this.uvTransform_1));
        this.uvTransform_2 && (ret.uvTransform_2 = new Vector4().copyFrom(this.uvTransform_2));
        ret.baseColor = this.baseColor.clone();
        ret.emissiveColor = this.emissiveColor.clone();
        this.materialF0 && (ret.materialF0 = new Vector4().copyFrom(this.materialF0));
        ret.envIntensity = this.envIntensity;
        ret.normalScale = this.normalScale;
        ret.roughness = this.roughness;
        ret.metallic = this.metallic;
        ret.ao = this.ao;
        ret.roughness_min = this.roughness_min;
        ret.roughness_max = this.roughness_max;
        ret.metallic_min = this.metallic_min;
        ret.metallic_max = this.metallic_max;
        ret.emissiveIntensity = this.emissiveIntensity;
        ret.alphaCutoff = this.alphaCutoff;
        ret.ior = this.ior;
        ret.clearcoatFactor = this.clearcoatFactor;
        ret.clearcoatRoughnessFactor = this.clearcoatRoughnessFactor;

        this.clearcoatColor && (ret.clearcoatColor = this.clearcoatColor.clone());
        ret.clearcoatWeight = this.clearcoatWeight;

        ret.transparent = this.transparent;
        ret.cullMode = this.cullMode;
        ret.blendMode = this.blendMode;

        this.cloneObject(this.shaderState, ret.shaderState);
        this.cloneObject(this.renderShader.defineValue, ret.renderShader.shaderState);
        this.cloneObject(this.renderShader.constValues, ret.renderShader.constValues);

        return ret as this;
    }

    /**
     * internal
     */
    debug() {
    }

    public destroy(force?: boolean): void {
        super.destroy(force);
    }
}

registerMaterial("LitMaterial", LitMaterial);

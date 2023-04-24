import { registerMaterial } from '../..';
import { ShaderLib } from '../assets/shader/ShaderLib';
import GlassShader from '../assets/shader/materials/GlassShader.wgsl?raw';
import { Engine3D } from '../Engine3D';
import { Vector4 } from '../math/Vector4';
import { defaultRes } from '../textures/DefaultRes';
import { PhysicMaterial } from './PhysicMaterial';
/**
 * GlassMaterial
 * an rendering material implemented by simulating glass surfaces
 * @group Material
 */
export class GlassMaterial extends PhysicMaterial {
    /**
     * 实例个数
     */
    static count = 0;

    /**
     * @constructor
     */
    constructor() {
        super();

        ShaderLib.register("GlassShader", GlassShader);
        this.setShader('GlassShader', 'GlassShader');

        let shader = this.getShader();
        shader.setDefine("USE_BRDF", true);
        shader.setShaderEntry(`VertMain`, `FragMain`)

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;

        let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
        this.brdfLUT = bdrflutTex;

        this.baseMap = defaultRes.whiteTexture;
        this.normalMap = defaultRes.normalTexture;
        // this.aoMap = defaultTexture.whiteTexture;
        // this.maskMap = defaultTexture.maskTexture;
        // this.maskMap = defaultTexture.grayTexture;
        // shader.setDefine(`USE_ARMC`, false);
        this.emissiveMap = defaultRes.blackTexture;

    }

    clone(): this {
        console.log(`clone material ${this.name}`);

        let ret = new GlassMaterial();
        ret.baseMap = this.baseMap;
        ret.normalMap = this.normalMap;
        ret.aoMap = this.aoMap;
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
        return ret as this;
    }

    /**
     * 启用GUI调试
     */
    debug() {
    }
}

registerMaterial('GlassMaterial', GlassMaterial);
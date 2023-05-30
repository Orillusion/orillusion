import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';

import { MaterialBase } from './MaterialBase';
import { registerMaterial } from "./MaterialRegister";

/**
 * @internal
 * @group Material
 */
export class PhysicMaterial extends MaterialBase {

    /**
     * get transformUV1
     */
    public get uvTransform_1(): Vector4 {
        return this.renderShader.uniforms[`transformUV1`].vector4;
    }

    /**
     * set transformUV1
     */
    public set uvTransform_1(value: Vector4) {
        // this.renderShader.uniforms[`transformUV1`].v4 = value;
        this.renderShader.setUniformVector4(`transformUV1`, value);
    }

    /**
     * get transformUV2
     */
    public get uvTransform_2(): Vector4 {
        return this.renderShader.uniforms[`transformUV2`].vector4;
    }

    /**
     * set transformUV2
     */
    public set uvTransform_2(value: Vector4) {
        // this.renderShader.uniforms[`transformUV2`].v4 = value;
        this.renderShader.setUniformVector4(`transformUV2`, value);
    }

    /**
     * get reflectivity
     */
    public get materialF0(): Vector4 {
        return this.renderShader.uniforms[`materialF0`].vector4;
    }

    /**
     * set reflectivity
     */
    public set materialF0(value: Vector4) {
        this.renderShader.setUniformVector4(`materialF0`, value);
    }

    /**
     * get roughness
     */
    public get roughness(): number {
        return this.renderShader.uniforms[`roughness`].value;
    }

    /**
     * set roughness
     */
    public set roughness(value: number) {
        this.renderShader.setUniformFloat(`roughness`, value);
    }

    /**
     * get metallic
     */
    public get metallic(): number {
        return this.renderShader.uniforms[`metallic`].value;
    }

    /**
     * set metallic
     */
    public set metallic(value: number) {
        this.renderShader.setUniformFloat(`metallic`, value);
    }

    /**
     * get Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public get ao(): number {
        return this.renderShader.uniforms[`ao`].value;
    }

    /**
     * set Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public set ao(value: number) {
        this.renderShader.setUniformFloat(`ao`, value);
    }

    /**
     * get min metallic
     */
    public get metallic_min(): number {
        return this.renderShader.uniforms[`metallic_min`].value;
    }

    /**
     * set min metallic
     */
    public set metallic_min(value: number) {
        this.renderShader.setUniformFloat(`metallic_min`, value);
    }

    /**
     * get max metallic
     */
    public get metallic_max(): number {
        return this.renderShader.uniforms[`metallic_max`].value;
    }

    /**
     * set max metallic
     */
    public set metallic_max(value: number) {
        this.renderShader.setUniformFloat(`metallic_max`, value);
    }

    /**
     * get min roughness
     */
    public get roughness_min(): number {
        return this.renderShader.uniforms[`roughness_min`].value;
    }

    /**
     * set min roughness
     */
    public set roughness_min(value: number) {
        this.renderShader.setUniformFloat(`roughness_min`, value);
    }

    /**
     * get max roughness
     */
    public get roughness_max(): number {
        return this.renderShader.uniforms[`roughness_max`].value;
    }

    /**
     * set max roughness
     */
    public set roughness_max(value: number) {
        this.renderShader.setUniformFloat(`roughness_max`, value);
    }

    /**
     * Get the influence of Normal mapping on materials
     */
    public get normalScale(): number {
        return this.renderShader.uniforms[`normalScale`].value;
    }

    /**
     * Set the influence of Normal mapping on materials
     */
    public set normalScale(value: number) {
        this.renderShader.setUniformFloat(`normalScale`, value);
    }

    /**
     * get Mask Map
     * R_chanel -> AoMap 
     * G_chanel -> Roughness
     * B_chanel -> Metallic
     * A_chanel -> C
     */
    public get maskMap(): Texture {
        return this.renderShader.textures[`maskMap`];
    }

    /**
     * set Mask Map
     * R_chanel -> AoMap 
     * G_chanel -> Roughness
     * B_chanel -> Metallic
     * A_chanel -> C
     */
    public set maskMap(value: Texture) {
        this.renderShader.setDefine(`USE_ARMC`, true);
        this.renderShader.setTexture(`maskMap`, value);
    }

    /**
     * set Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public set aoMap(value: Texture) {
        if (!value) return;
        this.renderShader.setTexture(`aoMap`, value);
        if (value != Engine3D.res.whiteTexture) {
            this.renderShader.setDefine(`USE_AOTEX`, true);
        }
    }

    /**
     * get Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public get aoMap(): Texture {
        return this.renderShader.textures[`aoMap`];
    }

    /**
     * set clearCoatRoughnessMap
     */
    public set clearCoatRoughnessMap(value: Texture) {
        if (!value) return;
        this.renderShader.setTexture(`clearCoatRoughnessMap`, value);
        this.renderShader.setDefine(`USE_CLEARCOAT_ROUGHNESS`, true);
    }

    /**
     * get clearCoatRoughnessMap
     */
    public get clearCoatRoughnessMap(): Texture {
        return this.renderShader.textures[`clearCoatRoughnessMap`];
    }

    /**
     * get brdf query map
     */
    public get brdfLUT(): Texture {
        return this.renderShader.textures[`brdfLUT`];
    }

    /**
     * set brdf query map
     */
    public set brdfLUT(value: Texture) {
        this.renderShader.setTexture(`brdfLUT`, value);
        this.renderShader.setTexture(`brdflutMap`, value);
    }

    /**
     * get emissive map
     */
    public get emissiveMap(): Texture {
        return this.renderShader.textures[`emissiveMap`];
    }

    /**
     * set emissive map
     */
    public set emissiveMap(value: Texture) {
        this.renderShader.setTexture(`emissiveMap`, value);
    }

    /**
     * set intensity of environment light or color of sampled by texture
     */
    public set envIntensity(value: number) {
        this.renderShader.setUniformFloat(`envIntensity`, value);
    }

    /**
     * get intensity of environment light or color of sampled by texture
     */
    public get envIntensity() {
        return this.renderShader.uniforms[`envIntensity`].value;
    }

    /**
     * set factor of refractive
     */
    public set ior(value: number) {
        this.renderShader.setUniformFloat(`ior`, value);
    }

    /**
     * get factor of refractive
     */
    public get ior(): number {
        return this.renderShader.uniforms[`ior`].value;
    }

    /**
     * valid USE_CLEARCOAT define in shader
     */
    public useCleanCoat() {
        this.renderShader.setDefine("USE_CLEARCOAT", true);
    }

    /**
     * Set the factor of the clearcoat
     */
    public set clearcoatFactor(value: number) {
        this.renderShader.setUniformFloat(`clearcoatFactor`, value);
    }

    /**
     * get the factor of the clearcoat
     */
    public get clearcoatFactor(): number {
        return this.renderShader.uniforms[`clearcoatFactor`].value;
    }

    /**
     * set the factor of the clearcoat Roughness
     */
    public set clearcoatRoughnessFactor(value: number) {
        this.renderShader.setUniformFloat(`clearcoatRoughnessFactor`, value);
    }

    /**
     * get the factor of the clearcoat Roughness
     */
    public get clearcoatRoughnessFactor(): number {
        return this.renderShader.uniforms[`clearcoatRoughnessFactor`].value;
    }

    /**
     * set the weight of the clearcoat
     */
    public set clearcoatWeight(value: number) {
        this.renderShader.setUniformFloat(`clearcoatWeight`, value);
    }

    /**
     * get the weight of the clearcoat
     */
    public get clearcoatWeight(): number {
        return this.renderShader.uniforms[`clearcoatWeight`].value;
    }

    /**
     * get the color of the clearcoat
     */
    public set clearcoatColor(value: Color) {
        this.renderShader.setUniformColor(`clearcoatColor`, value);
    }

    /**
     * set the color of the clearcoat
     */
    public get clearcoatColor(): Color {
        return this.renderShader.uniforms[`clearcoatColor`].color;
    }

    public destroy(force?: boolean): void {
        // if (this.baseMap || (this.baseMap.name != "" && this.baseMap.name.indexOf("defaultOri") == -1)) {
        //     this.baseMap.destroy(force);
        // }

        // if (this.normalMap || (this.normalMap.name != "" && this.normalMap.name.indexOf("defaultOri") == -1)) {
        //     this.normalMap.destroy(force);
        // }
        super.destroy(force);
    }

}

registerMaterial("PhysicMaterial", PhysicMaterial);
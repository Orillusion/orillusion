import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { RenderShader } from '../gfx/graphics/webGpu/shader/RenderShader';
import { RendererType } from '../gfx/renderJob/passRenderer/state/RendererType';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';
import { Material } from './Material';

/**
 * @internal
 * @group Material
 */
export class PhysicMaterial extends Material {

    constructor() {
        super();
    }

    /**
     * Set the render shader default value
     */
    public setDefault() {
        let colorPass = this.defaultPass;
        colorPass.setUniformFloat(`shadowBias`, 0.00035);
        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformColor(`emissiveColor`, new Color(1, 1, 1));
        colorPass.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        colorPass.setUniformFloat(`envIntensity`, 1);
        colorPass.setUniformFloat(`normalScale`, 1);
        colorPass.setUniformFloat(`roughness`, 1.0);
        colorPass.setUniformFloat(`metallic`, 0.0);
        colorPass.setUniformFloat(`ao`, 1.0);
        colorPass.setUniformFloat(`roughness_min`, 0.0);
        colorPass.setUniformFloat(`roughness_max`, 1.0);
        colorPass.setUniformFloat(`metallic_min`, 0.0);
        colorPass.setUniformFloat(`metallic_max`, 1.0);
        colorPass.setUniformFloat(`emissiveIntensity`, 0.0);
        colorPass.setUniformFloat(`alphaCutoff`, 0.0);
        colorPass.setUniformFloat(`ior`, 1.5);
        colorPass.setUniformFloat(`clearcoatFactor`, 0.0);
        colorPass.setUniformFloat(`clearcoatRoughnessFactor`, 0.0);
        colorPass.setUniformColor(`clearcoatColor`, new Color(1, 1, 1));
        colorPass.setUniformFloat(`clearcoatWeight`, 0.0);
    }


    public get baseMap(): Texture {
        return this.defaultPass.getTexture(`baseMap`);
    }

    public set baseMap(value: Texture) {
        this.defaultPass.setTexture(`baseMap`, value);
    }

    public get baseColor(): Color {
        return this.defaultPass.getUniform(`baseColor`);
    }

    public set baseColor(value: Color) {
        this.defaultPass.setUniformColor(`baseColor`, value);
    }

    public get normalMap(): Texture {
        return this.defaultPass.getTexture(`normalMap`);
    }

    public set normalMap(value: Texture) {
        this.defaultPass.setTexture(`normalMap`, value);
    }

    public get doubleSide(): boolean {
        return this.defaultPass.doubleSide;
    }
    public set doubleSide(value: boolean) {
        this.defaultPass.doubleSide = value;
    }

    public get alphaCutoff(): any {
        return this.defaultPass.shaderState.alphaCutoff;
    }
    public set alphaCutoff(value: any) {
        this.defaultPass.shaderState.alphaCutoff = value;
    }

    public get emissiveColor(): Color {
        return this.defaultPass.getUniform(`emissiveColor`);
    }

    public set emissiveColor(value: Color) {
        this.defaultPass.setUniform(`emissiveColor`, value);
    }

    public get emissiveIntensity(): number {
        return this.defaultPass.getUniform(`emissiveIntensity`);
    }

    public set emissiveIntensity(value: number) {
        this.defaultPass.setUniform(`emissiveIntensity`, value);
    }

    /**
     * get transformUV1
     */
    public get uvTransform_1(): Vector4 {
        return this.defaultPass.uniforms[`transformUV1`].vector4;
    }

    /**
     * set transformUV1
     */
    public set uvTransform_1(value: Vector4) {
        // this.defaultPass.uniforms[`transformUV1`].v4 = value;
        this.defaultPass.setUniformVector4(`transformUV1`, value);
    }

    /**
     * get transformUV2
     */
    public get uvTransform_2(): Vector4 {
        return this.defaultPass.uniforms[`transformUV2`].vector4;
    }

    /**
     * set transformUV2
     */
    public set uvTransform_2(value: Vector4) {
        // this.defaultPass.uniforms[`transformUV2`].v4 = value;
        this.defaultPass.setUniformVector4(`transformUV2`, value);
    }

    public get depthWriteEnabled(): boolean {
        return this.defaultPass.shaderState.depthWriteEnabled;
    }
    public set depthWriteEnabled(value: boolean) {
        this.defaultPass.shaderState.depthWriteEnabled = value;
    }

    /**
     * get reflectivity
     */
    public get materialF0(): Vector4 {
        return this.defaultPass.uniforms[`materialF0`].vector4;
    }

    /**
     * set reflectivity
     */
    public set materialF0(value: Vector4) {
        this.defaultPass.setUniformVector4(`materialF0`, value);
    }

    /**
     * get roughness
     */
    public get roughness(): number {
        return this.defaultPass.uniforms[`roughness`].value;
    }

    /**
     * set roughness
     */
    public set roughness(value: number) {
        this.defaultPass.setUniformFloat(`roughness`, value);
    }

    /**
     * get metallic
     */
    public get metallic(): number {
        return this.defaultPass.uniforms[`metallic`].value;
    }

    /**
     * set metallic
     */
    public set metallic(value: number) {
        this.defaultPass.setUniformFloat(`metallic`, value);
    }

    /**
     * get Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public get ao(): number {
        return this.defaultPass.uniforms[`ao`].value;
    }

    /**
     * set Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public set ao(value: number) {
        this.defaultPass.setUniformFloat(`ao`, value);
    }

    /**
     * get min metallic
     */
    public get metallic_min(): number {
        return this.defaultPass.uniforms[`metallic_min`].value;
    }

    /**
     * set min metallic
     */
    public set metallic_min(value: number) {
        this.defaultPass.setUniformFloat(`metallic_min`, value);
    }

    /**
     * get max metallic
     */
    public get metallic_max(): number {
        return this.defaultPass.uniforms[`metallic_max`].value;
    }

    /**
     * set max metallic
     */
    public set metallic_max(value: number) {
        this.defaultPass.setUniformFloat(`metallic_max`, value);
    }

    /**
     * get min roughness
     */
    public get roughness_min(): number {
        return this.defaultPass.uniforms[`roughness_min`].value;
    }

    /**
     * set min roughness
     */
    public set roughness_min(value: number) {
        this.defaultPass.setUniformFloat(`roughness_min`, value);
    }

    /**
     * get max roughness
     */
    public get roughness_max(): number {
        return this.defaultPass.uniforms[`roughness_max`].value;
    }

    /**
     * set max roughness
     */
    public set roughness_max(value: number) {
        this.defaultPass.setUniformFloat(`roughness_max`, value);
    }

    /**
     * Get the influence of Normal mapping on materials
     */
    public get normalScale(): number {
        return this.defaultPass.uniforms[`normalScale`].value;
    }

    /**
     * Set the influence of Normal mapping on materials
     */
    public set normalScale(value: number) {
        this.defaultPass.setUniformFloat(`normalScale`, value);
    }

    /**
     * get Mask Map
     * R_chanel -> AoMap 
     * G_chanel -> Roughness
     * B_chanel -> Metallic
     * A_chanel -> C
     */
    public get maskMap(): Texture {
        return this.defaultPass.textures[`maskMap`];
    }

    /**
     * set Mask Map
     * R_chanel -> AoMap 
     * G_chanel -> Roughness
     * B_chanel -> Metallic
     * A_chanel -> C
     */
    public set maskMap(value: Texture) {
        // USE_MR
        // USE_ARMC
        this.defaultPass.setDefine(`USE_MR`, true);
        this.defaultPass.setTexture(`maskMap`, value);
    }

    /**
     * set Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public set aoMap(value: Texture) {
        if (!value) return;
        this.defaultPass.setTexture(`aoMap`, value);
        if (value != Engine3D.res.whiteTexture) {
            this.defaultPass.setDefine(`USE_AOTEX`, true);
        }
    }

    /**
     * get Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public get aoMap(): Texture {
        return this.defaultPass.textures[`aoMap`];
    }

    /**
     * set clearCoatRoughnessMap
     */
    public set clearCoatRoughnessMap(value: Texture) {
        if (!value) return;
        console.log("USE_CLEARCOAT_ROUGHNESS");

        this.defaultPass.setTexture(`clearCoatRoughnessMap`, value);
        this.defaultPass.setDefine(`USE_CLEARCOAT_ROUGHNESS`, true);
    }

    /**
     * get clearCoatRoughnessMap
     */
    public get clearCoatRoughnessMap(): Texture {
        return this.defaultPass.textures[`clearCoatRoughnessMap`];
    }

    /**
     * get brdf query map
     */
    public get brdfLUT(): Texture {
        return this.defaultPass.textures[`brdfLUT`];
    }

    /**
     * set brdf query map
     */
    public set brdfLUT(value: Texture) {
        this.defaultPass.setTexture(`brdfLUT`, value);
        this.defaultPass.setTexture(`brdflutMap`, value);
    }

    /**
     * get emissive map
     */
    public get emissiveMap(): Texture {
        return this.defaultPass.textures[`emissiveMap`];
    }

    /**
     * set emissive map
     */
    public set emissiveMap(value: Texture) {
        this.defaultPass.setTexture(`emissiveMap`, value);
    }

    /**
     * set intensity of environment light or color of sampled by texture
     */
    public set envIntensity(value: number) {
        this.defaultPass.setUniformFloat(`envIntensity`, value);
    }

    /**
     * get intensity of environment light or color of sampled by texture
     */
    public get envIntensity() {
        return this.defaultPass.uniforms[`envIntensity`].value;
    }

    /**
     * set factor of refractive
     */
    public set ior(value: number) {
        this.defaultPass.setUniformFloat(`ior`, value);
    }

    /**
     * get factor of refractive
     */
    public get ior(): number {
        return this.defaultPass.uniforms[`ior`].value;
    }

    /**
     * valid USE_CLEARCOAT define in shader
     */
    public useCleanCoat() {
        this.defaultPass.setDefine("USE_CLEARCOAT", true);
    }

    /**
     * Set the factor of the clearcoat
     */
    public set clearcoatFactor(value: number) {
        this.defaultPass.setUniformFloat(`clearcoatFactor`, value);
        this.useCleanCoat();
    }

    /**
     * get the factor of the clearcoat
     */
    public get clearcoatFactor(): number {
        return this.defaultPass.uniforms[`clearcoatFactor`].value;
    }

    /**
     * set the factor of the clearcoat Roughness
     */
    public set clearcoatRoughnessFactor(value: number) {
        this.defaultPass.setUniformFloat(`clearcoatRoughnessFactor`, value);
        this.useCleanCoat();
    }

    /**
     * get the factor of the clearcoat Roughness
     */
    public get clearcoatRoughnessFactor(): number {
        return this.defaultPass.uniforms[`clearcoatRoughnessFactor`].value;
    }

    /**
     * set the weight of the clearcoat
     */
    public set clearcoatWeight(value: number) {
        this.defaultPass.setUniformFloat(`clearcoatWeight`, value);
        this.useCleanCoat();
    }

    /**
     * get the weight of the clearcoat
     */
    public get clearcoatWeight(): number {
        return this.defaultPass.uniforms[`clearcoatWeight`].value;
    }

    /**
     * get the color of the clearcoat
     */
    public set clearcoatColor(value: Color) {
        this.defaultPass.setUniformColor(`clearcoatColor`, value);
        this.useCleanCoat();
    }

    /**
     * set the color of the clearcoat
     */
    public get clearcoatColor(): Color {
        return this.defaultPass.uniforms[`clearcoatColor`].color;
    }
}

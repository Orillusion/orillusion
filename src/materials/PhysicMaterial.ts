import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
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
        this.init();
    }

    private init() {
        let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
        this.brdfLUT = bdrflutTex;

        this.setDefault();
        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        this.emissiveMap = Engine3D.res.blackTexture;
        this.alphaCutoff = 0.5;
    }

    // public get shader(): RenderShader {
    //     return this._shader;
    // }

    /**
     * Set the render shader default value
     */
    public setDefault() {
        let colorPass = this.shader.getDefaultColorShader();
        colorPass.setUniformFloat(`shadowBias`, 0.00035);
        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformColor(`emissiveColor`, new Color(1, 1, 1));
        colorPass.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        colorPass.setUniformColor(`specularColor`, new Color(0.04, 0.04, 0.04));
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
        return this.shader.getDefaultColorShader().getTexture(`baseMap`);
    }

    public set baseMap(value: Texture) {
        this.shader.getDefaultColorShader().setTexture(`baseMap`, value);
    }

    public get baseColor(): Color {
        return this.shader.getDefaultColorShader().getUniform(`baseColor`);
    }

    public set baseColor(value: Color) {
        this.shader.getDefaultColorShader().setUniformColor(`baseColor`, value);
    }

    public get normalMap(): Texture {
        return this.shader.getDefaultColorShader().getTexture(`normalMap`);
    }

    public set normalMap(value: Texture) {
        this.shader.getDefaultColorShader().setTexture(`normalMap`, value);
    }

    public get doubleSide(): boolean {
        return this.shader.getDefaultColorShader().doubleSide;
    }
    public set doubleSide(value: boolean) {
        this.shader.getDefaultColorShader().doubleSide = value;
    }

    public get alphaCutoff(): any {
        return this.shader.getDefaultColorShader().shaderState.alphaCutoff;
    }
    public set alphaCutoff(value: any) {
        this.shader.getDefaultColorShader().setDefine("USE_ALPHACUT", true);
        this.shader.getDefaultColorShader().shaderState.alphaCutoff = value;
        this.shader.getDefaultColorShader().setUniform(`alphaCutoff`, value);
    }

    public get emissiveColor(): Color {
        return this.shader.getDefaultColorShader().getUniform(`emissiveColor`);
    }

    public set emissiveColor(value: Color) {
        this.shader.getDefaultColorShader().setUniform(`emissiveColor`, value);
    }

    public get emissiveIntensity(): number {
        return this.shader.getDefaultColorShader().getUniform(`emissiveIntensity`);
    }

    public set emissiveIntensity(value: number) {
        this.shader.getDefaultColorShader().setUniform(`emissiveIntensity`, value);
    }

    /**
     * get transformUV1
     */
    public get uvTransform_1(): Vector4 {
        return this.shader.getDefaultColorShader().uniforms[`transformUV1`].vector4;
    }

    /**
     * set transformUV1
     */
    public set uvTransform_1(value: Vector4) {
        // this.shader.getDefaultColorShader().uniforms[`transformUV1`].v4 = value;
        this.shader.getDefaultColorShader().setUniform(`transformUV1`, value);
    }

    /**
     * get transformUV2
     */
    public get uvTransform_2(): Vector4 {
        return this.shader.getDefaultColorShader().uniforms[`transformUV2`].vector4;
    }

    /**
     * set transformUV2
     */
    public set uvTransform_2(value: Vector4) {
        // this.shader.getDefaultColorShader().uniforms[`transformUV2`].v4 = value;
        this.shader.getDefaultColorShader().setUniform(`transformUV2`, value);
    }

    public get depthWriteEnabled(): boolean {
        return this.shader.getDefaultColorShader().shaderState.depthWriteEnabled;
    }
    public set depthWriteEnabled(value: boolean) {
        this.shader.getDefaultColorShader().shaderState.depthWriteEnabled = value;
    }

    /**
     * get reflectivity
     */
    public get materialF0(): Vector4 {
        return this.shader.getDefaultColorShader().uniforms[`materialF0`].vector4;
    }

    /**
     * set reflectivity
     */
    public set materialF0(value: Vector4) {
        this.shader.getDefaultColorShader().setUniform(`materialF0`, value);
    }

    /**
 * get specularColor
 */
    public get specularColor(): Color {
        return this.shader.getDefaultColorShader().uniforms[`specularColor`].color;
    }

    /**specularColor
     * set reflectivity
     */
    public set specularColor(value: Color) {
        this.shader.getDefaultColorShader().setUniform(`specularColor`, value);
    }

    /**
     * get roughness
     */
    public get roughness(): number {
        return this.shader.getDefaultColorShader().uniforms[`roughness`].value;
    }

    /**
     * set roughness
     */
    public set roughness(value: number) {
        this.shader.getDefaultColorShader().setUniform(`roughness`, value);
    }

    /**
     * get metallic
     */
    public get metallic(): number {
        return this.shader.getDefaultColorShader().uniforms[`metallic`].value;
    }

    /**
     * set metallic
     */
    public set metallic(value: number) {
        this.shader.getDefaultColorShader().setUniform(`metallic`, value);
    }

    /**
     * get Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public get ao(): number {
        return this.shader.getDefaultColorShader().uniforms[`ao`].value;
    }

    /**
     * set Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public set ao(value: number) {
        this.shader.getDefaultColorShader().setUniform(`ao`, value);
    }

    /**
     * get min metallic
     */
    public get metallic_min(): number {
        return this.shader.getDefaultColorShader().uniforms[`metallic_min`].value;
    }

    /**
     * set min metallic
     */
    public set metallic_min(value: number) {
        this.shader.getDefaultColorShader().setUniform(`metallic_min`, value);
    }

    /**
     * get max metallic
     */
    public get metallic_max(): number {
        return this.shader.getDefaultColorShader().uniforms[`metallic_max`].value;
    }

    /**
     * set max metallic
     */
    public set metallic_max(value: number) {
        this.shader.getDefaultColorShader().setUniform(`metallic_max`, value);
    }

    /**
     * get min roughness
     */
    public get roughness_min(): number {
        return this.shader.getDefaultColorShader().uniforms[`roughness_min`].value;
    }

    /**
     * set min roughness
     */
    public set roughness_min(value: number) {
        this.shader.getDefaultColorShader().setUniform(`roughness_min`, value);
    }

    /**
     * get max roughness
     */
    public get roughness_max(): number {
        return this.shader.getDefaultColorShader().uniforms[`roughness_max`].value;
    }

    /**
     * set max roughness
     */
    public set roughness_max(value: number) {
        this.shader.getDefaultColorShader().setUniform(`roughness_max`, value);
    }

    /**
     * Get the influence of Normal mapping on materials
     */
    public get normalScale(): number {
        return this.shader.getDefaultColorShader().uniforms[`normalScale`].value;
    }

    /**
     * Set the influence of Normal mapping on materials
     */
    public set normalScale(value: number) {
        this.shader.getDefaultColorShader().setUniform(`normalScale`, value);
    }

    /**
     * get Mask Map
     * R_chanel -> AoMap 
     * G_chanel -> Roughness
     * B_chanel -> Metallic
     * A_chanel -> C
     */
    public get maskMap(): Texture {
        return this.shader.getDefaultColorShader().textures[`maskMap`];
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
        // USE_ORMC
        // USE_RMOC
        // USE_CRMC
        this.shader.getDefaultColorShader().setDefine(`USE_MR`, true);
        this.shader.getDefaultColorShader().setTexture(`maskMap`, value);
    }

    /**
     * set Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public set aoMap(value: Texture) {
        if (!value) return;
        this.shader.getDefaultColorShader().setTexture(`aoMap`, value);
        if (value != Engine3D.res.whiteTexture) {
            this.shader.getDefaultColorShader().setDefine(`USE_AOTEX`, true);
        }
    }

    /**
     * get Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public get aoMap(): Texture {
        return this.shader.getDefaultColorShader().textures[`aoMap`];
    }

    /**
     * set clearCoatRoughnessMap
     */
    public set clearCoatRoughnessMap(value: Texture) {
        if (!value) return;
        console.log("USE_CLEARCOAT_ROUGHNESS");

        this.shader.getDefaultColorShader().setTexture(`clearCoatRoughnessMap`, value);
        this.shader.getDefaultColorShader().setDefine(`USE_CLEARCOAT_ROUGHNESS`, true);
    }

    /**
     * get clearCoatRoughnessMap
     */
    public get clearCoatRoughnessMap(): Texture {
        return this.shader.getDefaultColorShader().textures[`clearCoatRoughnessMap`];
    }

    /**
     * get brdf query map
     */
    public get brdfLUT(): Texture {
        return this.shader.getDefaultColorShader().textures[`brdfLUT`];
    }

    /**
     * set brdf query map
     */
    public set brdfLUT(value: Texture) {
        this.shader.getDefaultColorShader().setTexture(`brdfLUT`, value);
        this.shader.getDefaultColorShader().setTexture(`brdflutMap`, value);
    }

    /**
     * get emissive map
     */
    public get emissiveMap(): Texture {
        return this.shader.getDefaultColorShader().textures[`emissiveMap`];
    }

    /**
     * set emissive map
     */
    public set emissiveMap(value: Texture) {
        this.shader.getDefaultColorShader().setTexture(`emissiveMap`, value);
    }

    /**
     * set intensity of environment light or color of sampled by texture
     */
    public set envIntensity(value: number) {
        this.shader.getDefaultColorShader().setUniformFloat(`envIntensity`, value);
    }

    /**
     * get intensity of environment light or color of sampled by texture
     */
    public get envIntensity() {
        return this.shader.getDefaultColorShader().uniforms[`envIntensity`].value;
    }

    /**
     * set factor of refractive
     */
    public set ior(value: number) {
        this.shader.getDefaultColorShader().setUniformFloat(`ior`, value);
    }

    /**
     * get factor of refractive
     */
    public get ior(): number {
        return this.shader.getDefaultColorShader().uniforms[`ior`].value;
    }

    /**
     * valid USE_CLEARCOAT define in shader
     */
    public useCleanCoat() {
        this.shader.getDefaultColorShader().setDefine("USE_CLEARCOAT", true);
    }

    /**
     * Set the factor of the clearcoat
     */
    public set clearcoatFactor(value: number) {
        this.shader.getDefaultColorShader().setUniformFloat(`clearcoatFactor`, value);
        this.useCleanCoat();
    }

    /**
     * get the factor of the clearcoat
     */
    public get clearcoatFactor(): number {
        return this.shader.getDefaultColorShader().uniforms[`clearcoatFactor`].value;
    }

    /**
     * set the factor of the clearcoat Roughness
     */
    public set clearcoatRoughnessFactor(value: number) {
        this.shader.getDefaultColorShader().setUniformFloat(`clearcoatRoughnessFactor`, value);
        this.useCleanCoat();
    }

    /**
     * get the factor of the clearcoat Roughness
     */
    public get clearcoatRoughnessFactor(): number {
        return this.shader.getDefaultColorShader().uniforms[`clearcoatRoughnessFactor`].value;
    }

    /**
     * set the weight of the clearcoat
     */
    public set clearcoatWeight(value: number) {
        this.shader.getDefaultColorShader().setUniformFloat(`clearcoatWeight`, value);
        this.useCleanCoat();
    }

    /**
     * get the weight of the clearcoat
     */
    public get clearcoatWeight(): number {
        return this.shader.getDefaultColorShader().uniforms[`clearcoatWeight`].value;
    }

    /**
     * get the color of the clearcoat
     */
    public set clearcoatColor(value: Color) {
        this.shader.getDefaultColorShader().setUniformColor(`clearcoatColor`, value);
        this.useCleanCoat();
    }

    /**
     * set the color of the clearcoat
     */
    public get clearcoatColor(): Color {
        return this.shader.getDefaultColorShader().uniforms[`clearcoatColor`].color;
    }
}

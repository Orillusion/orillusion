import { Engine3D, PassType } from "../../../../..";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";


@RegisterShader
export class StandShader extends Shader {

    constructor() {
        super();

        let colorShader = new RenderShaderPass('PBRLItShader', 'PBRLItShader');
        colorShader.setShaderEntry(`VertMain`, `FragMain`)
        colorShader.passType = PassType.COLOR;
        this.addRenderPass(colorShader);

        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;
        this.setDefine('USE_BRDF', true);
        this.setDefine('USE_AO_R', true);
        this.setDefine('USE_ROUGHNESS_G', true);
        this.setDefine('USE_METALLIC_B', true);
        this.setDefine('USE_ALPHA_A', true);

        this.setDefault();
    }

    public setDefault() {
        this.setUniformFloat(`shadowBias`, 0.00035);
        this.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.setUniformColor(`baseColor`, new Color(0.75, 0.75, 0.75, 1.0));
        this.setUniformColor(`emissiveColor`, new Color(0, 0, 0));
        this.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        this.setUniformColor(`specularColor`, new Color(0.04, 0.04, 0.04));
        this.setUniformFloat(`envIntensity`, 1);
        this.setUniformFloat(`normalScale`, 1);
        this.setUniformFloat(`roughness`, 1.0);
        this.setUniformFloat(`metallic`, 1.0);
        this.setUniformFloat(`ao`, 1.0);
        this.setUniformFloat(`roughness_min`, 0.0);
        this.setUniformFloat(`roughness_max`, 1.0);
        this.setUniformFloat(`metallic_min`, 0.0);
        this.setUniformFloat(`metallic_max`, 1.0);
        this.setUniformFloat(`emissiveIntensity`, 0.0);
        this.setUniformFloat(`alphaCutoff`, 0.0);
        this.setUniformFloat(`ior`, 1.5);
        this.setUniformFloat(`clearcoatFactor`, 0.0);
        this.setUniformFloat(`clearcoatRoughnessFactor`, 0.0);
        this.setUniformColor(`clearcoatColor`, new Color(1, 1, 1));
        this.setUniformFloat(`clearcoatWeight`, 0.0);

        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        this.maskMap = Engine3D.res.maskTexture;
    }

    public get baseMap(): Texture {
        return this.getDefaultColorShader().getTexture(`baseMap`);
    }

    public set baseMap(value: Texture) {
        this.getDefaultColorShader().setTexture(`baseMap`, value);
    }

    public get baseColor(): Color {
        return this.getDefaultColorShader().getUniform(`baseColor`);
    }

    public set baseColor(value: Color) {
        this.getDefaultColorShader().setUniformColor(`baseColor`, value);
    }

    public get normalMap(): Texture {
        return this.getDefaultColorShader().getTexture(`normalMap`);
    }

    public set normalMap(value: Texture) {
        this.getDefaultColorShader().setTexture(`normalMap`, value);
    }

    public get doubleSide(): boolean {
        return this.getDefaultColorShader().doubleSide;
    }
    public set doubleSide(value: boolean) {
        this.getDefaultColorShader().doubleSide = value;
    }

    public get alphaCutoff(): any {
        return this.getDefaultColorShader().shaderState.alphaCutoff;
    }
    public set alphaCutoff(value: any) {
        this.getDefaultColorShader().setDefine("USE_ALPHACUT", true);
        this.getDefaultColorShader().shaderState.alphaCutoff = value;
        this.getDefaultColorShader().setUniform(`alphaCutoff`, value);
    }

    public get emissiveColor(): Color {
        return this.getDefaultColorShader().getUniform(`emissiveColor`);
    }

    public set emissiveColor(value: Color) {
        this.getDefaultColorShader().setUniform(`emissiveColor`, value);
    }

    public get emissiveIntensity(): number {
        return this.getDefaultColorShader().getUniform(`emissiveIntensity`);
    }

    public set emissiveIntensity(value: number) {
        this.getDefaultColorShader().setUniform(`emissiveIntensity`, value);
    }

    /**
     * get transformUV1
     */
    public get uvTransform_1(): Vector4 {
        return this.getDefaultColorShader().uniforms[`transformUV1`].vector4;
    }

    /**
     * set transformUV1
     */
    public set uvTransform_1(value: Vector4) {
        // this.getDefaultColorShader().uniforms[`transformUV1`].v4 = value;
        this.getDefaultColorShader().setUniform(`transformUV1`, value);
    }

    /**
     * get transformUV2
     */
    public get uvTransform_2(): Vector4 {
        return this.getDefaultColorShader().uniforms[`transformUV2`].vector4;
    }

    /**
     * set transformUV2
     */
    public set uvTransform_2(value: Vector4) {
        // this.getDefaultColorShader().uniforms[`transformUV2`].v4 = value;
        this.getDefaultColorShader().setUniform(`transformUV2`, value);
    }

    public get depthWriteEnabled(): boolean {
        return this.getDefaultColorShader().shaderState.depthWriteEnabled;
    }
    public set depthWriteEnabled(value: boolean) {
        this.getDefaultColorShader().shaderState.depthWriteEnabled = value;
    }

    /**
     * get reflectivity
     */
    public get materialF0(): Vector4 {
        return this.getDefaultColorShader().uniforms[`materialF0`].vector4;
    }

    /**
     * set reflectivity
     */
    public set materialF0(value: Vector4) {
        this.getDefaultColorShader().setUniform(`materialF0`, value);
    }

    /**
 * get specularColor
 */
    public get specularColor(): Color {
        return this.getDefaultColorShader().uniforms[`specularColor`].color;
    }

    /**specularColor
     * set reflectivity
     */
    public set specularColor(value: Color) {
        this.getDefaultColorShader().setUniform(`specularColor`, value);
    }

    /**
     * get roughness
     */
    public get roughness(): number {
        return this.getDefaultColorShader().uniforms[`roughness`].value;
    }

    /**
     * set roughness
     */
    public set roughness(value: number) {
        this.getDefaultColorShader().setUniform(`roughness`, value);
    }

    /**
     * get metallic
     */
    public get metallic(): number {
        return this.getDefaultColorShader().uniforms[`metallic`].value;
    }

    /**
     * set metallic
     */
    public set metallic(value: number) {
        this.getDefaultColorShader().setUniform(`metallic`, value);
    }

    /**
     * get Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public get ao(): number {
        return this.getDefaultColorShader().uniforms[`ao`].value;
    }

    /**
     * set Ambient Occlussion, dealing with the effect of ambient light on object occlusion
     */
    public set ao(value: number) {
        this.getDefaultColorShader().setUniform(`ao`, value);
    }

    /**
     * get min metallic
     */
    public get metallic_min(): number {
        return this.getDefaultColorShader().uniforms[`metallic_min`].value;
    }

    /**
     * set min metallic
     */
    public set metallic_min(value: number) {
        this.getDefaultColorShader().setUniform(`metallic_min`, value);
    }

    /**
     * get max metallic
     */
    public get metallic_max(): number {
        return this.getDefaultColorShader().uniforms[`metallic_max`].value;
    }

    /**
     * set max metallic
     */
    public set metallic_max(value: number) {
        this.getDefaultColorShader().setUniform(`metallic_max`, value);
    }

    /**
     * get min roughness
     */
    public get roughness_min(): number {
        return this.getDefaultColorShader().uniforms[`roughness_min`].value;
    }

    /**
     * set min roughness
     */
    public set roughness_min(value: number) {
        this.getDefaultColorShader().setUniform(`roughness_min`, value);
    }

    /**
     * get max roughness
     */
    public get roughness_max(): number {
        return this.getDefaultColorShader().uniforms[`roughness_max`].value;
    }

    /**
     * set max roughness
     */
    public set roughness_max(value: number) {
        this.getDefaultColorShader().setUniform(`roughness_max`, value);
    }

    /**
     * Get the influence of Normal mapping on materials
     */
    public get normalScale(): number {
        return this.getDefaultColorShader().uniforms[`normalScale`].value;
    }

    /**
     * Set the influence of Normal mapping on materials
     */
    public set normalScale(value: number) {
        this.getDefaultColorShader().setUniform(`normalScale`, value);
    }

    /**
     * get Mask Map
     * R_chanel -> AoMap 
     * G_chanel -> Roughness
     * B_chanel -> Metallic
     * A_chanel -> C
     */
    public get maskMap(): Texture {
        return this.getDefaultColorShader().textures[`maskMap`];
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
        this.getDefaultColorShader().setDefine(`USE_MR`, true);
        this.getDefaultColorShader().setTexture(`maskMap`, value);
    }

    /**
     * set Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public set aoMap(value: Texture) {
        if (!value) return;
        this.getDefaultColorShader().setTexture(`aoMap`, value);
        if (value != Engine3D.res.whiteTexture) {
            this.getDefaultColorShader().setDefine(`USE_AOTEX`, true);
        }
    }

    /**
     * get Ambient Occlussion Map, dealing with the effect of ambient light on object occlusion
     */
    public get aoMap(): Texture {
        return this.getDefaultColorShader().textures[`aoMap`];
    }

    /**
     * set clearCoatRoughnessMap
     */
    public set clearCoatRoughnessMap(value: Texture) {
        if (!value) return;
        console.log("USE_CLEARCOAT_ROUGHNESS");

        this.getDefaultColorShader().setTexture(`clearCoatRoughnessMap`, value);
        this.getDefaultColorShader().setDefine(`USE_CLEARCOAT_ROUGHNESS`, true);
    }

    /**
     * get clearCoatRoughnessMap
     */
    public get clearCoatRoughnessMap(): Texture {
        return this.getDefaultColorShader().textures[`clearCoatRoughnessMap`];
    }

    /**
     * get brdf query map
     */
    public get brdfLUT(): Texture {
        return this.getDefaultColorShader().textures[`brdfLUT`];
    }

    /**
     * set brdf query map
     */
    public set brdfLUT(value: Texture) {
        this.getDefaultColorShader().setTexture(`brdfLUT`, value);
        this.getDefaultColorShader().setTexture(`brdflutMap`, value);
    }

    /**
     * get emissive map
     */
    public get emissiveMap(): Texture {
        return this.getDefaultColorShader().textures[`emissiveMap`];
    }

    /**
     * set emissive map
     */
    public set emissiveMap(value: Texture) {
        this.getDefaultColorShader().setTexture(`emissiveMap`, value);
    }

    /**
     * set intensity of environment light or color of sampled by texture
     */
    public set envIntensity(value: number) {
        this.getDefaultColorShader().setUniformFloat(`envIntensity`, value);
    }

    /**
     * get intensity of environment light or color of sampled by texture
     */
    public get envIntensity() {
        return this.getDefaultColorShader().uniforms[`envIntensity`].value;
    }

    /**
     * set factor of refractive
     */
    public set ior(value: number) {
        this.getDefaultColorShader().setUniformFloat(`ior`, value);
    }

    /**
     * get factor of refractive
     */
    public get ior(): number {
        return this.getDefaultColorShader().uniforms[`ior`].value;
    }

    /**
     * valid USE_CLEARCOAT define in shader
     */
    public useCleanCoat() {
        this.getDefaultColorShader().setDefine("USE_CLEARCOAT", true);
    }

    /**
     * Set the factor of the clearcoat
     */
    public set clearcoatFactor(value: number) {
        this.getDefaultColorShader().setUniformFloat(`clearcoatFactor`, value);
        this.useCleanCoat();
    }

    /**
     * get the factor of the clearcoat
     */
    public get clearcoatFactor(): number {
        return this.getDefaultColorShader().uniforms[`clearcoatFactor`].value;
    }

    /**
     * set the factor of the clearcoat Roughness
     */
    public set clearcoatRoughnessFactor(value: number) {
        this.getDefaultColorShader().setUniformFloat(`clearcoatRoughnessFactor`, value);
        this.useCleanCoat();
    }

    /**
     * get the factor of the clearcoat Roughness
     */
    public get clearcoatRoughnessFactor(): number {
        return this.getDefaultColorShader().uniforms[`clearcoatRoughnessFactor`].value;
    }

    /**
     * set the weight of the clearcoat
     */
    public set clearcoatWeight(value: number) {
        this.getDefaultColorShader().setUniformFloat(`clearcoatWeight`, value);
        this.useCleanCoat();
    }

    /**
     * get the weight of the clearcoat
     */
    public get clearcoatWeight(): number {
        return this.getDefaultColorShader().uniforms[`clearcoatWeight`].value;
    }

    /**
     * get the color of the clearcoat
     */
    public set clearcoatColor(value: Color) {
        this.getDefaultColorShader().setUniformColor(`clearcoatColor`, value);
        this.useCleanCoat();
    }

    /**
     * set the color of the clearcoat
     */
    public get clearcoatColor(): Color {
        return this.getDefaultColorShader().uniforms[`clearcoatColor`].color;
    }
}
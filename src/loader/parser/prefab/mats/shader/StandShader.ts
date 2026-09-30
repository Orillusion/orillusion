import { Engine3D, PassType } from "../../../../..";
import { Context3D } from "../../../../../gfx/graphics/webGpu/Context3D";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { RTResourceMap } from "../../../../../gfx/renderJob/frame/RTResourceMap";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";


/**
 * Internal PBR shader used by the prefab material pipeline. Wraps a single
 * PBR color pass and exposes typed getters/setters for its uniforms and maps.
 * @internal
 */
export class StandShader extends Shader {

    private _ctx: Context3D | undefined;

    constructor(ctx?: Context3D) {
        super();
        this._ctx = ctx;

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
        // this.setDefine('USE_AO_R', true);
        this.setDefine('USE_ROUGHNESS_G', true);
        this.setDefine('USE_METALLIC_B', true);
        this.setDefine('USE_ALPHA_A', true);

        this.setDefault();
    }

    public setDefault() {
        this.setUniformFloat(`shadowBias`, 0.00035);

        this.setUniformColor(`baseColor`, new Color(0.75, 0.75, 0.75, 1.0));
        this.setUniformColor(`emissiveColor`, new Color(0, 0, 0));
        this.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        // .rgb = F0 modulator (KHR_materials_specular). The base
        // dielectric F0 is the canonical 0.04 — multiplied by this
        // color to tint grazing-angle reflection. Default (1,1,1)
        // keeps F0 at 0.04 (standard polished glass).
        // .a = specularIntensity — scales the preserved specular term
        // in the transmission shader path. 1.0 = no attenuation.
        this.setUniformColor(`specularColor`, new Color(1.0, 1.0, 1.0, 1.0));
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
        this.setUniformFloat(`clearcoatIor`, 1.5);

        // Transmission (KHR_materials_transmission / _volume). Defaults
        // are "no transmission" so enabling only costs one branch in
        // the shader when the material actually needs it.
        this.setUniformFloat(`transmissionFactor`, 0.0);
        this.setUniformFloat(`thicknessFactor`, 0.0);
        this.setUniformFloat(`attenuationDistance`, 1.0e20);
        this.setUniformFloat(`transmissionAlphaMode`, 0.0);
        this.setUniformColor(`attenuationColor`, new Color(1, 1, 1, 1));
        // KHR_materials_sheen: rgb = sheen color (0 = no sheen), a = sheen roughness.
        this.setUniformColor(`sheenColor`, new Color(0, 0, 0, 0));

        this.setUniformVector4(`baseMapOffsetSize`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`normalMapOffsetSize`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`emissiveMapOffsetSize`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`roughnessMapOffsetSize`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`metallicMapOffsetSize`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`aoMapOffsetSize`, new Vector4(0, 0, 1, 1));

        const res = Engine3D.resFor(this._ctx);
        this.baseMap = res.whiteTexture;
        this.normalMap = res.normalTexture;
        this.maskMap = res.maskTexture;

        // SceneColorPyramid placeholder. The texture slot is only
        // consumed when `USE_TRANSMISSION` is defined (see PBRLItShader),
        // so binding the white texture here is a harmless default for
        // opaque materials. When transmission is enabled the material
        // setter resolves the real pyramid from RTResourceMap.
        const pyramid = this._ctx ? RTResourceMap.getTexture(this._ctx, '_SceneColorPyramid') : null;
        this.setTexture('sceneColorPyramid', pyramid ?? res.whiteTexture);
    }

    /**
     * The base (albedo) color map.
     */
    public get baseMap(): Texture {
        return this.getDefaultColorShader().getTexture(`baseMap`);
    }

    /**
     * The base (albedo) color map.
     */
    public set baseMap(value: Texture) {
        this.getDefaultColorShader().setTexture(`baseMap`, value);
    }

    /**
     * The base (albedo) color tint.
     */
    public get baseColor(): Color {
        return this.getDefaultColorShader().getUniform(`baseColor`);
    }

    /**
     * The base (albedo) color tint.
     */
    public set baseColor(value: Color) {
        this.getDefaultColorShader().setUniformColor(`baseColor`, value);
    }

    /**
     * The tangent-space normal map.
     */
    public get normalMap(): Texture {
        return this.getDefaultColorShader().getTexture(`normalMap`);
    }

    /**
     * The tangent-space normal map.
     */
    public set normalMap(value: Texture) {
        this.getDefaultColorShader().setTexture(`normalMap`, value);
    }

    /**
     * Whether the surface is rendered double-sided.
     */
    public get doubleSide(): boolean {
        return this.getDefaultColorShader().doubleSide;
    }
    /**
     * Whether the surface is rendered double-sided.
     */
    public set doubleSide(value: boolean) {
        this.getDefaultColorShader().doubleSide = value;
    }

    /**
     * The alpha cutoff threshold used for alpha-clip rendering.
     */
    public get alphaCutoff(): any {
        return this.getDefaultColorShader().shaderState.alphaCutoff;
    }
    /**
     * The alpha cutoff threshold used for alpha-clip rendering. Setting this
     * also enables the `USE_ALPHACUT` shader define.
     */
    public set alphaCutoff(value: any) {
        this.getDefaultColorShader().setDefine("USE_ALPHACUT", true);
        this.getDefaultColorShader().shaderState.alphaCutoff = value;
        this.getDefaultColorShader().setUniform(`alphaCutoff`, value);
    }

    /**
     * The emissive color.
     */
    public get emissiveColor(): Color {
        return this.getDefaultColorShader().getUniform(`emissiveColor`);
    }

    /**
     * The emissive color.
     */
    public set emissiveColor(value: Color) {
        this.getDefaultColorShader().setUniform(`emissiveColor`, value);
    }

    /**
     * The emissive intensity multiplier.
     */
    public get emissiveIntensity(): number {
        return this.getDefaultColorShader().getUniform(`emissiveIntensity`);
    }

    /**
     * The emissive intensity multiplier.
     */
    public set emissiveIntensity(value: number) {
        this.getDefaultColorShader().setUniform(`emissiveIntensity`, value);
    }

    /**
     * get transformUV1
     */
    public get transformUV1(): Vector4 {
        return this.getDefaultColorShader().uniforms[`transformUV1`].vector4;
    }

    /**
     * set transformUV1
     */
    public set transformUV1(value: Vector4) {
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

    /**
     * Whether depth writes are enabled for the color pass.
     */
    public get depthWriteEnabled(): boolean {
        return this.getDefaultColorShader().shaderState.depthWriteEnabled;
    }
    /**
     * Whether depth writes are enabled for the color pass.
     */
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
     * The specular color / reflectivity tint.
     */
    public get specularColor(): Color {
        return this.getDefaultColorShader().uniforms[`specularColor`].color;
    }

    /**
     * The specular color / reflectivity tint.
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
        if (value != Engine3D.resFor(this._ctx).whiteTexture) {
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
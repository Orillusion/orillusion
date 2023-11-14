import { Engine3D } from "../Engine3D";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../gfx/graphics/webGpu/shader/RenderShaderPass";
import { StandShader } from "../loader/parser/prefab/mats/shader/StandShader";
import { Color } from "../math/Color";
import { Material } from "./Material";
import { PhysicMaterial } from "./PhysicMaterial";

export class LitMaterial extends Material {

    constructor() {
        super();

        let shader = new StandShader();
        this.shader = shader;
    }

    public clone(): Material {
        let litMaterial = new LitMaterial();

        let colorPass = litMaterial.shader.getDefaultColorShader();
        let sourceShader = this.shader.getDefaultColorShader();
        colorPass.defineValue = { ...sourceShader.defineValue }
        colorPass.setUniform(`shadowBias`, sourceShader.getUniform(`shadowBias`));
        colorPass.setUniform(`transformUV1`, sourceShader.getUniform(`transformUV1`));
        colorPass.setUniform(`transformUV2`, sourceShader.getUniform(`transformUV2`));
        colorPass.setUniform(`baseColor`, sourceShader.getUniform(`baseColor`));
        colorPass.setUniform(`specularColor`, sourceShader.getUniform(`specularColor`));
        colorPass.setUniform(`emissiveColor`, sourceShader.getUniform(`emissiveColor`));
        colorPass.setUniform(`materialF0`, sourceShader.getUniform(`materialF0`));
        colorPass.setUniform(`envIntensity`, sourceShader.getUniform(`envIntensity`));
        colorPass.setUniform(`normalScale`, sourceShader.getUniform(`normalScale`));
        colorPass.setUniform(`roughness`, sourceShader.getUniform(`roughness`));
        colorPass.setUniform(`metallic`, sourceShader.getUniform(`metallic`));
        colorPass.setUniform(`ao`, sourceShader.getUniform(`ao`));
        colorPass.setUniform(`roughness_min`, sourceShader.getUniform(`roughness_min`));
        colorPass.setUniform(`roughness_max`, sourceShader.getUniform(`roughness_max`));
        colorPass.setUniform(`metallic_min`, sourceShader.getUniform(`metallic_min`));
        colorPass.setUniform(`metallic_max`, sourceShader.getUniform(`metallic_max`));
        colorPass.setUniform(`emissiveIntensity`, sourceShader.getUniform(`emissiveIntensity`));
        colorPass.setUniform(`alphaCutoff`, sourceShader.getUniform(`alphaCutoff`));
        colorPass.setUniform(`ior`, sourceShader.getUniform(`ior`));
        colorPass.setUniform(`clearcoatFactor`, sourceShader.getUniform(`clearcoatFactor`));
        colorPass.setUniform(`clearcoatRoughnessFactor`, sourceShader.getUniform(`clearcoatRoughnessFactor`));
        colorPass.setUniform(`clearcoatColor`, sourceShader.getUniform(`clearcoatColor`));
        colorPass.setUniform(`clearcoatWeight`, sourceShader.getUniform(`clearcoatWeight`));

        colorPass.setTexture(`baseMap`, sourceShader.getTexture(`baseMap`));
        colorPass.setTexture(`normalMap`, sourceShader.getTexture(`normalMap`));
        colorPass.setTexture(`emissiveMap`, sourceShader.getTexture(`emissiveMap`));
        colorPass.setTexture(`aoMap`, sourceShader.getTexture(`aoMap`));
        colorPass.setTexture(`maskMap`, sourceShader.getTexture(`maskMap`));
        return litMaterial;
    }

    public set baseMap(texture: Texture) {
        this.shader.setTexture(`baseMap`, texture);
    }

    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    public set maskMap(texture: Texture) {
        this.shader.setTexture(`maskMap`, texture);
    }

    public get maskMap() {
        return this.shader.getTexture(`maskMap`);
    }


    public set normalMap(texture: Texture) {
        this.shader.setTexture(`normalMap`, texture);
    }

    public get normalMap() {
        return this.shader.getTexture(`normalMap`);
    }

    public set emissiveMap(texture: Texture) {
        this.shader.setTexture(`emissiveMap`, texture);
    }

    public get emissiveMap() {
        return this.shader.getTexture(`emissiveMap`);
    }

    public set aoMap(texture: Texture) {
        this.shader.setTexture(`aoMap`, texture);
    }

    public get aoMap() {
        return this.shader.getTexture(`aoMap`);
    }

    public set clearCoatRoughnessMap(texture: Texture) {
        this.shader.setTexture(`clearCoatRoughnessMap`, texture);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
        this.shader.setDefine(`USE_CLEARCOAT_ROUGHNESS`, true);
    }

    public get clearCoatRoughnessMap() {
        return this.shader.getTexture(`clearCoatRoughnessMap`);
    }

    public set clearcoatColor(value: Color) {
        this.shader.setUniformColor(`clearcoatColor`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    public get clearcoatColor() {
        return this.shader.getUniformColor(`clearcoatColor`);
    }

    public set clearcoatWeight(value: number) {
        this.shader.setUniformFloat(`clearcoatWeight`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    public get clearcoatWeight() {
        return this.shader.getUniformFloat(`clearcoatWeight`);
    }

    public set clearcoatFactor(value: number) {
        this.shader.setUniformFloat(`clearcoatFactor`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    public get clearcoatFactor() {
        return this.shader.getUniformFloat(`clearcoatFactor`);
    }


    public set clearcoatRoughnessFactor(value: number) {
        this.shader.setUniformFloat(`clearcoatRoughnessFactor`, value);
        this.shader.setDefine(`USE_CLEARCOAT`, true);
    }

    public get clearcoatRoughnessFactor() {
        return this.shader.getUniformFloat(`clearcoatRoughnessFactor`);
    }

    public set alphaCutoff(value: number) {
        this.shader.setUniform(`alphaCutoff`, value);
    }

    public get alphaCutoff() {
        return this.shader.getUniform(`alphaCutoff`);
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

    public get roughness(): number {
        return this.shader.getUniformFloat("roughness");
    }

    public set roughness(value: number) {
        this.shader.setUniformFloat("roughness", value);
    }

    public get metallic(): number {
        return this.shader.getUniformFloat("metallic");
    }

    public set metallic(value: number) {
        this.shader.setUniformFloat("metallic", value);
    }

    public get emissiveColor(): Color {
        return this.shader.getUniformColor("emissiveColor");
    }

    public set emissiveColor(value: Color) {
        this.shader.setUniformColor("emissiveColor", value);
    }

    public get emissiveIntensity(): number {
        return this.shader.getUniformFloat("emissiveIntensity");
    }

    public set emissiveIntensity(value: number) {
        this.shader.setUniformFloat("emissiveIntensity", value);
    }

    public get ao(): number {
        return this.shader.getUniform(`ao`);
    }

    public set ao(value: number) {
        this.shader.setUniform(`ao`, value);
    }
}
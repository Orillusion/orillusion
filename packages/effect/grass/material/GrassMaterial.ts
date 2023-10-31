import { BlendMode, Color, GPUAddressMode, Material, RenderShaderPass, PassType, Shader, ShaderLib, Texture, Vector2, Vector3, Vector4 } from "@orillusion/core";
import { GrassShader } from "../shader/GrassShader";
import { GrassVertexAttributeShader } from "../shader/GrassVertexAttributeShader";
import { GrassCastShadowShader } from "../shader/GrassCastShadowShader";

export class GrassMaterial extends Material {
    constructor() {
        super();

        let newShader = new Shader();
        ShaderLib.register("GrassVertexAttributeShader", GrassVertexAttributeShader);
        ShaderLib.register("GrassShader", GrassShader);

        let colorPass = new RenderShaderPass(`GrassShader`, `GrassShader`);
        colorPass.passType = PassType.COLOR;
        colorPass.setShaderEntry(`VertMain`, `FragMain`)
        colorPass.setDefine("TRANSFORMVERTEX", true);
        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = false;
        shaderState.useLight = true;
        shaderState.castShadow = false;
        shaderState.blendMode = BlendMode.NONE;
        newShader.addRenderPass(colorPass);

        ShaderLib.register("GrassCastShadowShader", GrassCastShadowShader);

        let shadowPass = new RenderShaderPass(`GrassCastShadowShader`, `GrassCastShadowShader`);
        shadowPass.passType = PassType.SHADOW
        shadowPass.setDefine("USE_ALPHACUT", true);
        shadowPass.setDefine("TRANSFORMVERTEX", true);
        shadowPass.setShaderEntry(`VertMain`)
        shadowPass.shaderState.blendMode = BlendMode.NONE;
        shadowPass.shaderState.receiveEnv = false;
        newShader.addRenderPass(shadowPass);

        colorPass.setUniformColor("baseColor", new Color(0.0, 1.0, 0.0, 1.0));
        colorPass.setUniformColor("grassBottomColor", new Color(3 / 255, 16 / 255, 3 / 255));
        colorPass.setUniformColor("grassTopColor", new Color(45 / 255, 154 / 255, 74 / 255, 1.0));
        colorPass.setUniformColor("materialF0", new Color(0.04, 0.04, 0.04, 1.0 - 0.04));
        colorPass.setUniformVector4("windBound", new Vector4(0, 0, 2000, 2000));
        colorPass.setUniformVector2("windDirection", new Vector2(0.6, 0.8));
        colorPass.setUniformFloat("windPower", 0.8);
        colorPass.setUniformFloat("windSpeed", 12);
        colorPass.setUniformFloat("translucent", 0.35);
        colorPass.setUniformFloat("roughness", 0.35);
        colorPass.setUniformFloat("curvature", 0.4068);
        colorPass.setUniformFloat("grassHeight", 10);
        colorPass.setUniformFloat("soft", 5);
        colorPass.setUniformFloat("specular", 0.15);

        shadowPass.setUniformColor("baseColor", new Color(0.0, 1.0, 0.0, 1.0));
        shadowPass.setUniformColor("grassBottomColor", new Color(39 / 255, 87 / 255, 36 / 255));
        shadowPass.setUniformColor("grassTopColor", new Color(74 / 255, 163 / 255, 93 / 255, 1.0));
        shadowPass.setUniformColor("materialF0", new Color(0.04, 0.04, 0.04, 1.0 - 0.04));
        shadowPass.setUniformVector4("windBound", new Vector4(0, 0, 2000, 2000));
        shadowPass.setUniformVector2("windDirection", new Vector2(0.6, 0.8));
        shadowPass.setUniformFloat("windPower", 0.8);
        shadowPass.setUniformFloat("windSpeed", 10);
        shadowPass.setUniformFloat("translucent", 0.35);
        shadowPass.setUniformFloat("roughness", 0.35);
        shadowPass.setUniformFloat("curvature", 0.4068);
        shadowPass.setUniformFloat("grassHeight", 10);
        shadowPass.setUniformFloat("soft", 5);
        shadowPass.setUniformFloat("specular", 0.15);

        // default value
        // this.baseMap = Engine3D.res.whiteTexture;
        colorPass.doubleSide = true;
        shadowPass.doubleSide = true;

        this.shader = newShader;
    }

    public set baseMap(texture: Texture) {
        this.shader.setTexture(`baseMap`, texture);
    }

    public get baseMap(): Texture {
        return this.shader.getTexture(`baseMap`);
    }

    public set windMap(texture: Texture) {
        // texture.visibility = GPUShaderStage.VERTEX;
        texture.addressModeU = GPUAddressMode.repeat;
        texture.addressModeV = GPUAddressMode.repeat;
        this.shader.setTexture("windMap", texture);
    }

    public set windBound(v: Vector4) {
        this.shader.setUniformVector4("windBound", v);
    }

    public get windBound(): Vector4 {
        return this.shader.getUniform("windBound").data;
    }

    public set grassBaseColor(v: Color) {
        this.shader.setUniformColor("grassBottomColor", v);
    }

    public get grassBaseColor(): Color {
        return this.shader.getUniformColor("grassBottomColor");
    }

    public set grassTopColor(v: Color) {
        this.shader.setUniformColor("grassTopColor", v);
    }

    public get grassTopColor(): Color {
        return this.shader.getUniformColor("grassTopColor");
    }

    public set windDirection(v: Vector2) {
        this.shader.setUniformVector2("windDirection", v);
    }

    public get windDirection(): Vector2 {
        return this.shader.getUniform("windDirection").data;
    }

    public set windPower(v: number) {
        this.shader.setUniformFloat("windPower", v);
    }

    public get windPower(): number {
        return this.shader.getUniform("windPower").data;
    }

    public set windSpeed(v: number) {
        this.shader.setUniformFloat("windSpeed", v);
    }

    public get windSpeed(): number {
        return this.shader.getUniform("windSpeed").data;
    }

    public set grassHeight(v: number) {
        this.shader.setUniformFloat("grassHeight", v);
    }

    public get grassHeight(): number {
        return this.shader.getUniform("grassHeight").data;
    }

    public set curvature(v: number) {
        this.shader.setUniformFloat("curvature", v);
    }

    public get curvature(): number {
        return this.shader.getUniform("curvature").data;
    }

    public set roughness(v: number) {
        this.shader.setUniformFloat("roughness", v);
    }

    public get roughness(): number {
        return this.shader.getUniform("roughness").data;
    }

    public set translucent(v: number) {
        this.shader.setUniformFloat("translucent", v);
    }

    public get translucent(): number {
        return this.shader.getUniform("translucent").data;
    }

    public set soft(v: number) {
        this.shader.setUniformFloat("soft", v);
    }

    public get soft(): number {
        return this.shader.getUniform("soft").data;
    }

    public set specular(v: number) {
        this.shader.setUniformFloat("specular", v);
    }

    public get specular(): number {
        return this.shader.getUniform("specular").data;
    }
}
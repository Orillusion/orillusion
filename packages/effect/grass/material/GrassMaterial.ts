import { BlendMode, Color, GPUAddressMode, Material, RenderShader, RendererType, ShaderLib, Texture, Vector2, Vector3, Vector4 } from "@orillusion/core";
import { GrassShader } from "../shader/GrassShader";
import { GrassVertexAttributeShader } from "../shader/GrassVertexAttributeShader";
import { GrassCastShadowShader } from "../shader/GrassCastShadowShader";

export class GrassMaterial extends Material {
    constructor() {
        super();

        ShaderLib.register("GrassVertexAttributeShader", GrassVertexAttributeShader);
        ShaderLib.register("GrassShader", GrassShader);

        let colorPass = new RenderShader(`GrassShader`, `GrassShader`);
        this.defaultPass = colorPass;
        colorPass.setShaderEntry(`VertMain`, `FragMain`)
        colorPass.setDefine("TRANSFORMVERTEX", true);
        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = false;
        shaderState.useLight = true;
        shaderState.castShadow = false;
        shaderState.blendMode = BlendMode.NONE;

        ShaderLib.register("GrassCastShadowShader", GrassCastShadowShader);

        let shadowPass = new RenderShader(`GrassCastShadowShader`, `GrassCastShadowShader`);
        shadowPass.setDefine("USE_ALPHACUT", true);
        shadowPass.setDefine("TRANSFORMVERTEX", true);
        shadowPass.setShaderEntry(`VertMain`)
        shadowPass.shaderState.blendMode = BlendMode.NONE;
        shadowPass.shaderState.receiveEnv = false;
        this.addPass(RendererType.SHADOW, shadowPass);


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
    }

    public set baseMap(texture: Texture) {
        texture.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        this.defaultPass.setTexture(`baseMap`, texture);
        shadowPass.setTexture(`baseMap`, texture);
    }

    public get baseMap(): Texture {
        return this.defaultPass.getTexture(`baseMap`);
    }

    public set windMap(texture: Texture) {
        texture.visibility = GPUShaderStage.VERTEX;
        texture.addressModeU = GPUAddressMode.repeat;
        texture.addressModeV = GPUAddressMode.repeat;
        this.defaultPass.setTexture("windMap", texture);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setTexture("windMap", texture);
    }

    public set windBound(v: Vector4) {
        this.defaultPass.setUniformVector4("windBound", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        this.defaultPass.setUniformVector4("windBound", v);
        shadowPass.setUniformVector4("windBound", v);
    }

    public get windBound(): Vector4 {
        return this.defaultPass.uniforms["windBound"].vector4;
    }

    public set grassBaseColor(v: Color) {
        this.defaultPass.setUniformColor("grassBottomColor", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];
        shadowPass.setUniformColor("grassBottomColor", v);
    }

    public get grassBaseColor(): Color {
        return this.defaultPass.uniforms["grassBottomColor"].color;
    }

    public set grassTopColor(v: Color) {
        this.defaultPass.setUniformColor("grassTopColor", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformColor("grassTopColor", v);
    }

    public get grassTopColor(): Color {
        return this.defaultPass.uniforms["grassTopColor"].color;
    }

    public set windDirection(v: Vector2) {
        this.defaultPass.setUniformVector2("windDirection", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformVector2("windDirection", v);
    }

    public get windDirection(): Vector2 {
        return this.defaultPass.uniforms["windDirection"].vector2;
    }

    public set windPower(v: number) {
        this.defaultPass.setUniformFloat("windPower", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("windPower", v);
    }

    public get windPower(): number {
        return this.defaultPass.uniforms["windPower"].data;
    }

    public set windSpeed(v: number) {
        this.defaultPass.setUniformFloat("windSpeed", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("windSpeed", v);
    }

    public get windSpeed(): number {
        return this.defaultPass.uniforms["windSpeed"].data;
    }

    public set grassHeight(v: number) {
        this.defaultPass.setUniformFloat("grassHeight", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("grassHeight", v);
    }

    public get grassHeight(): number {
        return this.defaultPass.uniforms["grassHeight"].data;
    }

    public set curvature(v: number) {
        this.defaultPass.setUniformFloat("curvature", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("curvature", v);
    }

    public get curvature(): number {
        return this.defaultPass.uniforms["curvature"].data;
    }

    public set roughness(v: number) {
        this.defaultPass.setUniformFloat("roughness", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("roughness", v);
    }

    public get roughness(): number {
        return this.defaultPass.uniforms["roughness"].data;
    }

    public set translucent(v: number) {
        this.defaultPass.setUniformFloat("translucent", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("translucent", v);
    }

    public get translucent(): number {
        return this.defaultPass.uniforms["translucent"].data;
    }

    public set soft(v: number) {
        this.defaultPass.setUniformFloat("soft", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("soft", v);
    }

    public get soft(): number {
        return this.defaultPass.uniforms["soft"].data;
    }

    public set specular(v: number) {
        this.defaultPass.setUniformFloat("specular", v);
        let shadowPass = this.getPass(RendererType.SHADOW)[0];

        shadowPass.setUniformFloat("specular", v);
    }

    public get specular(): number {
        return this.defaultPass.uniforms["specular"].data;
    }
}
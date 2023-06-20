import { BlendMode, Color, Engine3D, GPUAddressMode, MaterialBase, MaterialPass, RendererType, ShaderLib, Texture, Vector2, Vector3, Vector4 } from "@orillusion/core";
import { GrassShader } from "../shader/GrassShader";
import { GrassVertexAttributeShader } from "../shader/GrassVertexAttributeShader";
import { GrassCastShadowShader } from "../shader/GrassCastShadowShader";

export class GrassMaterial extends MaterialBase {
    constructor() {
        super();

        ShaderLib.register("GrassVertexAttributeShader", GrassVertexAttributeShader);
        ShaderLib.register("GrassShader", GrassShader);

        let shader = this.setShader(`GrassShader`, `GrassShader`);
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setDefine("TRANSFORMVERTEX", true);
        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = false;
        shaderState.useLight = true;
        shaderState.castShadow = false;
        shaderState.blendMode = BlendMode.NONE;

        ShaderLib.register("GrassCastShadowShader", GrassCastShadowShader);
        let shadowPass = new MaterialBase();
        shadowPass.isPassMaterial = true;
        let shadowShader = shadowPass.setShader(`GrassCastShadowShader`, `GrassCastShadowShader`);
        shadowPass.setDefine("USE_ALPHACUT", true);
        shadowPass.setDefine("TRANSFORMVERTEX", true);
        shadowShader.setShaderEntry(`VertMain`)
        shadowShader.shaderState.blendMode = BlendMode.NONE;
        shadowShader.shaderState.receiveEnv = false;
        shader.setPassShader(RendererType.SHADOW, shadowPass);
        this.addPass(RendererType.SHADOW, shadowPass);


        shader.setUniformColor("baseColor", new Color(0.0, 1.0, 0.0, 1.0));
        shader.setUniformColor("grassBottomColor", new Color(3 / 255, 16 / 255, 3 / 255));
        shader.setUniformColor("grassTopColor", new Color(45 / 255, 154 / 255, 74 / 255, 1.0));
        shader.setUniformColor("materialF0", new Color(0.04, 0.04, 0.04, 1.0 - 0.04));
        shader.setUniformVector4("windBound", new Vector4(0, 0, 2000, 2000));
        shader.setUniformVector2("windDirection", new Vector2(0.6, 0.8));
        shader.setUniformFloat("windPower", 0.8);
        shader.setUniformFloat("windSpeed", 12);
        shader.setUniformFloat("translucent", 0.35);
        shader.setUniformFloat("roughness", 0.35);
        shader.setUniformFloat("curvature", 0.4068);
        shader.setUniformFloat("grassHeight", 10);
        shader.setUniformFloat("soft", 5);
        shader.setUniformFloat("specular", 0.15);

        shadowShader.setUniformColor("baseColor", new Color(0.0, 1.0, 0.0, 1.0));
        shadowShader.setUniformColor("grassBottomColor", new Color(39 / 255, 87 / 255, 36 / 255));
        shadowShader.setUniformColor("grassTopColor", new Color(74 / 255, 163 / 255, 93 / 255, 1.0));
        shadowShader.setUniformColor("materialF0", new Color(0.04, 0.04, 0.04, 1.0 - 0.04));
        shadowShader.setUniformVector4("windBound", new Vector4(0, 0, 2000, 2000));
        shadowShader.setUniformVector2("windDirection", new Vector2(0.6, 0.8));
        shadowShader.setUniformFloat("windPower", 0.8);
        shadowShader.setUniformFloat("windSpeed", 10);
        shadowShader.setUniformFloat("translucent", 0.35);
        shadowShader.setUniformFloat("roughness", 0.35);
        shadowShader.setUniformFloat("curvature", 0.4068);
        shadowShader.setUniformFloat("grassHeight", 10);
        shadowShader.setUniformFloat("soft", 5);
        shadowShader.setUniformFloat("specular", 0.15);

        // default value
        // this.baseMap = Engine3D.res.whiteTexture;
        this.doubleSide = true;
        shadowPass.doubleSide = true;
    }

    public set baseMap(texture: Texture) {
        texture.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
        super.baseMap = texture;
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.baseMap = texture;
    }

    public get baseMap(): Texture {
        return super.baseMap;
    }

    public set windMap(texture: Texture) {
        texture.visibility = GPUShaderStage.VERTEX;
        texture.addressModeU = GPUAddressMode.repeat;
        texture.addressModeV = GPUAddressMode.repeat;
        this.renderShader.setTexture("windMap", texture);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setTexture("windMap", texture);
    }

    public set windBound(v: Vector4) {
        this.renderShader.setUniformVector4("windBound", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformVector4("windBound", v);
    }

    public get windBound(): Vector4 {
        return this.renderShader.uniforms["windBound"].vector4;
    }

    public set grassBaseColor(v: Color) {
        this.renderShader.setUniformColor("grassBottomColor", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformColor("grassBottomColor", v);
    }

    public get grassBaseColor(): Color {
        return this.renderShader.uniforms["grassBottomColor"].color;
    }

    public set grassTopColor(v: Color) {
        this.renderShader.setUniformColor("grassTopColor", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformColor("grassTopColor", v);
    }

    public get grassTopColor(): Color {
        return this.renderShader.uniforms["grassTopColor"].color;
    }

    public set windDirection(v: Vector2) {
        this.renderShader.setUniformVector2("windDirection", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformVector2("windDirection", v);
    }

    public get windDirection(): Vector2 {
        return this.renderShader.uniforms["windDirection"].vector2;
    }

    public set windPower(v: number) {
        this.renderShader.setUniformFloat("windPower", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("windPower", v);
    }

    public get windPower(): number {
        return this.renderShader.uniforms["windPower"].data;
    }

    public set windSpeed(v: number) {
        this.renderShader.setUniformFloat("windSpeed", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("windSpeed", v);
    }

    public get windSpeed(): number {
        return this.renderShader.uniforms["windSpeed"].data;
    }

    public set grassHeight(v: number) {
        this.renderShader.setUniformFloat("grassHeight", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("grassHeight", v);
    }

    public get grassHeight(): number {
        return this.renderShader.uniforms["grassHeight"].data;
    }

    public set curvature(v: number) {
        this.renderShader.setUniformFloat("curvature", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("curvature", v);
    }

    public get curvature(): number {
        return this.renderShader.uniforms["curvature"].data;
    }

    public set roughness(v: number) {
        this.renderShader.setUniformFloat("roughness", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("roughness", v);
    }

    public get roughness(): number {
        return this.renderShader.uniforms["roughness"].data;
    }

    public set translucent(v: number) {
        this.renderShader.setUniformFloat("translucent", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("translucent", v);
    }

    public get translucent(): number {
        return this.renderShader.uniforms["translucent"].data;
    }

    public set soft(v: number) {
        this.renderShader.setUniformFloat("soft", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("soft", v);
    }

    public get soft(): number {
        return this.renderShader.uniforms["soft"].data;
    }

    public set specular(v: number) {
        this.renderShader.setUniformFloat("specular", v);
        let shadowShader = this.renderShader.getPassShader(RendererType.SHADOW);
        shadowShader.renderShader.setUniformFloat("specular", v);
    }

    public get specular(): number {
        return this.renderShader.uniforms["specular"].data;
    }
}
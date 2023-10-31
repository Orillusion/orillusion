import { Engine3D, ShaderLib, Vector4, Color, Texture, Material, RenderShaderPass } from "@orillusion/core";
import ImageMaterialShader from "./ImageMaterialShader.wgsl?raw";


/**
 * ImageMaterial
 * Do not compute light, only read pixel color from a Image source
 * @group Material
 */
export class ImageMaterial extends Material {

    /**
     * Create a new ImageMaterial
     */
    constructor() {
        super();
        ShaderLib.register("ImageMaterialShader", ImageMaterialShader);
        this.defaultPass = new RenderShaderPass(`ImageMaterialShader`, `ImageMaterialShader`);
        this.defaultPass.setShaderEntry(`VertMain`, `FragMain`)
        this.defaultPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.defaultPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.defaultPass.setUniformColor(`baseColor`, new Color());
        this.defaultPass.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
        this.defaultPass.setUniformFloat(`alphaCutoff`, 0.5);

        let shaderState = this.defaultPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;
        shaderState.useZ = false;

        // default value
        this.defaultPass.setTexture(`baseMap`, Engine3D.res.whiteTexture);
    }

    public set baseMap(value: Texture) {
        this.defaultPass.setTexture(`baseMap`, value);
    }

    public get baseMap() {
        return this.defaultPass.getTexture(`baseMap`);
    }

    /**
     * set base color (tint color)
     */
    public set baseColor(color: Color) {
        this.defaultPass.setUniformColor(`baseColor`, color);
    }

    /**
     * get base color (tint color)
     */
    public get baseColor() {
        return this.defaultPass.uniforms[`baseColor`].color;
    }

    /**
     * Set the clip rect area
     */
    public set rectClip(value: Vector4) {
        this.defaultPass.uniforms[`rectClip`].vector4 = value;
    }

    /**
     * Get the clip rect area
     */
    public get rectClip(): Vector4 {
        return this.defaultPass.uniforms[`rectClip`].vector4;
    }

    /**
     * Start debug GUI
     */
    debug() {
    }
}
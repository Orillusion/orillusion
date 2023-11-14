import { Engine3D, ShaderLib, Vector4, Color, Texture, Material, RenderShaderPass, Shader, PassType } from "@orillusion/core";
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
        let newShader = new Shader();

        let defaultPass = new RenderShaderPass(`ImageMaterialShader`, `ImageMaterialShader`);
        defaultPass.passType = PassType.COLOR;
        defaultPass.setShaderEntry(`VertMain`, `FragMain`)
        defaultPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        defaultPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        defaultPass.setUniformColor(`baseColor`, new Color());
        defaultPass.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
        defaultPass.setUniformFloat(`alphaCutoff`, 0.5);
        newShader.addRenderPass(defaultPass);

        let shaderState = defaultPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;
        shaderState.useZ = false;
        this.shader = newShader;

        // default value
        this.shader.setTexture(`baseMap`, Engine3D.res.whiteTexture);
    }

    public set baseMap(value: Texture) {
        this.shader.setTexture(`baseMap`, value);
    }

    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
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
        return this.shader.getUniformColor(`baseColor`);
    }

    /**
     * Set the clip rect area
     */
    public set rectClip(value: Vector4) {
        this.shader.setUniformVector4(`rectClip`, value);
    }

    /**
     * Get the clip rect area
     */
    public get rectClip(): Vector4 {
        return this.shader.getUniformVector4(`rectClip`);
    }

    /**
     * Start debug GUI
     */
    debug() {
    }
}
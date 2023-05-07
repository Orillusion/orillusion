import { Engine3D, MaterialBase, ShaderLib, Vector4, Color, Texture } from "@orillusion/core";
import ImageMaterialShader from "./ImageMaterialShader.wgsl?raw";


/**
 * ImageMaterial
 * Do not compute light, only read pixel color from a Image source
 * @group Material
 */
export class ImageMaterial extends MaterialBase {

    /**
     * Create a new ImageMaterial
     */
    constructor() {
        super();
        ShaderLib.register("ImageMaterialShader", ImageMaterialShader);
        let shader = this.setShader(`ImageMaterialShader`, `ImageMaterialShader`);
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
        shader.setUniformFloat(`alphaCutoff`, 0.5);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;
        shaderState.useZ = false;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
    }

    /**
     * Set the clip rect area
     */
    public set rectClip(value: Vector4) {
        this.renderShader.uniforms[`rectClip`].vector4 = value;
    }

    /**
     * Get the clip rect area
     */
    public get rectClip(): Vector4 {
        return this.renderShader.uniforms[`rectClip`].vector4;
    }

    /**
     * Set no env Map
     */
    public set envMap(texture: Texture) {
        //no need env texture
    }

    /**
     * Set no shadow Map
     */
    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

    /**
     * Start debug GUI
     */
    debug() {
    }
}
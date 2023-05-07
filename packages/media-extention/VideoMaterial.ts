
import { Color, Engine3D, MaterialBase, ShaderLib, Texture, Vector4, registerMaterial } from '@orillusion/core';
import VideoShader from "./VideoShader.wgsl?raw";

/**
 * Video Material
 * Do not compute light, only read pixel color from a Video source
 * @group Material
 */
export class VideoMaterial extends MaterialBase {

    /**
     * Create new VideoMaterial
     */
    constructor() {
        super();
        ShaderLib.register('VideoShader', VideoShader);
        let shader = this.setShader(`VideoShader`, `VideoShader`);
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
     * Set no envMap
     */
    public set envMap(texture: Texture) {
        //not need env texture
    }

    /**
     * Set no shadowMap
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
registerMaterial('VideoMaterial', VideoMaterial);
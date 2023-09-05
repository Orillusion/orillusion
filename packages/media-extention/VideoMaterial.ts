
import { Color, Engine3D, Material, RenderShader, ShaderLib, Texture, Vector4, registerMaterial } from '@orillusion/core';
import { VideoShader } from './VideoShader';

/**
 * Video Material
 * Do not compute light, only read pixel color from a Video source
 * @group Material
 */
export class VideoMaterial extends Material {

    /**
     * Create new VideoMaterial
     */
    constructor() {
        super();
        ShaderLib.register('VideoShader', VideoShader);

        ShaderLib.register("VideoShader", VideoShader);

        this.defaultPass = new RenderShader(`VideoShader`, `VideoShader`);
        this.defaultPass.setShaderEntry(`VertMain`, `FragMain`)

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

    public get baseMap(): Texture {
        return this.defaultPass.getTexture(`baseMap`);
    }

    public set baseMap(value: Texture) {
        this.defaultPass.setTexture(`baseMap`, value);
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
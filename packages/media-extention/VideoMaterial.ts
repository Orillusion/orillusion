
import { Color, Engine3D, MaterialBase, ShaderLib, Texture, Vector4, registerMaterial } from '@orillusion/core';
import VideoShader from './VideoShader.wgsl?raw'

/**
 * Video 材质
 * 不计算光照，仅通过Video像素颜色渲染的基础材质
 * @group Material
 */
export class VideoMaterial extends MaterialBase {

    /**
     * 创建新的Video材质对象
     */
    constructor() {
        super();
        ShaderLib['VideoShader'] = VideoShader;
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

    public set rectClip(value: Vector4) {
        this.renderShader.uniforms[`rectClip`].vector4 = value;
    }

    public get rectClip(): Vector4 {
        return this.renderShader.uniforms[`rectClip`].vector4;
    }

    /**
     * 设置材质环境贴图
     */
    public set envMap(texture: Texture) {
        //not need env texture
    }

    /**
     * 设置材质阴影贴图
     */
    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

    /**
     * 启用GUI调试
     */
    debug() {

    }
}
registerMaterial('VideoMaterial', VideoMaterial);
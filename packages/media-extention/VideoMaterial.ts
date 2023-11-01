
import { Color, Engine3D, Material, PassType, RenderShaderPass, Shader, ShaderLib, Texture, Vector4 } from '@orillusion/core';
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

        let newShader = new Shader();

        let colorPass = new RenderShaderPass(`VideoShader`, `VideoShader`);
        colorPass.passType = PassType.COLOR;
        colorPass.setShaderEntry(`VertMain`, `FragMain`)

        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
        colorPass.setUniformFloat(`alphaCutoff`, 0.5);
        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;
        shaderState.useZ = false;

        newShader.addRenderPass(colorPass);
        this.shader = newShader;
        // default value
        colorPass.setTexture(`baseMap`, Engine3D.res.whiteTexture);
    }

    /**
     * Set the clip rect area
     */
    public set rectClip(value: Vector4) {
        this.shader.setUniformVector4("rectClip", value);
    }

    /**
     * Get the clip rect area
     */
    public get rectClip(): Vector4 {
        return this.shader.getUniform("rectClip").data;
    }

    public get baseMap(): Texture {
        return this.shader.getTexture(`baseMap`);
    }

    public set baseMap(value: Texture) {
        this.shader.setTexture(`baseMap`, value);
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
}
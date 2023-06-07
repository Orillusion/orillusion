import { Engine3D, ShaderLib, Texture, GPUCompareFunction, BlendMode, MaterialBase, Color, Vector4 } from "@orillusion/core";
import { ParticleRenderShader } from "../shader/ParticleRenderShader";

/**
 * material of particle renderer
 * @group Particle 
 */
export class ParticleMaterial extends MaterialBase {
    constructor() {
        super();
        ShaderLib.register("ParticleRenderShader", ParticleRenderShader);

        let shader = this.setShader(`ParticleRenderShader`, `ParticleRenderShader`);
        shader.setShaderEntry(`VertMain`, `FragMain`)

        shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformFloat(`alphaCutoff`, 0.5);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
        this.blendMode = BlendMode.ADD;
        this.transparent = true;
        this.shaderState.depthWriteEnabled = false;
        this.depthCompare = GPUCompareFunction.less;
    }

    public set envMap(texture: Texture) {
        //not need env texture
    }

    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }
}

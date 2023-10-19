import { Engine3D, ShaderLib, Texture, GPUCompareFunction, BlendMode, Color, Vector4, RenderShaderPass, Material, PassType } from "@orillusion/core";
import { ParticleRenderShader } from "../shader/ParticleRenderShader";

/**
 * material of particle renderer
 * @group Particle 
 */
export class ParticleMaterial extends Material {
    constructor() {
        super();
        ShaderLib.register("ParticleRenderShader", ParticleRenderShader);

        let colorPass = new RenderShaderPass(`ParticleRenderShader`, `ParticleRenderShader`);
        this.defaultPass = colorPass;
        colorPass.setShaderEntry(`VertMain`, `FragMain`)

        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformFloat(`alphaCutoff`, 0.5);

        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;
        shaderState.depthWriteEnabled = true;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
        this.blendMode = BlendMode.ADD;
        this.defaultPass.renderOrder = 3001;
        this.defaultPass.shaderState.transparent = true;
        this.defaultPass.shaderState.depthWriteEnabled = false;
        this.defaultPass.shaderState.depthCompare = GPUCompareFunction.less;

    }

    public set baseMap(texture: Texture) {
        //not need env texture
        this.defaultPass.setTexture(`baseMap`, texture);
    }

    public get baseMap() {
        return this.defaultPass.getTexture(`baseMap`);
    }

    public set envMap(texture: Texture) {
        //not need env texture
    }

    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }
}

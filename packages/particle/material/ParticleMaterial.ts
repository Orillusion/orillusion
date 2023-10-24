import { Engine3D, ShaderLib, Texture, GPUCompareFunction, BlendMode, Color, Vector4, RenderShaderPass, Material, PassType, Shader } from "@orillusion/core";
import { ParticleRenderShader } from "../shader/ParticleRenderShader";

/**
 * material of particle renderer
 * @group Particle 
 */
export class ParticleMaterial extends Material {
    constructor() {
        super();
        ShaderLib.register("ParticleRenderShader", ParticleRenderShader);

        let newShader = new Shader();

        let colorPass = new RenderShaderPass(`ParticleRenderShader`, `ParticleRenderShader`);
        colorPass.passType = PassType.COLOR;
        colorPass.setShaderEntry(`VertMain`, `FragMain`)
        newShader.addRenderPass(colorPass);

        colorPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformFloat(`alphaCutoff`, 0.5);
        colorPass.renderOrder = 3001;
        colorPass.shaderState.transparent = true;
        colorPass.shaderState.depthWriteEnabled = false;
        colorPass.shaderState.depthCompare = GPUCompareFunction.less;
        colorPass.shaderState.acceptShadow = false;
        colorPass.shaderState.receiveEnv = false;
        colorPass.shaderState.acceptGI = false;
        colorPass.shaderState.useLight = false;
        colorPass.shaderState.castShadow = false;

        this.shader = newShader;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
        this.blendMode = BlendMode.ADD;
    }

    public set baseMap(texture: Texture) {
        //not need env texture
        this.shader.setTexture(`baseMap`, texture);
    }

    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    public set envMap(texture: Texture) {
        //not need env texture
    }

    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }
}

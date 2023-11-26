import { Color, Engine3D, Material, RenderShaderPass, Shader, ShaderLib, Texture, Vector4 } from '@orillusion/core';
import { FluidRenderShaderOpt } from './FluidRenderShaderOpt';

export class FluidSimulatorMaterial2 extends Material {
    doubleSided: any;
    constructor() {
        super();

        ShaderLib.register("FluidRenderShaderOpt", FluidRenderShaderOpt);
        let shader = new Shader();
        let pass = new RenderShaderPass('FluidRenderShaderOpt', 'FluidRenderShaderOpt');
        pass.setShaderEntry(`VertMain`, `FragMain`)

        shader.addRenderPass(pass);
        shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformFloat(`alphaCutoff`, 0.5);
        shader.setUniformFloat(`shadowBias`, 0.00035);

        let shaderState = pass.shaderState ;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
        this.shader = shader;
        
        // this.transparent = true ;
    }

    public set baseMap(value: Texture) {
        // this.onChange = true;
    }

    public set envMap(texture: Texture) {
        //not need env texture
    }

    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }

    debug() {}

}

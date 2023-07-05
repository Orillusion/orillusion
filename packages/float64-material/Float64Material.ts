import { Color, Engine3D, MaterialBase, ShaderLib, Texture, UniformGPUBuffer, Vector4 } from "@orillusion/core";
import Float64Shader from "./Float64Shader.wgsl?raw";

export class Float64Material extends MaterialBase {
    constructor() {
        super();

        ShaderLib.register("Float64Shader", Float64Shader);

        let shader = this.setShader(`Float64Shader`, `Float64Shader`);
        shader.setShaderEntry(`VertMain`, `FragMain`);

        shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        shader.setUniformColor(`baseColor`, new Color());
        shader.setUniformFloat(`alphaCutoff`, 0.5);
        shader.setUniformBuffer(`args`, new UniformGPUBuffer(96));
        let shaderState = shader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.useZ = false;

        shader.setUniformColor("ccc", new Color(1.0, 0.0, 0.0, 1.0));

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
    }

    public set envMap(texture: Texture) {
    }

    public set shadowMap(texture: Texture) {
    }

}


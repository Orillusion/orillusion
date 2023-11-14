import { Engine3D } from "../../../../../Engine3D";
import { GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { BlendMode } from "../../../../../materials/BlendMode";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";
import { UnLitTextureArray } from "../../../../../assets/shader/materials/UnLitTextureArray";
import { ShaderLib } from "../../../../../assets/shader/ShaderLib";
import { VertexAttributeIndexShader } from "../../../../../assets/shader/core/struct/VertexAttributeIndexShader";


@RegisterShader
export class UnLitTexArrayShader extends Shader {

    constructor() {
        super();

        ShaderLib.register("VertexAttributeIndexShader", VertexAttributeIndexShader);
        ShaderLib.register("UnLitTextureArray", UnLitTextureArray);
        let colorShader = new RenderShaderPass('UnLitTextureArray', 'UnLitTextureArray');
        colorShader.setShaderEntry(`VertMain`, `FragMain`)
        this.addRenderPass(colorShader);

        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.castShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        this.setDefine('USE_BRDF', true);
        this.setDefine('USE_AO_R', true);
        this.setDefine('USE_ROUGHNESS_G', true);
        this.setDefine('USE_METALLIC_B', true);
        this.setDefine('USE_ALPHA_A', true);
        this.setDefault();
    }

    public setDefault() {
        this.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.setUniformColor(`baseColor`, new Color());
        this.setUniformFloat(`alphaCutoff`, 0.0);
    }

    public set _MainTex(value: Texture) {
        this.setTexture("baseMap", value);
    }

    public set _BumpMap(value: Texture) {
        this.setTexture("normalMap", value);
    }

    public set _MaskTex(value: Texture) {
        this.setTexture("maskMap", value);
    }

    public set _UVTransform(value: Vector4) {
        this.setUniformVector4("transformUV1", value);
    }

    public set _Metallic(value: number) {
        this.setUniformFloat("metallic", value);
    }

    public set _Roughness(value: number) {
        this.setUniformFloat("roughness", value);
    }


    public set _MainColor(value: Color) {
        this.setUniformColor("baseColor", value);
    }

    public set _AlphaCutoff(value: number) {
        this.setUniformFloat("alphaCutoff", value);
    }

    public set _DoubleSidedEnable(value: number) {
        let defaultShader = this.getDefaultColorShader();
        defaultShader.shaderState.cullMode = value ? GPUCullMode.none : defaultShader.shaderState.cullMode;
    }

    public set _SurfaceType(value: number) {
        let defaultShader = this.getDefaultColorShader();
        if (value == 0) {
            defaultShader.blendMode = BlendMode.NONE;
        } else {
            defaultShader.blendMode = BlendMode.ALPHA;
        }
    }

    public set _AlphaCutoffEnable(value: number) {
        if (value == 0) {
            this.setDefine('USE_ALPHACUT', false);
        } else {
            this.setDefine('USE_ALPHACUT', true);
        }
    }

}
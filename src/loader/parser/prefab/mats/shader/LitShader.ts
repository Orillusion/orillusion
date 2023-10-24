import { Engine3D } from "../../../../..";
import { GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { BlendMode } from "../../../../../materials/BlendMode";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";


@RegisterShader
export class LitShader extends Shader {

    constructor() {
        super();

        let colorShader = new RenderShaderPass('PBRLItShader', 'PBRLItShader');
        colorShader.setShaderEntry(`VertMain`, `FragMain`)
        this.addRenderPass(colorShader);

        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;
        this.setDefine('USE_BRDF', true);
        this.setDefine('USE_AO_R', true);
        this.setDefine('USE_ROUGHNESS_G', true);
        this.setDefine('USE_METALLIC_B', true);
        this.setDefine('USE_ALPHA_A', true);

        this.setDefault();
    }

    public setDefault() {
        this.setUniformFloat(`shadowBias`, 0.00035);
        this.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.setUniformColor(`baseColor`, new Color());
        this.setUniformColor(`emissiveColor`, new Color(0, 0, 0));
        this.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        this.setUniformColor(`specularColor`, new Color(0.04, 0.04, 0.04));
        this.setUniformFloat(`envIntensity`, 1);
        this.setUniformFloat(`normalScale`, 1);
        this.setUniformFloat(`roughness`, 1.0);
        this.setUniformFloat(`metallic`, 0.0);
        this.setUniformFloat(`ao`, 1.0);
        this.setUniformFloat(`roughness_min`, 0.0);
        this.setUniformFloat(`roughness_max`, 1.0);
        this.setUniformFloat(`metallic_min`, 0.0);
        this.setUniformFloat(`metallic_max`, 1.0);
        this.setUniformFloat(`emissiveIntensity`, 0.0);
        this.setUniformFloat(`alphaCutoff`, 0.0);
        this.setUniformFloat(`ior`, 1.5);
        this.setUniformFloat(`clearcoatFactor`, 0.0);
        this.setUniformFloat(`clearcoatRoughnessFactor`, 0.0);
        this.setUniformColor(`clearcoatColor`, new Color(1, 1, 1));
        this.setUniformFloat(`clearcoatWeight`, 0.0);

        this._MainTex = Engine3D.res.grayTexture;
        this._BumpMap = Engine3D.res.normalTexture;
        this._MaskTex = Engine3D.res.maskTexture;
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
        let subShader = this.getDefaultColorShader();
        subShader.shaderState.cullMode = value ? GPUCullMode.none : subShader.shaderState.cullMode;
    }

    public set _SurfaceType(value: number) {
        let subShader = this.getDefaultColorShader();
        if (value == 0) {
            subShader.blendMode = BlendMode.NONE;
        } else {
            subShader.blendMode = BlendMode.ALPHA;
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
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";
import { PBRLitSSSShader } from "../../../../../assets/shader/materials/PBRLitSSSShader";
import { ShaderLib } from "../../../../../assets/shader/ShaderLib";
import { PreIntegratedLutCompute } from "../../../../../gfx/graphics/webGpu/compute/PreIntegratedLutCompute";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { BlendMode } from "../../../../../materials/BlendMode";
import { RenderShaderPass } from "../../../../../gfx/graphics/webGpu/shader/RenderShaderPass";


@RegisterShader
export class LitSSSShader extends Shader {

    constructor() {
        super();

        ShaderLib.register("PBRLitSSSShader", PBRLitSSSShader);
        let colorShader = new RenderShaderPass('PBRLitSSSShader', 'PBRLitSSSShader');
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
        this.setDefine('USE_CUSTOMUNIFORM', true);
        this.setDefault();
        this.debug();

        this.computes = [
            new PreIntegratedLutCompute(this)
        ]
    }

    public debug() {
        GUIHelp.addFolder("face");
        GUIHelp.addColor({ SkinColor: new Color() }, "SkinColor").onChange((v) => {
            let newColor = new Color();
            newColor.copyFromArray(v);
            this._SkinColor = newColor;
        });
        GUIHelp.add({ skinPower: 1 }, "skinPower", 0.0, 10.0).onChange((v) => {
            this._SkinPower = v;
        });
        GUIHelp.add({ skinColorIns: 1 }, "skinColorIns", 0.0, 10.0).onChange((v) => {
            this._SkinColorIns = v;
        });
        GUIHelp.add({ roughness: 1 }, "roughness", 0.0, 1.0).onChange((v) => {
            this._Roughness = v;
        });
        GUIHelp.add({ metallic: 1 }, "metallic", 0.0, 1.0).onChange((v) => {
            this._Metallic = v;
        });
        GUIHelp.add({ curveFactor: 1 }, "curveFactor", 0.0, 10.0).onChange((v) => {
            this.curveFactor = v;
        });

        GUIHelp.endFolder();
    }

    public setDefault() {
        this.setUniformFloat(`shadowBias`, 0.00035);
        this.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.setUniformColor(`baseColor`, new Color());
        this.setUniformColor(`emissiveColor`, new Color(1, 1, 1));
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

        this.setUniformColor(`skinColor`, new Color(1, 0, 0));
        this.setUniformFloat(`skinPower`, 3.4);
        this.setUniformFloat(`skinColorIns`, 0.5);
        this.setUniformFloat(`curveFactor`, 1.0);
    }

    public set _MainTex(value: Texture) {
        this.setTexture("baseMap", value);
    }

    public set _BumpMap(value: Texture) {
        this.setTexture("normalMap", value);
    }

    public set _SSSMap(value: Texture) {
        this.setTexture("sssMap", value);
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
        let shader = this.getDefaultColorShader();
        shader.shaderState.cullMode = value ? GPUCullMode.none : shader.shaderState.cullMode;
    }

    public set _SkinColor(value: Color) {
        this.setUniformColor("skinColor", value);
    }

    public set _SkinPower(value: number) {
        this.setUniformFloat("skinPower", value);
    }

    public set _SkinColorIns(value: number) {
        this.setUniformFloat("skinColorIns", value);
    }

    public set curveFactor(value: number) {
        this.setUniformFloat("curveFactor", value);
    }

    public set _SurfaceType(value: number) {
        let shader = this.getDefaultColorShader();
        if (value == 0) {
            shader.blendMode = BlendMode.NONE;
        } else {
            shader.blendMode = BlendMode.ALPHA;
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
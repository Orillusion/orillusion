import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { ShaderLib } from "../../../../../assets/shader/ShaderLib";
import { GPUCullMode } from "../../../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../../../gfx/graphics/webGpu/core/texture/Texture";
import { BlendMode } from "../../../../../materials/BlendMode";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";
import { RegisterShader } from "../../../../../util/SerializeDecoration";
import { Shader } from "../../../../../gfx/graphics/webGpu/shader/Shader";
import { Hair_shader_op, Hair_shader_tr, RenderShaderPass, PassType } from "../../../../..";


@RegisterShader
export class LitHairShader extends Shader {

    constructor() {
        super();

        this.create_opPass();
        // this.create_trPass();

        this.setDefine('USEC', true);
        this.setDefine('USE_BRDF', true);
        this.setDefine('USE_AO_R', true);
        this.setDefine('USE_ROUGHNESS_G', true);
        this.setDefine('USE_METALLIC_B', true);
        this.setDefine('USE_ALPHA_A', true);
        this.setDefine('USE_HAIR', true);
        this.setDefine('USE_CUSTOMUNIFORM', true);
        this.setDefine('USE_HAIRCOLOR', true);

        this.setDefault();
        this.debug();
    }

    private create_opPass() {
        ShaderLib.register("HairShader_op", Hair_shader_op);
        let colorShader = new RenderShaderPass('HairShader_op', 'HairShader_op');
        this.addRenderPass(colorShader);

        colorShader.setShaderEntry(`VertMain`, `FragMain`)
        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;
        shaderState.blendMode = BlendMode.NONE;
        shaderState.cullMode = GPUCullMode.none;
        shaderState.writeMasks[0] = GPUColorWrite.ALL;
    }

    private create_trPass() {
        ShaderLib.register("HairShader_tr", Hair_shader_tr);
        let colorShader = new RenderShaderPass('HairShader_tr', 'HairShader_tr');
        this.addRenderPass(colorShader);

        colorShader.setShaderEntry(`VertMain`, `FragMain`)
        let shaderState = colorShader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;
        shaderState.depthWriteEnabled = false;
        shaderState.blendMode = BlendMode.NORMAL;
        shaderState.cullMode = GPUCullMode.none;

        shaderState.writeMasks[0] = GPUColorWrite.ALL;
        shaderState.writeMasks[1] = 0;
        shaderState.writeMasks[2] = 0;
        shaderState.writeMasks[3] = 0;
    }

    public debug() {
        GUIHelp.addFolder("Hair");
        GUIHelp.addColor({ HairColorStart: new Color() }, "HairColorStart").onChange((v) => {
            let c = new Color();
            c.copyFromArray(v);
            this._HairColor0 = c;
        });

        GUIHelp.addColor({ HairColorEnd: new Color() }, "HairColorEnd").onChange((v) => {
            let c = new Color();
            c.copyFromArray(v);
            this._HairColor1 = c;
        });

        GUIHelp.addColor({ specularColor: new Color() }, "specularColor").onChange((v) => {
            let c = new Color();
            c.copyFromArray(v);
            this._SpecularColor = c;
        });

        GUIHelp.add({ roughness: 1 }, "roughness", 0.0, 1.0).onChange((v) => {
            this._Roughness = v;
        });
        GUIHelp.add({ metallic: 1 }, "metallic", 0.0, 1.0).onChange((v) => {
            this._Metallic = v;
        });

        GUIHelp.add({ alphaCutoff: 1 }, "alphaCutoff", 0.0, 1.0).onChange((v) => {
            this._AlphaCutoff = v;
        });

        GUIHelp.add({ backlit: 1 }, "backlit", 0.0, 1.0, 0.0001).onChange((v) => {
            this._BackLit = v;
        });

        GUIHelp.add({ area: 0.1 }, "area", 0.0, 1.0, 0.0001).onChange((v) => {
            this._Area = v;
        });
        GUIHelp.endFolder();
    }

    public setDefault() {
        this.setUniformFloat(`shadowBias`, 0.00035);
        this.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.setUniformColor(`baseColor0`, new Color(3 / 255, 2 / 255, 2 / 255));
        this.setUniformColor(`baseColor1`, new Color(2 / 255, 2 / 255, 2 / 255));
        this.setUniformColor(`emissiveColor`, new Color(1, 1, 1));
        this.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        this.setUniformColor(`specularColor`, new Color(36 / 255, 36 / 255, 36 / 255));
        this.setUniformFloat(`envIntensity`, 1);
        this.setUniformFloat(`normalScale`, 1);
        this.setUniformFloat(`roughness`, 0.1);
        this.setUniformFloat(`metallic`, 0.3);
        this.setUniformFloat(`ao`, 1.0);
        this.setUniformFloat(`roughness_min`, 0.0);
        this.setUniformFloat(`roughness_max`, 1.0);
        this.setUniformFloat(`metallic_min`, 0.0);
        this.setUniformFloat(`metallic_max`, 1.0);
        this.setUniformFloat(`emissiveIntensity`, 0.0);
        this.setUniformFloat(`alphaCutoff`, 0.1);
        this.setUniformFloat(`ior`, 1.5);
        this.setUniformFloat(`backlit`, 0.3987);
        this.setUniformFloat(`area`, 0.0615);
    }


    public set _MainTex(value: Texture) {
        this.setTexture("baseMap", value);
    }

    public set _IDMap(value: Texture) {
        this.setTexture("idMap", value);
    }

    public set _DepthMap(value: Texture) {
        this.setTexture("depthMap", value);
    }

    public set _RootMap(value: Texture) {
        this.setTexture("rootMap", value);
    }

    public set _AlphaMap(value: Texture) {
        this.setTexture("alphaMap", value);
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

    public set _HairColor0(value: Color) {
        this.setUniformColor("baseColor0", value);
    }

    public set _HairColor1(value: Color) {
        this.setUniformColor("baseColor1", value);
    }

    public set _SpecularColor(value: Color) {
        this.setUniformColor("specularColor", value);
    }

    public set _AlphaCutoff(value: number) {
        this.setUniformFloat("alphaCutoff", value);
    }

    public set _BackLit(value: number) {
        this.setUniformFloat("backlit", value);
    }

    public set _Area(value: number) {
        this.setUniformFloat("area", value);
    }


    public set _DoubleSidedEnable(value: number) {
        let subShader = this.getSubShaders(PassType.COLOR)[0];
        subShader.shaderState.cullMode = value ? GPUCullMode.none : subShader.shaderState.cullMode;
    }

    public set _SurfaceType(value: number) {
        if (value == 0) {
            // this.blendMode = BlendMode.NONE;
        } else {
            // this.blendMode = BlendMode.ALPHA;
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
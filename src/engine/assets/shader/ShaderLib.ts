import { VertexAttributes } from "./core/struct/VertexAttributes"
import ColorPassFragmentOutput from "./core/struct/ColorPassFragmentOutput.wgsl?raw";
import Common_frag from "./core/base/Common_frag.wgsl?raw";
import Common_vert from "./core/base/Common_vert.wgsl?raw";
import FragmentVarying from "./core/struct/FragmentVarying.wgsl?raw";
import BxdfDebug_frag from "./materials/program/BxdfDebug_frag.wgsl?raw";
import Clearcoat_frag from "./materials/program/Clearcoat_frag.wgsl?raw";
import NormalMap_frag from "./materials/program/NormalMap_frag.wgsl?raw";
import ShadowMapping_frag from "./materials/program/ShadowMapping_frag.wgsl?raw";
import BrdfLut_frag from "./core/common/BrdfLut_frag.wgsl?raw";
import EnvMap_frag from "./core/common/EnvMap_frag.wgsl?raw";
import GlobalUniform from "./core/common/GlobalUniform.wgsl?raw";
import Inline_vert from "./core/inline/Inline_vert.wgsl?raw";
import WorldMatrixUniform from "./core/common/WorldMatrixUniform.wgsl?raw";
import InstanceUniform from "./core/common/InstanceUniform.wgsl?raw";
import { LightStructFrag } from "./core/struct/LightStructFrag";
import { LightingFunction_frag } from "./lighting/LightingFunction_frag";
import { PhysicMaterialUniform_frag } from "./materials/uniforms/PhysicMaterialUniform_frag";
import { MathShader } from "./math/MathShader";
import ShadingInput from "./core/struct/ShadingInput.wgsl?raw";
import { ClusterDebug_frag } from "./materials/program/ClusterDebug_frag";

import FastMathShader from "./math/FastMathShader.wgsl?raw";
import BRDF_frag from "./lighting/BRDF_frag.wgsl?raw";
import BxDF_frag from "./lighting/BxDF_frag.wgsl?raw";
import Irradiance_frag from "./lighting/Irradiance_frag.wgsl?raw";
import LitShader from '../shader/materials/LitShader.wgsl?raw'
import PBRLItShader from '../shader/materials/PBRLItShader.wgsl?raw'

import ColorUtil from './utils/ColorUtil.wgsl?raw'
import GenerayRandomDir from './utils/GenerayRandomDir.wgsl?raw'
import IESProfiles_frag from './lighting/IESProfiles_frag.wgsl?raw'
import { UnLit_frag } from "./lighting/UnLit_frag";
import { UnLitMaterialUniform_frag } from "./materials/uniforms/UnLitMaterialUniform_frag";
import { VideoUniform_frag } from "./materials/uniforms/VideoUniform_frag";
import { Bloom_shader } from "./post/Bloom_shader";
import { Quad_shader } from "./quad/Quad_shader";
import { CubeSky_Shader } from "./materials/sky/CubeSky_Shader";

/**
 * @internal
 */
export class ShaderLib {

    public static init() {
        ShaderLib.register('MathShader', MathShader);
        ShaderLib.register('FastMathShader', FastMathShader);

        ShaderLib.register('GlobalUniform', GlobalUniform);
        ShaderLib.register('WorldMatrixUniform', WorldMatrixUniform);
        ShaderLib.register('NormalMap_frag', NormalMap_frag);
        ShaderLib.register('LightingFunction_frag', LightingFunction_frag);

        ShaderLib.register('PhysicMaterialUniform_frag', PhysicMaterialUniform_frag);
        ShaderLib.register('UnLitMaterialUniform_frag', UnLitMaterialUniform_frag);
        ShaderLib.register('VideoUniform_frag', VideoUniform_frag);

        ShaderLib.register('InstanceUniform', InstanceUniform);
        ShaderLib.register('Inline_vert', Inline_vert);
        ShaderLib.register('VertexAttributes_vert', VertexAttributes);
        ShaderLib.register('Common_vert', Common_vert);

        ShaderLib.register('Common_frag', Common_frag);
        ShaderLib.register('FragmentVarying', FragmentVarying);
        ShaderLib.register('ColorPassFragmentOutput', ColorPassFragmentOutput);

        ShaderLib.register('LightStruct', LightStructFrag);
        ShaderLib.register('ShadingInput', ShadingInput);
        ShaderLib.register('IESProfiles_frag', IESProfiles_frag);

        ShaderLib.register('ShadowMapping_frag', ShadowMapping_frag);

        ShaderLib.register('Irradiance_frag', Irradiance_frag);
        // ShaderLib.register('IrradianceVolumeData_frag', IrradianceVolumeData_frag);
        ShaderLib.register('BrdfLut_frag', BrdfLut_frag);
        ShaderLib.register('EnvMap_frag', EnvMap_frag);

        ShaderLib.register('ColorUtil_frag', ColorUtil);
        ShaderLib.register('ColorUtil', ColorUtil);
        ShaderLib.register('BRDF_frag', BRDF_frag);
        ShaderLib.register('BxDF_frag', BxDF_frag);
        ShaderLib.register('UnLit_frag', UnLit_frag);
        ShaderLib.register('Clearcoat_frag', Clearcoat_frag);
        ShaderLib.register('LitShader', LitShader);
        ShaderLib.register('PBRLItShader', PBRLItShader);



        // ShaderLib.register('Surface', Surface_Shader.Surface_Common);

        ShaderLib.register('ClusterDebug_frag', ClusterDebug_frag);
        ShaderLib.register('BxdfDebug_frag', BxdfDebug_frag);

        ShaderLib.register('GenerayRandomDir', GenerayRandomDir);

        ShaderLib.register('Quad_vert_wgsl', Quad_shader.Quad_vert_wgsl);
        ShaderLib.register('Quad_frag_wgsl', Quad_shader.Quad_frag_wgsl);
        ShaderLib.register('Quad_depth2d_frag_wgsl', Quad_shader.Quad_depth2d_frag_wgsl);
        ShaderLib.register('Quad_depthCube_frag_wgsl', Quad_shader.Quad_depthCube_frag_wgsl);
        ShaderLib.register('sky_vs_frag_wgsl', CubeSky_Shader.sky_vs_frag_wgsl);
        ShaderLib.register('sky_fs_frag_wgsl', CubeSky_Shader.sky_fs_frag_wgsl);
        ShaderLib.register('Bloom_Brightness_frag_wgsl', Bloom_shader.Bloom_Brightness_frag_wgsl);
        ShaderLib.register('Bloom_blur_frag_wgsl', Bloom_shader.Bloom_blur_frag_wgsl);
        ShaderLib.register('Bloom_composite_frag_wgsl', Bloom_shader.Bloom_composite_frag_wgsl);
    }

    public static register(keyName: string, code: string) {
        if (!ShaderLib[keyName.toLowerCase()]) {
            // console.warn(`The registered shader already exists: ${keyName}`);
            ShaderLib[keyName.toLowerCase()] = code;
        }
    }

    public static getShader(keyName: string): string {
        // let shaderName = keyName.toLowerCase() ;
        // let shaderSource = ""
        if (ShaderLib[keyName.toLowerCase()]) {
            return ShaderLib[keyName.toLowerCase()];
        }
        return ShaderLib[keyName.toLowerCase()];
    }



}

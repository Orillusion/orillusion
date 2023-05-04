import { Bloom_shader } from './post/Bloom_shader';
import { ClusterDebug_frag } from './materials/program/ClusterDebug_frag';
import { CubeSky_Shader } from './sky/CubeSky_Shader';
import { LightStructFrag } from './core/struct/LightStructFrag';
import { LightingFunction_frag } from './lighting/LightingFunction_frag';
import { MathShader } from './math/MathShader';
import { PhysicMaterialUniform_frag } from './materials/uniforms/PhysicMaterialUniform_frag';
import { UnLitMaterialUniform_frag } from './materials/uniforms/UnLitMaterialUniform_frag';
import { UnLit_frag } from './lighting/UnLit_frag';
import { VertexAttributes } from './core/struct/VertexAttributes';
import { VideoUniform_frag } from './materials/uniforms/VideoUniform_frag';
import { IrradianceVolumeData_frag } from "./lighting/IrradianceVolumeData_frag";
import { Inline_vert } from './core/inline/Inline_vert';
import { Common_frag } from './core/base/Common_frag';
import { Common_vert } from './core/base/Common_vert';
import { BrdfLut_frag } from './core/common/BrdfLut_frag';
import { EnvMap_frag } from './core/common/EnvMap_frag';
import { GlobalUniform } from './core/common/GlobalUniform';
import { InstanceUniform } from './core/common/InstanceUniform';
import { WorldMatrixUniform } from './core/common/WorldMatrixUniform';
import { FastMathShader } from './math/FastMathShader';
import { NormalMap_frag } from './materials/program/NormalMap_frag';
import { FragmentVarying } from './core/struct/FragmentVarying';
import { ColorPassFragmentOutput } from './core/struct/ColorPassFragmentOutput';
import { ShadingInput } from './core/struct/ShadingInput';
import { IESProfiles_frag } from './lighting/IESProfiles_frag';
import { ShadowMapping_frag } from './materials/program/ShadowMapping_frag';
import { Irradiance_frag } from './lighting/Irradiance_frag';
import { BRDF_frag } from './lighting/BRDF_frag';
import { BxDF_frag } from './lighting/BxDF_frag';
import { Clearcoat_frag } from './materials/program/Clearcoat_frag';
import { LitShader } from './materials/LitShader';
import { PBRLItShader } from './materials/PBRLItShader';
import { BxdfDebug_frag } from './materials/program/BxdfDebug_frag';
import { Quad_depth2d_frag_wgsl, Quad_depthCube_frag_wgsl, Quad_frag_wgsl, Quad_vert_wgsl } from './quad/Quad_shader';
import { ColorUtil } from './utils/ColorUtil';
import { GenerayRandomDir } from './utils/GenerayRandomDir';

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
        ShaderLib.register('IrradianceVolumeData_frag', IrradianceVolumeData_frag);
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


        ShaderLib.register('ClusterDebug_frag', ClusterDebug_frag);
        ShaderLib.register('BxdfDebug_frag', BxdfDebug_frag);
        ShaderLib.register('GenerayRandomDir', GenerayRandomDir);
        ShaderLib.register('Quad_vert_wgsl', Quad_vert_wgsl);
        ShaderLib.register('Quad_frag_wgsl', Quad_frag_wgsl);
        ShaderLib.register('Quad_depth2d_frag_wgsl', Quad_depth2d_frag_wgsl);
        ShaderLib.register('Quad_depthCube_frag_wgsl', Quad_depthCube_frag_wgsl);
        ShaderLib.register('sky_vs_frag_wgsl', CubeSky_Shader.sky_vs_frag_wgsl);
        ShaderLib.register('sky_fs_frag_wgsl', CubeSky_Shader.sky_fs_frag_wgsl);
        ShaderLib.register('Bloom_Brightness_frag_wgsl', Bloom_shader.Bloom_Brightness_frag_wgsl);
        ShaderLib.register('Bloom_blur_frag_wgsl', Bloom_shader.Bloom_blur_frag_wgsl);
        ShaderLib.register('Bloom_composite_frag_wgsl', Bloom_shader.Bloom_composite_frag_wgsl);
    }

    public static register(keyName: string, code: string) {
        if (!ShaderLib[keyName.toLowerCase()]) {
            ShaderLib[keyName.toLowerCase()] = code;
        }
    }

    public static getShader(keyName: string): string {
        if (ShaderLib[keyName.toLowerCase()]) {
            return ShaderLib[keyName.toLowerCase()];
        }
        return ShaderLib[keyName.toLowerCase()];
    }



}

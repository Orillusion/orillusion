import { ClusterDebug_frag } from './materials/program/ClusterDebug_frag';
import { CubeSky_Shader } from './sky/CubeSky_Shader';
import { LightingFunction_frag } from './lighting/LightingFunction_frag';
import { MathShader } from './math/MathShader';
import { PhysicMaterialUniform_frag } from './materials/uniforms/PhysicMaterialUniform_frag';
import { UnLitMaterialUniform_frag } from './materials/uniforms/UnLitMaterialUniform_frag';
import { UnLit_frag } from './lighting/UnLit_frag';
import { VertexAttributes, VertexAttributes_vert } from './core/struct/VertexAttributes';
import { VertexOutput } from './core/struct/VertexOutput';
import { VertexFunction_vert } from './core/base/VertexFunction_vert';
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
import { FragmentOutput } from './core/struct/FragmentOutput';
import { ShadingInput } from './core/struct/ShadingInput';
import { IESProfiles_frag } from './lighting/IESProfiles_frag';
import { ShadowMapping_frag } from './materials/program/ShadowMapping_frag';
import { ShadowCommon } from './shadow/ShadowCommon';
import { PCF_frag } from './shadow/PCF_frag';
import { CSM_frag } from './shadow/CSM_frag';
import { DirectShadow_frag } from './shadow/DirectShadow_frag';
import { PointShadow_frag } from './shadow/PointShadow_frag';
import { Irradiance_frag } from './lighting/Irradiance_frag';
import { BRDF_frag } from './lighting/BRDF_frag';
import { BxDF_frag } from './lighting/BxDF_frag';
import { Clearcoat_frag } from './materials/program/Clearcoat_frag';
import { Sheen_frag } from './materials/program/Sheen_frag';
import { Lit_shader } from './materials/Lit_shader';
import { PBRLItShader } from './materials/PBRLItShader';
import { BxdfDebug_frag } from './materials/program/BxdfDebug_frag';
import { Quad_depth2d_frag_wgsl, Quad_depthCube_frag_wgsl, Quad_frag_wgsl, Quad_opaque_frag_wgsl, Quad_premultiply_frag_wgsl, Quad_vert_wgsl } from './quad/Quad_shader';
import { ColorUtil } from './utils/ColorUtil';
import { GenerayRandomDir } from './utils/GenerayRandomDir';
import { MatrixShader } from './math/MatrixShader';
import { ClusterLight } from './core/struct/ClusterLight';
import { Hair_frag } from './lighting/Hair_frag';
import { BsDF_frag } from './lighting/BsDF_frag';
import { AlphaHash_frag } from './lighting/AlphaHash_frag';
import { UnLit } from './materials/UnLit';
import { Sprite_shader } from './materials/Sprite_shader';
import { Lambert_shader } from './materials/Lambert_shader';
import { QuadGlsl_fs, QuadGlsl_vs } from './glsl/Quad_glsl';
import { SkyGBuffer_pass } from './core/pass/SkyGBuffer_pass';
import { GBuffer_pass } from './core/pass/GBuffer_pass';
import { castPointShadowMap_vert, directionShadowCastMap_frag, shadowCastMap_frag, shadowCastMap_vert } from './core/pass/CastShadow_pass';
import { ZPassShader_vs } from './core/pass/ZPassShader_vs';
import { BitUtil } from './utils/BitUtil';
import { GBufferStand } from './core/common/GBufferStand';
import { ReflectionShader_shader } from './materials/ReflectionShader_shader';
import { ReflectionCG } from './env/ReflectionCG';
import { SHCommon_frag } from './core/common/SHCommon_frag';
import { EngineSetting } from '../../setting/EngineSetting';
import { getLightData } from './core/struct/LightData';
import { EarthSky_Shader } from './sky/EarthSky_Shader';
import { EarthAtm_Shader } from './sky/EarthAtm_Shader';

/**
 * @internal
 */
export class ShaderLib {

    public static init(seedSetting: EngineSetting) {
        ShaderLib.register('MathShader', MathShader);
        ShaderLib.register('FastMathShader', FastMathShader);
        ShaderLib.register("BitUtil", BitUtil);
        ShaderLib.register("GBufferStand", GBufferStand);
        ShaderLib.register("SHCommon_frag", SHCommon_frag);

        ShaderLib.register('MatrixShader', MatrixShader);

        ShaderLib.register('GlobalUniform', GlobalUniform(seedSetting.shadow.maxShadowMapNum));
        ShaderLib.register('WorldMatrixUniform', WorldMatrixUniform);
        ShaderLib.register('NormalMap_frag', NormalMap_frag);
        ShaderLib.register('LightingFunction_frag', LightingFunction_frag);

        ShaderLib.register('PhysicMaterialUniform_frag', PhysicMaterialUniform_frag);
        ShaderLib.register('UnLitMaterialUniform_frag', UnLitMaterialUniform_frag);
        ShaderLib.register('VideoUniform_frag', VideoUniform_frag);

        ShaderLib.register('InstanceUniform', InstanceUniform);
        ShaderLib.register('Inline_vert', Inline_vert);
        ShaderLib.register('VertexAttributes', VertexAttributes);
        ShaderLib.register('VertexOutput', VertexOutput);
        ShaderLib.register('VertexFunction_vert', VertexFunction_vert);
        ShaderLib.register('VertexAttributes_vert', VertexAttributes_vert);
        ShaderLib.register('Common_vert', Common_vert);

        ShaderLib.register('Common_frag', Common_frag);
        ShaderLib.register('FragmentVarying', FragmentVarying);
        ShaderLib.register('FragmentOutput', FragmentOutput);

        ShaderLib.register('LightData', getLightData(seedSetting.shadow.maxCascades));
        ShaderLib.register('ClusterLight', ClusterLight);
        ShaderLib.register('ShadingInput', ShadingInput);
        ShaderLib.register('IESProfiles_frag', IESProfiles_frag);

        ShaderLib.register('ShadowCommon', ShadowCommon);
        ShaderLib.register('PCF_frag', PCF_frag);
        ShaderLib.register('CSM_frag', CSM_frag);
        ShaderLib.register('DirectShadow_frag', DirectShadow_frag);
        ShaderLib.register('PointShadow_frag', PointShadow_frag);
        ShaderLib.register('ShadowMapping_frag', ShadowMapping_frag);

        ShaderLib.register('Irradiance_frag', Irradiance_frag);
        ShaderLib.register('IrradianceVolumeData_frag', IrradianceVolumeData_frag);
        ShaderLib.register('BrdfLut_frag', BrdfLut_frag);
        ShaderLib.register('EnvMap_frag', EnvMap_frag);

        ShaderLib.register('ColorUtil_frag', ColorUtil);
        ShaderLib.register('BRDF_frag', BRDF_frag);
        ShaderLib.register('Hair_frag', Hair_frag);
        ShaderLib.register('BxDF_frag', BxDF_frag);
        ShaderLib.register('BsDF_frag', BsDF_frag);
        ShaderLib.register('AlphaHash_frag', AlphaHash_frag);
        ShaderLib.register('UnLit_frag', UnLit_frag);
        ShaderLib.register('UnLit', UnLit);
        ShaderLib.register('Sprite', Sprite_shader);

        ShaderLib.register('ReflectionCG', ReflectionCG);
        ShaderLib.register('ReflectionShader_shader', ReflectionShader_shader);
        ShaderLib.register('Clearcoat_frag', Clearcoat_frag);
        ShaderLib.register('Sheen_frag', Sheen_frag);
        ShaderLib.register('LitShader', Lit_shader);
        ShaderLib.register('PBRLItShader', PBRLItShader);

        ShaderLib.register('ClusterDebug_frag', ClusterDebug_frag);
        ShaderLib.register('BxdfDebug_frag', BxdfDebug_frag);
        ShaderLib.register('GenerayRandomDir', GenerayRandomDir);
        ShaderLib.register('Quad_vert_wgsl', Quad_vert_wgsl);
        ShaderLib.register('Quad_frag_wgsl', Quad_frag_wgsl);
        ShaderLib.register('Quad_premultiply_frag_wgsl', Quad_premultiply_frag_wgsl);
        ShaderLib.register('Quad_opaque_frag_wgsl', Quad_opaque_frag_wgsl);
        ShaderLib.register('Quad_depth2d_frag_wgsl', Quad_depth2d_frag_wgsl);
        ShaderLib.register('Quad_depthCube_frag_wgsl', Quad_depthCube_frag_wgsl);
        ShaderLib.register('sky_vs_frag_wgsl', CubeSky_Shader.sky_vs_frag_wgsl);
        ShaderLib.register('sky_fs_frag_wgsl', CubeSky_Shader.sky_fs_frag_wgsl);
        ShaderLib.register('earthsky_vs_wgsl', EarthSky_Shader.earthsky_vs_wgsl);
        ShaderLib.register('earthsky_fs_wgsl', EarthSky_Shader.earthsky_fs_wgsl);
        ShaderLib.register('earthatm_vs_wgsl', EarthAtm_Shader.earthatm_vs_wgsl);
        ShaderLib.register('earthatm_fs_wgsl', EarthAtm_Shader.earthatm_fs_wgsl);

        ShaderLib.register("LambertShader", Lambert_shader);

        ShaderLib.register("QuadGlsl_vs", QuadGlsl_vs);
        ShaderLib.register("QuadGlsl_fs", QuadGlsl_fs);

        ShaderLib.register("SkyGBuffer_fs", SkyGBuffer_pass);

        ShaderLib.register("gbuffer_vs", GBuffer_pass);
        ShaderLib.register("gbuffer_fs", GBuffer_pass);

        ShaderLib.register("castPointShadowMap_vert", castPointShadowMap_vert);
        ShaderLib.register("shadowCastMap_frag", shadowCastMap_frag);

        ShaderLib.register("shadowCastMap_vert", shadowCastMap_vert);
        ShaderLib.register("directionShadowCastMap_frag", directionShadowCastMap_frag);

        ShaderLib.register("ZPass_shader_vs", ZPassShader_vs);
    }

    /**
     * Monotonic revision of the registered chunk set. Anything caching data
     * derived from #include expansion (see Preprocessor's parse cache) must
     * invalidate when this changes, otherwise an HMR edit or a re-init with
     * different seed settings would keep serving stale expansions — the same
     * staleness class described in register() below.
     */
    public static _revision: number = 0;

    public static register(keyName: string, code: string) {
        // Always overwrite. Skipping on duplicate keys means vite HMR
        // can't propagate edits to *_frag.ts shader strings — the new
        // source gets re-imported, register() is called again with the
        // updated code, but the old code stays cached. Subsequent
        // preCompile reads the stale source. This produced the
        // confusing "works only after toggle / hard refresh" symptom
        // when the shader edit changed compositing behaviour
        // (e.g. UnLit_frag's USE_OIT_ACCUM pre-mul branch).
        let key = keyName.toLowerCase();
        if (ShaderLib[key] !== code) ShaderLib._revision++;
        ShaderLib[key] = code;
    }

    public static getShader(keyName: string): string {
        if (ShaderLib[keyName.toLowerCase()]) {
            return ShaderLib[keyName.toLowerCase()];
        }
        return ShaderLib[keyName.toLowerCase()];
    }



}

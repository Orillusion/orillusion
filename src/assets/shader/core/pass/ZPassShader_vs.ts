import { MorphTarget_shader } from "../../../../components/anim/morphAnim/MorphTarget_shader";
import { SkeletonAnimation_shader } from "../../anim/SkeletonAnimation_shader";

/**
 * @internal
 */
export let ZPassShader_vs: string = /*wgsl*/ `
    #include "GlobalUniform"
    #include "MathShader"
    struct VertexOutput {
        @location(auto) vID: f32 ,
        @location(auto) vPos: vec3<f32> ,
        @location(auto) vClipPos: vec4<f32> ,
        @builtin(position) member: vec4<f32>
    };

    struct Uniforms {
        matrix : array<mat4x4<f32>>
    };

    @group(0) @binding(1)
    var<storage, read> models : Uniforms;

    var<private> worldMatrix: mat4x4<f32>;

    #if USE_MORPHTARGETS
        ${MorphTarget_shader.getMorphTargetShaderBinding(1, 0)}
    #endif

    #if USE_SKELETON
        ${SkeletonAnimation_shader.groupBindingAndFunctions(1, 0)}
    #endif

    @vertex
    fn main(
        @builtin(instance_index) index : u32,
        @location(auto) position: vec3<f32>,
        @location(auto) normal: vec3<f32>,
        @location(auto) uv: vec2<f32>,
        @location(auto) TEXCOORD_1: vec2<f32>,

    #if USE_TANGENT
        @location(auto) TANGENT: vec4<f32>,
        #if USE_SKELETON
            @location(auto) joints0: vec4<f32>,
            @location(auto) weights0: vec4<f32>,
            #if USE_JOINT_VEC8
                @location(auto) joints1: vec4<f32>,
                @location(auto) weights1: vec4<f32>,
            #endif
        #elseif USE_MORPHTARGETS
            @location(auto) vIndex: f32,
        #endif
    #elseif USE_SKELETON
        @location(auto) joints0: vec4<f32>,
        @location(auto) weights0: vec4<f32>,
        #if USE_JOINT_VEC8
            @location(auto) joints1: vec4<f32>,
            @location(auto) weights1: vec4<f32>,
        #endif
    #elseif USE_MORPHTARGETS
        @location(auto) vIndex: f32,
    #endif
    ) -> VertexOutput {
    worldMatrix = models.matrix[index];

    var vertexPosition = position;
    var vertexNormal = normal;
    #if USE_MORPHTARGETS
        ${MorphTarget_shader.getMorphTargetCalcVertex()}
    #endif

    #if USE_SKELETON
        #if USE_JOINT_VEC8
            worldMatrix *= getSkeletonWorldMatrix_8(joints0, weights0, joints1, weights1);
        #else
            worldMatrix *= getSkeletonWorldMatrix_4(joints0, weights0);
        #endif
    #endif

        
        let wPos = worldMatrix * vec4<f32>(vertexPosition.xyz, 1.0);
        var fixProjMat = globalUniform.projMat ;
        var rzMatrix : mat4x4<f32> ;
        rzMatrix[0] = vec4<f32>(1.0,0.0,0.0,0.0) ; 
        rzMatrix[1] = vec4<f32>(0.0,1.0,0.0,0.0) ; 
        rzMatrix[2] = vec4<f32>(0.0,0.0,1.0,0.0) ; 
        rzMatrix[3] = vec4<f32>(0.0,0.0,0.0,1.0) ; 
        var clipPos:vec4<f32> = fixProjMat * globalUniform.viewMat * (wPos) ;

        // let d = log2Depth(clipPos.z * (globalUniform.far - globalUniform.near),globalUniform.near,globalUniform.far) ;
        return VertexOutput(f32(index) , wPos.xyz,clipPos, clipPos);
    }

    fn depthToLinear01(depth:f32) -> f32 {
        let a = 1.0 / (globalUniform.near - globalUniform.far);
        return (globalUniform.near*globalUniform.far*a) / (depth + globalUniform.far * a) ;
    }
`
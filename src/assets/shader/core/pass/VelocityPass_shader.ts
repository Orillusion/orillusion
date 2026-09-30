import { MorphTarget_shader } from "../../../../components/anim/morphAnim/MorphTarget_shader";
import { SkeletonAnimation_shader } from "../../anim/SkeletonAnimation_shader";

/**
 * Per-object motion vector pass. Transforms each vertex with both the
 * current and the previous frame's model matrix (and view-projection) and
 * writes `(uv - prevUv)` — the same convention as MotionVector_cs — so
 * moving objects get their own velocity instead of the camera-only value.
 *
 * Skinned / morphed meshes apply the CURRENT pose to both positions: the
 * rigid part of their motion is captured, the deformation part is not.
 * @internal
 */
export let VelocityPass_shader: string = /*wgsl*/ `
    #include "GlobalUniform"
    #include "MathShader"
    #include "VertexAttributes"

    struct VertexOutput {
        @location(auto) vClipPos: vec4<f32>,
        @location(auto) vPrevClipPos: vec4<f32>,
        @builtin(position) member: vec4<f32>
    };

    struct Uniforms {
        matrix : array<mat4x4<f32>>
    };

    @group(0) @binding(1)
    var<storage, read> models : Uniforms;

    struct VelocityData {
        prevViewProj: mat4x4<f32>,
    };

    var<private> worldMatrix: mat4x4<f32>;
    var<private> prevWorldMatrix: mat4x4<f32>;

    #if USE_MORPHTARGETS
        ${MorphTarget_shader.getMorphTargetShaderBinding(1, 0)}
    #endif

    #if USE_SKELETON
        ${SkeletonAnimation_shader.groupBindingAndFunctions(1, 0)}
    #endif

    // Declared after the optional group(1) users so 'auto' continues their numbering;
    // every bind group index up to the last one used must exist.
    @group(1) @binding(auto)
    var<storage, read> prevModels : Uniforms;
    @group(1) @binding(auto)
    var<uniform> velocityData : VelocityData;

    @vertex
    fn vert(vertex: VertexAttributes) -> VertexOutput {
        worldMatrix = models.matrix[vertex.index];
        prevWorldMatrix = prevModels.matrix[vertex.index];

        var vertexPosition = vertex.position;
        var vertexNormal = vertex.normal;

        #if USE_MORPHTARGETS
            ${MorphTarget_shader.getMorphTargetCalcVertex()}
        #endif

        #if USE_SKELETON
            #if USE_JOINT_VEC8
                let skin = getSkeletonWorldMatrix_8(vertex.joints0, vertex.weights0, vertex.joints1, vertex.weights1);
            #else
                let skin = getSkeletonWorldMatrix_4(vertex.joints0, vertex.weights0);
            #endif
            worldMatrix *= skin;
            prevWorldMatrix *= skin;
        #endif

        let wPos = worldMatrix * vec4<f32>(vertexPosition.xyz, 1.0);
        let prevWPos = prevWorldMatrix * vec4<f32>(vertexPosition.xyz, 1.0);
        let clipPos = globalUniform.projMat * globalUniform.viewMat * wPos;
        let prevClipPos = velocityData.prevViewProj * prevWPos;
        return VertexOutput(clipPos, prevClipPos, clipPos);
    }

    @fragment
    fn frag(in: VertexOutput) -> @location(0) vec4<f32> {
        let ndc = in.vClipPos.xy / in.vClipPos.w;
        let uv = vec2<f32>(ndc.x * 0.5 + 0.5, -ndc.y * 0.5 + 0.5);
        if (in.vPrevClipPos.w <= 0.0) {
            return vec4<f32>(0.0, 0.0, 0.0, 1.0);
        }
        let prevNdc = in.vPrevClipPos.xy / in.vPrevClipPos.w;
        let prevUv = vec2<f32>(prevNdc.x * 0.5 + 0.5, -prevNdc.y * 0.5 + 0.5);
        // .b = 1 marks a pixel written by an object (vs. the camera-only fill).
        return vec4<f32>(uv - prevUv, 1.0, 1.0);
    }
`;

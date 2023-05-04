import { SkeletonAnimation_shader } from "../../anim/SkeletonAnimation_shader";
import { MorphTarget_shader } from "../../../../components/anim/morphAnim/MorphTarget_shader";
export let shadowCastMap_vert: string = /*wgsl*/ `
#include "WorldMatrixUniform"
#include "GlobalUniform"

struct VertexOutput {
    @location(0) fragUV: vec2<f32>,
    @builtin(position) member: vec4<f32>
};

#if USE_MORPHTARGETS
    ${MorphTarget_shader.getMorphTargetShaderBinding(2, 1)}
#endif

#if USE_SKELETON
    ${SkeletonAnimation_shader.groupBindingAndFunctions(2, 1)} 
#endif

var<private> worldMatrix: mat4x4<f32>;

struct VertexAttributes{
  @builtin(instance_index) index : u32,
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) TEXCOORD_1: vec2<f32>,

  #if USE_TANGENT
      @location(4) TANGENT: vec4<f32>,
      #if USE_SKELETON
          @location(5) joints0: vec4<f32>,
          @location(6) weights0: vec4<f32>,
          #if USE_JOINT_VEC8
          @location(7) joints1: vec4<f32>,
          @location(8) weights1: vec4<f32>,
      #endif
      #elseif USE_MORPHTARGETS
          ${MorphTarget_shader.getMorphTargetAttr(5)}
      #endif
  #elseif USE_SKELETON
      @location(4) joints0: vec4<f32>,
      @location(5) weights0: vec4<f32>,
      #if USE_JOINT_VEC8
      @location(6) joints1: vec4<f32>,
      @location(7) weights1: vec4<f32>,
      #endif
  #elseif USE_MORPHTARGETS
     ${MorphTarget_shader.getMorphTargetAttr(4)}
  #endif
}

@vertex
fn main(vertex:VertexAttributes) -> VertexOutput {
    worldMatrix = models.matrix[vertex.index];
    let shadowMatrix: mat4x4<f32> = globalUniform.projMat * globalUniform.viewMat ;
    var vertexPosition = vertex.position.xyz;
    var vertexNormal = vertex.normal.xyz;

    #if USE_MORPHTARGETS
     ${MorphTarget_shader.getMorphTargetCalcVertex()}    
    #endif

    #if USE_SKELETON
        #if USE_JOINT_VEC8
          worldMatrix *= getSkeletonWorldMatrix_8(vertex.joints0, vertex.weights0, vertex.joints1, vertex.weights1);
        #else
          worldMatrix *= getSkeletonWorldMatrix_4(vertex.joints0, vertex.weights0);
        #endif
    #endif

    var worldPos = worldMatrix * vec4<f32>(vertexPosition, 1.0) ;
    var vPos = shadowMatrix * worldPos;
    return VertexOutput(vertex.uv, vPos );  
}
`

export let castPointShadowMap_vert: string = /*wgsl*/ `
#include "WorldMatrixUniform"
#include "GlobalUniform"

struct VertexOutput {
    @location(0) fragUV: vec2<f32>,
    @location(1) worldPos: vec3<f32>,
    @builtin(position) member: vec4<f32>
};

#if USE_MORPHTARGETS
    ${MorphTarget_shader.getMorphTargetShaderBinding(2, 1)}
##endif
 
#if USE_SKELETON
    ${SkeletonAnimation_shader.groupBindingAndFunctions(2, 1)} 
#endif

var<private> worldMatrix: mat4x4<f32>;

struct VertexAttributes{
  @builtin(instance_index) index : u32,
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) TEXCOORD_1: vec2<f32>,

  #if USE_TANGENT
      @location(4) TANGENT: vec4<f32>,
      #if USE_SKELETON
          @location(5) joints0: vec4<f32>,
          @location(6) weights0: vec4<f32>,
          #if USE_JOINT_VEC8
          @location(7) joints1: vec4<f32>,
          @location(8) weights1: vec4<f32>,
      #endif
      #elseif USE_MORPHTARGETS
         ${MorphTarget_shader.getMorphTargetAttr(5)}
      #endif
  #elseif USE_SKELETON
      @location(4) joints0: vec4<f32>,
      @location(5) weights0: vec4<f32>,
      #if USE_JOINT_VEC8
      @location(6) joints1: vec4<f32>,
      @location(7) weights1: vec4<f32>,
      #endif
  #elseif USE_MORPHTARGETS
      ${MorphTarget_shader.getMorphTargetAttr(4)}
  #endif
}

@vertex
fn main(vertex:VertexAttributes) -> VertexOutput {
    worldMatrix = models.matrix[vertex.index];
    let shadowMatrix: mat4x4<f32> = globalUniform.projMat * globalUniform.viewMat ;
    var vertexPosition = vertex.position.xyz;

    #if USE_MORPHTARGETS
        ${MorphTarget_shader.getMorphTargetCalcVertex()}
    #endif

    #if USE_SKELETON
        #if USE_JOINT_VEC8
          worldMatrix *= getSkeletonWorldMatrix_8(vertex.joints0, vertex.weights0, vertex.joints1, vertex.weights1);
        #else
          worldMatrix *= getSkeletonWorldMatrix_4(vertex.joints0, vertex.weights0);
        #endif
    #endif

    var worldPos = worldMatrix * vec4<f32>(vertexPosition, 1.0) ;
    var vPos = shadowMatrix * worldPos;
    return VertexOutput(vertex.uv, worldPos.xyz , vPos ); 
}
`

export let shadowCastMap_frag: string = /*wgsl*/ `
#if USE_ALPHACUT
@group(1) @binding(0)
var baseMapSampler: sampler;
@group(1) @binding(1)
var baseMap: texture_2d<f32>;
#endif

struct FragmentOutput {
  @location(0) o_Target: vec4<f32>,
  @builtin(frag_depth) out_depth: f32
};

struct MaterialUniform {
lightWorldPos: vec3<f32>,
cameraFar: f32,
};

@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;

@fragment
fn main(@location(0) fragUV: vec2<f32> , @location(1) worldPos:vec3<f32> ) -> FragmentOutput {
var distance = length(worldPos.xyz - materialUniform.lightWorldPos ) ;
distance = distance / materialUniform.cameraFar ;

#if USE_ALPHACUT
  let Albedo = textureSample(baseMap,baseMapSampler,fragUV);
  var fragOut:FragmentOutput; 
  if(Albedo.w > 0.5){
    fragOut = FragmentOutput(vec4<f32>(0.0),distance);
  }
//   if(Albedo.w > 0.5){
//     fragOut = FragmentOutput(vec4<f32>(0.0),distance);
//   }else{
//     discard;
//   }
  return fragOut ;
#else
    fragOut = FragmentOutput(vec4<f32>(0.0),distance);
#endif
}
`
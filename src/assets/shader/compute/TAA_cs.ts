export let TAA_cs: string = /*wgsl*/ `
#include "GlobalUniform"

struct TAAData{
  preProjMatrix: mat4x4<f32>,
  preViewMatrix: mat4x4<f32>,
  jitterFrameIndex: f32,
  blendFactor: f32,
  sharpFactor: f32,
  sharpPreBlurFactor: f32,
  jitterX: f32,
  jitterY: f32,
  slot0: f32,
  slot1: f32,
}

@group(0) @binding(0) var<uniform> standUniform: GlobalUniform;
@group(0) @binding(1) var<uniform> taaData: TAAData;
@group(0) @binding(2) var<storage, read_write> preColorBuffer : array<vec4<f32>>;

@group(0) @binding(3) var preColorTexSampler : sampler;
@group(0) @binding(4) var preColorTex : texture_2d<f32>;
@group(0) @binding(5) var posTex : texture_2d<f32>;
@group(0) @binding(6) var inTexSampler : sampler;
@group(0) @binding(7) var inTex : texture_2d<f32>;
@group(0) @binding(8) var outTex : texture_storage_2d<rgba16float, write>;

var<private> texSize: vec2<u32>;
var<private> fragCoord: vec2<i32>;
var<private> coordIndex: i32;
var<private> color_min: vec4<f32>;
var<private> color_max: vec4<f32>;
var<private> color_avg: vec4<f32>;
var<private> re_proj_uv01: vec2<f32>;
var<private> FLT_EPS:f32 = 5.960464478e-8;  // 2^-24, machine epsilon: 1 + EPS = 1 (half of the ULP for 1.0f)

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
  fragCoord = vec2<i32>( globalInvocation_id.xy );
  texSize = textureDimensions(inTex).xy;
  if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
      return;
  }
  let frame = standUniform.frame;
  coordIndex = fragCoord.x + fragCoord.y * i32(texSize.x);
  
  let oc = blendColor();
  preColorBuffer[coordIndex] = oc;
  textureStore(outTex, fragCoord , oc);
}

fn blendColor() -> vec4<f32>
{
  var preCoord = fragCoord;
  var mixWeight = 1.0;
  re_proj_uv01 = vec2<f32>(0.0);
  var reProjectionCoord:vec2<f32> = vec2<f32>(fragCoord);
  //var jitterUVOffset = 0.5 * vec2<f32>(taaData.jitterX, -taaData.jitterY);
  if(taaData.jitterFrameIndex > 0.5){
      var wPos = textureLoad(posTex, fragCoord, 0);
      let ndc = taaData.preProjMatrix * (taaData.preViewMatrix * vec4<f32>(wPos.xyz, 1.0));
      re_proj_uv01 = vec2<f32>(ndc.x, -ndc.y) / ndc.w;
      re_proj_uv01 = (re_proj_uv01 + 1.0) * 0.5;
      
      if(re_proj_uv01.x >= 0.0 && re_proj_uv01.x <= 1.0 && re_proj_uv01.y >= 0.0 && re_proj_uv01.y <= 1.0){
          mixWeight = taaData.blendFactor;
          //reProjectionCoord = re_proj_uv01 + jitterUVOffset;
          reProjectionCoord.x = re_proj_uv01.x * f32(texSize.x - 1);
          reProjectionCoord.y = re_proj_uv01.y * f32(texSize.y - 1);
          preCoord = vec2<i32>(reProjectionCoord);
      }else{ 
          //outside of screen
          mixWeight = 1.0;
      }
  }
  
  var curUV01 = vec2<f32>(fragCoord) / vec2<f32>(texSize - 1);
  //curUV01 += jitterUVOffset;
  
  let curColor = textureSampleLevel(inTex, inTexSampler, curUV01, 0.0);
  
  let preIndex = preCoord.x + preCoord.y * i32(texSize.x);
  var preColor = textureSampleLevel(preColorTex, preColorTexSampler, re_proj_uv01, 0.0);
  
  //minmax9(fragCoord);
  minmax4(fragCoord);
  
  preColor = clip_aabb(color_min.xyz, color_max.xyz, color_avg, preColor);
  var outColor = mix(preColor, curColor, mixWeight);

  return outColor;
}

fn clampCoord(coord0:vec2<i32>) -> vec2<i32>{
  return clamp(coord0, vec2<i32>(0), vec2<i32>(texSize - 1));
}

fn minmax4(coord:vec2<i32>) {
      let uv0 = clampCoord(vec2<i32>(coord.x - 1, coord.y));
      let uv1 = clampCoord(vec2<i32>(coord.x, coord.y - 1));
      let uv2 = clampCoord(vec2<i32>(coord.x, coord.y + 1));
      let uv3 = clampCoord(vec2<i32>(coord.x + 1, coord.y));
      
      let c0 = textureLoad(inTex, uv0, 0);
      let c1 = textureLoad(inTex, uv1, 0);
      let c2 = textureLoad(inTex, uv2, 0);
      let c3 = textureLoad(inTex, uv3, 0);
      
      color_min = min(c0, min(c1, min(c2, c3)));
      color_max = max(c0, max(c1, max(c2, c3)));
      color_avg = (c0 + c1 + c2 + c3) * 0.25;
  }
  
 fn minmax9(coord:vec2<i32>) {
      let uv0 = clampCoord(vec2<i32>(coord.x - 1, coord.y - 1));
      let uv1 = clampCoord(vec2<i32>(coord.x - 1, coord.y));
      let uv2 = clampCoord(vec2<i32>(coord.x - 1, coord.y + 1));
      let uv3 = clampCoord(vec2<i32>(coord.x, coord.y - 1));
      let uv4 = clampCoord(vec2<i32>(coord.x, coord.y));
      let uv5 = clampCoord(vec2<i32>(coord.x, coord.y + 1));
      let uv6 = clampCoord(vec2<i32>(coord.x + 1, coord.y - 1));
      let uv7 = clampCoord(vec2<i32>(coord.x + 1, coord.y));
      let uv8 = clampCoord(vec2<i32>(coord.x + 1, coord.y + 1));
      
      let ctl = textureLoad(inTex, uv0, 0);
      let ctc = textureLoad(inTex, uv1, 0);
      let ctr = textureLoad(inTex, uv2, 0);
      let cml = textureLoad(inTex, uv3, 0);
      let cmc = textureLoad(inTex, uv4, 0);
      let cmr = textureLoad(inTex, uv5, 0);
      let cbl = textureLoad(inTex, uv6, 0);
      let cbc = textureLoad(inTex, uv7, 0);
      let cbr = textureLoad(inTex, uv8, 0);
      
      color_min = min(ctl, min(ctc, min(ctr, min(cml, min(cmc, min(cmr, min(cbl, min(cbc, cbr))))))));
      color_max = max(ctl, max(ctc, max(ctr, max(cml, max(cmc, max(cmr, max(cbl, max(cbc, cbr))))))));
      color_avg = (ctl + ctc + ctr + cml + cmc + cmr + cbl + cbc + cbr) / 9.0;
  }
  
  fn clip_aabb(aabb_max:vec3<f32>, aabb_min:vec3<f32>, color_avg:vec4<f32>, input_texel:vec4<f32>) -> vec4<f32>
  {
      var p_clip:vec3<f32> = 0.5 * (aabb_max + aabb_min);
      var e_clip:vec3<f32> = 0.5 * (aabb_max - aabb_min) + FLT_EPS;
      var v_clip:vec4<f32> = input_texel - vec4<f32>(p_clip, color_avg.w);
      var v_unit:vec3<f32> = v_clip.xyz / e_clip;
      var a_unit:vec3<f32> = abs(v_unit);
      var ma_unit:f32 = max(a_unit.x, max(a_unit.y, a_unit.z));

      if (ma_unit > 1.0){
          return vec4<f32>(p_clip, color_avg.w) + v_clip / ma_unit;
      }else{
          return input_texel;
      }
  }`

import { ColorUtil } from "../utils/ColorUtil";
/**
 * @internal
 */
let BloomCfg =  /*wgsl*/ `
struct BloomCfg{
  downSampleStep: f32,
  downSampleBlurSize: f32,
  downSampleBlurSigma: f32,
  upSampleBlurSize: f32,
  upSampleBlurSigma: f32,
  luminanceThreshole: f32,
  bloomIntensity: f32,
  slot: f32,
}
@group(0) @binding(0) var<uniform> bloomCfg: BloomCfg;
`

let CalcUV_01 = /*wgsl*/ `
  fn CalcUV_01(coord:vec2<i32>, texSize:vec2<u32>) -> vec2<f32>
  {
    let u = (f32(coord.x) + 0.5) / f32(texSize.x);
    let v = (f32(coord.y) + 0.5) / f32(texSize.y);
    return vec2<f32>(u, v);
  }

`

//_______________calc weight
/**
 * @internal
 */
let GaussWeight2D: string =  /*wgsl*/ `
fn GaussWeight2D(x:f32, y:f32, sigma:f32) -> f32
  {
      let PI = 3.14159265358;
      let E  = 2.71828182846;
      let sigma_2 = pow(sigma, 2);
  
      let a = -(x*x + y*y) / (2.0 * sigma_2);
      return pow(E, a) / (2.0 * PI * sigma_2);
  }
`
/**
 * @internal
 */
let GaussBlur = function (GaussNxN: string, inTex: string, inTexSampler: string) {
  var code: string = /*wgsl*/ `

  fn ${GaussNxN}(uv:vec2<f32>, n:i32, stride:vec2<f32>, sigma:f32) -> vec3<f32>
  {
      var color = vec3<f32>(0.0);
      let r:i32 = n / 2;
      var weight:f32 = 0.0;
  
      for(var i:i32=-r; i<=r; i+=1)
      {
          for(var j=-r; j<=r; j+=1)
          {
              let w = GaussWeight2D(f32(i), f32(j), sigma);
              var coord:vec2<f32> = uv + vec2<f32>(f32(i), f32(j)) * stride ;
              color += textureSampleLevel(${inTex}, ${inTexSampler}, coord, 0.0).xyz * w;
              weight += w;
          }
      }
  
      color /= weight;
      return color;
  }`;
  return code;

}



//________________________pixel filter
/**
 * @internal
 */
export let threshold: string = /*wgsl*/ `
${ColorUtil}
${BloomCfg}

@group(0) @binding(1) var inTex : texture_2d<f32>;
@group(0) @binding(2) var outTex : texture_storage_2d<rgba16float, write>;

var<private> texSize: vec2<u32>;
var<private> fragCoord: vec2<i32>;

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
  fragCoord = vec2<i32>( globalInvocation_id.xy );
  texSize = textureDimensions(inTex).xy;
  if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
      return;
  }
  var color = textureLoad(inTex, fragCoord, 0);
  var linerColor = gammaToLiner(color.rgb);
  var lum = dot(vec3<f32>(0.2126, 0.7152, 0.0722), linerColor.rgb) ;

  var ret = linerColor.xyz;
  var contribution = max(0, lum - bloomCfg.luminanceThreshole) ;
  // if(contribution > 0.0){
    // ret = linerColor * contribution;
  ret = ACESToneMapping(linerColor,contribution);
  // }else{
  //   ret = vec3f(0.0,0.0,0.0);
  // }
  textureStore(outTex, fragCoord, vec4<f32>(vec3f(ret), color.w));
}
`

//________________________down sample
/**
 * @internal
 */
export let downSample: string = /*wgsl*/ `
${BloomCfg}

@group(0) @binding(1) var inTex : texture_2d<f32>;
@group(0) @binding(2) var inTexSampler: sampler;
@group(0) @binding(3) var outTex : texture_storage_2d<rgba16float, write>;

var<private> texSize: vec2<u32>;
var<private> fragCoord: vec2<i32>;

${GaussWeight2D}
${GaussBlur('GaussNxN', 'inTex', 'inTexSampler')}
${CalcUV_01}

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
  fragCoord = vec2<i32>( globalInvocation_id.xy );
  texSize = textureDimensions(outTex).xy;
  if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
      return;
  }
  var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  var uv = CalcUV_01(fragCoord, texSize);
  let stride = vec2<f32>(1.0) / vec2<f32>(f32(texSize.x), f32(texSize.y));   //  texel size of last level
  let rgb = GaussNxN(uv, i32(bloomCfg.downSampleBlurSize), stride, bloomCfg.downSampleBlurSigma);
  color = vec4<f32>(rgb, color.w);
  textureStore(outTex, fragCoord, color);
}
`


//__________________________up sample
/**
 * @internal
 */
export let upSample = /*wgsl*/ `
${BloomCfg}

@group(0) @binding(1) var _MainTex : texture_2d<f32>;
@group(0) @binding(2) var _MainTexSampler: sampler;
@group(0) @binding(3) var _PrevMip : texture_2d<f32>;
@group(0) @binding(4) var _PrevMipSampler: sampler;
@group(0) @binding(5) var outTex : texture_storage_2d<rgba16float, write>;

var<private> texSize: vec2<u32>;
var<private> fragCoord: vec2<i32>;

${GaussWeight2D}
${GaussBlur('GaussNxN_0', '_MainTex', '_MainTexSampler')}
${GaussBlur('GaussNxN_1', '_PrevMip', '_PrevMipSampler')}
${CalcUV_01}

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
  fragCoord = vec2<i32>( globalInvocation_id.xy );
  texSize = textureDimensions(outTex).xy;
  if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
      return;
  }
  var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  var uv = CalcUV_01(fragCoord, texSize);
  
  // half stride
  let prev_stride = vec2<f32>(0.5) / vec2<f32>(f32(texSize.x), f32(texSize.y));
  let curr_stride = vec2<f32>(1.0) / vec2<f32>(f32(texSize.x), f32(texSize.y));

  let rgb1 = GaussNxN_0(uv, i32(bloomCfg.upSampleBlurSize), prev_stride, bloomCfg.upSampleBlurSigma);
  let rgb2 = GaussNxN_1(uv, i32(bloomCfg.upSampleBlurSize), curr_stride, bloomCfg.upSampleBlurSigma);
  color = vec4<f32>(rgb1+rgb2, color.w);
  textureStore(outTex, fragCoord, color);
}
`


//__________________________blend
/**
 * @internal
 */
export let post = /*wgsl*/ `
${ColorUtil}
${BloomCfg}
${CalcUV_01}

@group(0) @binding(1) var _MainTex : texture_2d<f32>;
@group(0) @binding(2) var _BloomTex : texture_2d<f32>;
@group(0) @binding(3) var _BloomTexSampler :  sampler;
@group(0) @binding(4) var outTex : texture_storage_2d<rgba16float, write>;

var<private> texSize: vec2<u32>;
var<private> fragCoord: vec2<i32>;

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
  fragCoord = vec2<i32>( globalInvocation_id.xy );
  texSize = textureDimensions(outTex).xy;
  if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
      return;
  }
  var color = textureLoad(_MainTex, fragCoord, 0);
  let uv = vec2<f32>(f32(fragCoord.x), f32(fragCoord.y)) / vec2<f32>(f32(texSize.x - 1), f32(texSize.y - 1));

  // var bloom = textureLoad(_BloomTex, fragCoord, 0).xyz;
  var bloom = textureSampleLevel(_BloomTex, _BloomTexSampler, uv, 0.0).xyz * bloomCfg.bloomIntensity;
  
  // tone map
  bloom = ACESToneMapping(bloom, 1.0);
  let g = 1.0 / 2.2;
  bloom = saturate(pow(bloom, vec3<f32>(g)));
 
  color = vec4<f32>(color.xyz + bloom.xyz, color.w);
  textureStore(outTex, fragCoord, color);
}
`
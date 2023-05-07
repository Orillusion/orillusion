export let BLUR_CsShader: string = /* wgsl */`
#include "GlobalUniform"

struct UniformData {
  radius: f32 ,
  bias: f32,
  aoPower: f32 ,
  blurSize: f32 ,
};

// @group(0) @binding(0) var<uniform> standUniform: GlobalUniform;
@group(0) @binding(0) var<uniform> uniformData: UniformData;
@group(0) @binding(1) var colorMap : texture_2d<f32>;
// @group(0) @binding(2) var ssaoMapSampler : sampler;
@group(0) @binding(2) var ssaoMap : texture_2d<f32>;
@group(0) @binding(3) var outTex : texture_storage_2d<rgba16float, write>;

@compute @workgroup_size( 8 , 8 )
fn CsMain( @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
  var fragCoord = vec2<i32>( globalInvocation_id.xy );

  var texSize = vec2<f32>(textureDimensions(ssaoMap).xy);
  var texCoord = vec2<f32>(fragCoord) / texSize ;

  let blurSize = i32(uniformData.blurSize);

  var result = vec4<f32>(0.0) ;
  var ii = 0.0 ;
  for (var i = -2; i < 2 ; i+=1) {
     for (var j = -2; j < 2 ; j+=1) {
        var offset = vec2<i32>( i , j ) ;
        result += textureLoad(ssaoMap, fragCoord + offset, 0 );
        // result += textureSampleLevel(ssaoMap,ssaoMapSampler, vec2<f32>( fragCoord + offset) / texSize , 0.0 );
        ii += 1.0 ;
     }
  }
  var fResult = result.r / ii ;
  var color = textureLoad(colorMap, fragCoord , 0 );
  textureStore(outTex, fragCoord , vec4(color.rgb * fResult,1.0) );
}
`
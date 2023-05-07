export let SSAO_cs: string = /*wgsl*/ `
#include "GlobalUniform"
  struct UniformData {
    radius: f32 ,
    bias: f32,
    aoPower: f32 ,
    blurSize: f32 ,
  };

  @group(0) @binding(0) var<uniform> standUniform: GlobalUniform;
  @group(0) @binding(1) var<uniform> uniformData: UniformData;
  @group(0) @binding(2) var<storage,read> sampleData: array<vec4<f32>>;

  // @group(0) @binding(3) var colorMap : texture_2d<f32>;
  @group(0) @binding(3) var positionMap : texture_2d<f32>;
  @group(0) @binding(4) var normalMap : texture_2d<f32>;

  @group(0) @binding(5) var noiseMapSampler: sampler;
  @group(0) @binding(6) var noiseMap : texture_2d<f32>;

  @group(0) @binding(7) var outTex : texture_storage_2d<rgba16float, write>;

  var<private> kernelSize: i32 = 32 ;

  @compute @workgroup_size( 8 , 8 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    var fragCoord = vec2<i32>( globalInvocation_id.xy );

    var texSize = textureDimensions(positionMap).xy;
    var texCoord = vec2<f32>(fragCoord) / vec2<f32>(texSize);

    var fragColor = vec4<f32>(1.0);

    var viewMat = standUniform.viewMat  ;
    // var color = textureLoad(colorMap, fragCoord , 0 ) ;
    var wPos = textureLoad(positionMap, fragCoord , 0 ) ;

    var fragPosition = viewMat * vec4<f32>(wPos.xyz,1.0);
    fragPosition = vec4(fragPosition.xyz / fragPosition.w,1.0) ;

    var texNormal = textureLoad(normalMap, fragCoord , 0 ) ;
    var sampleNormal = texNormal.xyz ;
    sampleNormal = sampleNormal * 2.0 - 1.0;
    var fragNormal = viewMat * vec4<f32>((sampleNormal.xyz),0.0);

    var pes = vec2<f32>(texSize.xy) / 4.0 ;
    var noiseTex:vec4<f32> = textureSampleLevel(noiseMap, noiseMapSampler, texCoord * pes , 0.0);
    var randomVec  = (viewMat * vec4<f32>(normalize(noiseTex.xyz),0.0)).xyz;

    var tangent = normalize(randomVec - fragNormal.xyz * dot(randomVec , fragNormal.xyz));
    var bTangent = cross(fragNormal.xyz, tangent) + 0.0001 ;
    var tbn = mat3x3<f32>(tangent, bTangent, fragNormal.xyz);

    var offset:vec4<f32>;
    var samplePos :vec3<f32>;
    var offsetPosition:f32;
    var sample_depth_v:vec4<f32>;
    var occlusion:f32 = 0.0;
    var rangeCheck:f32 = 0.0 ;
    var radius:f32 = uniformData.radius * 32.0 * fragPosition.z ;

    for(var i:i32 = 0; i < 32 ; i = i + 1 ){
      samplePos  = (tbn * sampleData[i].xyz ) ;
      samplePos  = fragPosition.xyz + samplePos * radius ;

      offset = vec4(samplePos, 1.0);
      offset = standUniform.projMat * offset;

      var off = offset.xyz / offset.w;
      off = (off.xyz * 0.5 ) + 0.5 ;
      off.y = 1.0 - off.y ;
      var offsetUV = vec2<i32>(off.xy * vec2<f32>(texSize.xy));

      sample_depth_v = textureLoad(positionMap, offsetUV.xy , 0 ) ;
      sample_depth_v = vec4<f32>((viewMat * vec4<f32>(sample_depth_v.xyz,1.0)).xyz,1.0);
      offsetPosition = sample_depth_v.z / sample_depth_v.w ;

      rangeCheck = smoothstep(0.0, 1.0, radius / abs(offsetPosition - fragPosition.z ));
      // rangeCheck = smoothstep(0.0, 1.0, radius / uniformData.bias);

      var a = 1.0 ;
      if(offsetPosition >= (samplePos.z + uniformData.bias)){
        a = 0.0 ;
      }
      a = a * rangeCheck ;
      occlusion = occlusion + a ;
    }

    occlusion = 1.0 - ( occlusion / f32(kernelSize) * texNormal.w );
    occlusion = pow(occlusion, uniformData.aoPower) ;

    // color = color * occlusion ;

    textureStore(outTex, fragCoord , vec4(occlusion));
  }
`




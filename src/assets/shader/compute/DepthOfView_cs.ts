export let DepthOfView_cs: string = /*wgsl*/ `
#include "GlobalUniform"

  struct BlurSetting{
    near: f32,
    far: f32,
    pixelOffset: f32,
  }

  @group(0) @binding(0) var<uniform> standUniform: GlobalUniform;
  @group(0) @binding(1) var<uniform> blurSetting: BlurSetting;

  @group(0) @binding(2) var positionBufferTex : texture_2d<f32>;
  @group(0) @binding(3) var normalBufferTex : texture_2d<f32>;
  @group(0) @binding(4) var inTexSampler : sampler;
  @group(0) @binding(5) var inTex : texture_2d<f32>;
  @group(0) @binding(6) var outTex : texture_storage_2d<rgba16float, write>;

  var<private> cameraPosition: vec3<f32>;
  var<private> texSize: vec2<u32>;
  var<private> fragCoord: vec2<i32>;
  var<private> texelSize: vec2<f32>;

  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    fragCoord = vec2<i32>( globalInvocation_id.xy );
    texSize = textureDimensions(inTex).xy;
    texelSize = 1.0 / vec2<f32>(texSize - 1);
    if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
        return;
    }
    cameraPosition = vec3<f32>(standUniform.cameraWorldMatrix[3].xyz);
    let wPosition:vec3<f32> = textureLoad(positionBufferTex, fragCoord , 0).xyz;
    var distance = length(wPosition - cameraPosition);
    var oc:vec4<f32> = textureLoad(inTex, fragCoord, 0);
    if(distance > blurSetting.near){
        let normal = textureLoad(normalBufferTex, fragCoord, 0);
        var pixelScale = 0.5;
        if(normal.w > 0.5){
            distance = min(distance, blurSetting.far);
            pixelScale = (distance - blurSetting.near) / (blurSetting.far - blurSetting.near);
        }
        oc = mixBlurColor(oc, fragCoord, blurSetting.pixelOffset, pixelScale);
    }
    textureStore(outTex, fragCoord, oc);
  }

  fn mixBlurColor(orginColor:vec4<f32>, coord:vec2<i32>, pixelOffset:f32, scale:f32) -> vec4<f32> {

    let uv = vec2<f32>(coord);
    var uv0 = (uv + scale * vec2<f32>( pixelOffset,  pixelOffset)) * texelSize;
    var uv1 = (uv + scale * vec2<f32>(-pixelOffset,  pixelOffset)) * texelSize;
    var uv2 = (uv + scale * vec2<f32>(-pixelOffset, -pixelOffset)) * texelSize;
    var uv3 = (uv + scale * vec2<f32>( pixelOffset, -pixelOffset)) * texelSize;

    uv0.x = processUVEdge(uv0.x);
    uv0.y = processUVEdge(uv0.y);
    uv1.x = processUVEdge(uv1.x);
    uv1.y = processUVEdge(uv1.y);
    uv2.x = processUVEdge(uv2.x);
    uv2.y = processUVEdge(uv2.y);
    uv3.x = processUVEdge(uv3.x);
    uv3.y = processUVEdge(uv3.y);

    var ob = vec4<f32>(0.0);
    ob += textureSampleLevel(inTex, inTexSampler, uv0, 0.0);
    ob += textureSampleLevel(inTex, inTexSampler, uv1, 0.0);
    ob += textureSampleLevel(inTex, inTexSampler, uv2, 0.0);
    ob += textureSampleLevel(inTex, inTexSampler, uv3, 0.0);
    return mix(orginColor, ob * 0.25, scale);
  }

  fn processUVEdge(v: f32) -> f32{
      var value = v;
      if(value < 0.0){
        value = - value;
      }else if(value > 1.0){
        value = 2.0 - value;
      }
      return value;
  }
`

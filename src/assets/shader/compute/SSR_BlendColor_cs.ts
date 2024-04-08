export let SSR_BlendColor_cs: string = /*wgsl*/ `
  #include 'GlobalUniform'

  @group(0) @binding(2) var<storage, read_write> rayTraceBuffer : array<RayTraceRetData>;
  @group(0) @binding(3) var colorMap : texture_2d<f32>;
  @group(0) @binding(4) var ssrMapSampler : sampler;
  @group(0) @binding(5) var ssrMap : texture_2d<f32>;
  @group(0) @binding(6) var outTex : texture_storage_2d<rgba16float, write>;

  var<private> colorTexSize: vec2<u32>;
  var<private> ssrTexSize: vec2<u32>;
  var<private> fragCoord: vec2<i32>;
  var<private> ssrCoord: vec2<i32>;

  struct RayTraceRetData{
    skyColor:vec3<f32>,
    roughness:f32,

    hitCoord:vec2<f32>,
    alpha:f32,
    fresnel:f32,
  }

  fn CalcUV_01(coord:vec2<i32>, texSize:vec2<u32>) -> vec2<f32>
  {
    let u = (f32(coord.x) + 0.5) / f32(texSize.x);
    let v = (f32(coord.y) + 0.5) / f32(texSize.y);
    return vec2<f32>(u, v);
  }

  const PI = 3.1415926;
  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    fragCoord = vec2<i32>( globalInvocation_id.xy );
    colorTexSize = textureDimensions(colorMap).xy;
    ssrTexSize = textureDimensions(ssrMap).xy;
    if(fragCoord.x >= i32(colorTexSize.x) || fragCoord.y >= i32(colorTexSize.y)){
        return;
    }
    let scale:f32 = f32(ssrTexSize.x) / f32(colorTexSize.x);
    ssrCoord = vec2<i32>(vec2<f32>(fragCoord.xy) * scale);
    let index = ssrCoord.x + ssrCoord.y * i32(ssrTexSize.x);
    let hitData = rayTraceBuffer[index];
    var lastColor = textureLoad(colorMap, fragCoord , 0);
    let time = globalUniform.time;

    var uv01 = CalcUV_01(fragCoord, colorTexSize);
    
    var ssrColor = textureSampleLevel(ssrMap, ssrMapSampler, uv01, 0.0);
    var outColor = mix(lastColor, ssrColor, hitData.fresnel) ;
    textureStore(outTex, fragCoord , outColor );
  }

`


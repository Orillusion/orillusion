export let SSR_BlendColor_cs: string = /*wgsl*/ `
@group(0) @binding(0) var<storage, read_write> rayTraceBuffer : array<RayTraceRetData>;
  @group(0) @binding(1) var colorMap : texture_2d<f32>;
  @group(0) @binding(2) var ssrMapSampler : sampler;
  @group(0) @binding(3) var ssrMap : texture_2d<f32>;
  @group(0) @binding(4) var outTex : texture_storage_2d<rgba16float, write>;

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
    var color = textureLoad(colorMap, fragCoord , 0);
    var uv01 = vec2<f32>(f32(fragCoord.x), f32(fragCoord.y));
    uv01 = uv01 / vec2<f32>(colorTexSize - 1);
    
    var ssrColor = textureSampleLevel(ssrMap, ssrMapSampler, uv01, 0.0);
    var tc = mix(color, ssrColor, hitData.fresnel) ;
    var outColor = tc ;
    outColor.a = color.a ; 
    textureStore(outTex, fragCoord , outColor );
  }

`


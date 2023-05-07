export let SSR_IS_cs: string = /*wgsl*/ `
  struct SSRUniformData {
    ssrBufferSizeX: f32,
    ssrBufferSizeY: f32,
    colorMapSizeX: f32,
    colorMapSizeY: f32,

    fadeEdgeRatio: f32,
    rayMarchRatio: f32,
    fadeDistanceMin: f32,
    fadeDistanceMax: f32,
    
    mixThreshold: f32,
    roughnessThreshold: f32,
    reflectionRatio: f32,
    powDotRN: f32,

    randomSeedX: f32,
    randomSeedY: f32,
    slot1: f32,
    slot2: f32,
  };

  struct RayTraceRetData{
    skyColor:vec3<f32>,
    roughness:f32,

    hitCoord:vec2<f32>,
    alpha:f32,
    fresnel:f32,
  }

  @group(0) @binding(0) var<uniform> ssrUniform: SSRUniformData;
  @group(0) @binding(1) var<storage, read_write> rayTraceBuffer : array<RayTraceRetData>;
  @group(0) @binding(2) var<storage, read_write> ssrColorData : array<vec4<f32>>;
  @group(0) @binding(3) var<storage, read_write> historyPosition : array<vec4<f32>>;

  @group(0) @binding(4) var colorMap: texture_2d<f32>;
  @group(0) @binding(5) var outTex : texture_storage_2d<rgba16float, write>;

  var<private> ssrBufferCoord: vec2<i32>;
  var<private> colorTexSize: vec2<i32>;
  var<private> bufferData: RayTraceRetData;
  var<private> ssrBufferSize: vec2<i32>;
  var<private> coordIndex: i32;

  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    ssrBufferCoord = vec2<i32>( globalInvocation_id.xy );
    ssrBufferSize = vec2<i32>(i32(ssrUniform.ssrBufferSizeX), i32(ssrUniform.ssrBufferSizeY));
    colorTexSize = vec2<i32>(i32(ssrUniform.colorMapSizeX), i32(ssrUniform.colorMapSizeY));

    if(ssrBufferCoord.x >= ssrBufferSize.x || ssrBufferCoord.y >= ssrBufferSize.y){
        return;
    }

    coordIndex = ssrBufferCoord.x + ssrBufferCoord.y * ssrBufferSize.x;
    bufferData = rayTraceBuffer[coordIndex];
    var oc = vec4<f32>(0.0, 0.0, 0.0, -1.0);
    
    var mixFactor = historyPosition[coordIndex].w;
    
    if(bufferData.alpha >= 0.0 && bufferData.roughness < ssrUniform.roughnessThreshold){
      let roughness = clamp(bufferData.roughness, 0.0, 1.0);
      let prefilterColor = bufferData.skyColor;
      var ssrColor = textureLoad(colorMap, vec2<i32>(bufferData.hitCoord), 0);
      ssrColor.w = bufferData.alpha;
      oc = ssrColor;
    }
    let skyColor = vec4<f32>(bufferData.skyColor, 1.0);
    oc = mix(oc, skyColor, 1.0 - bufferData.alpha);
    
    let lastColor = ssrColorData[coordIndex];
    var newColor = mix(oc, lastColor, mixFactor);
    newColor.w = oc.w;
    
    ssrColorData[coordIndex] = newColor;
    
    textureStore(outTex, ssrBufferCoord , newColor);
  }
`



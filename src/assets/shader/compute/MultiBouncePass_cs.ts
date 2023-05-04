
export let MultiBouncePass_cs: string = /*wgsl*/ `
  #include "MathShader"
  #include "IrradianceVolumeData_frag"

  struct IrradianceField {
      probeStartPosition: vec4<f32>,
      probeCounts:vec4<f32>,
      probeStep:f32,
      irradianceTextureWidth:f32,
      irradianceTextureHeight:f32,
      irradianceProbeSideLength:f32,
  };

  @group(0) @binding(0) var outputBuffer : texture_storage_2d<rgba16float, write>;
  @group(0) @binding(1) var<storage,read> uniformData : IrradianceVolumeData ;

  @group(1) @binding(0) var normalMapSampler : sampler;
  @group(1) @binding(1) var normalMap : texture_2d<f32>;

  @group(1) @binding(2) var colorMapSampler : sampler;
  @group(1) @binding(3) var colorMap : texture_2d<f32>;

  @group(1) @binding(4) var litMapSampler : sampler;
  @group(1) @binding(5) var litMap : texture_2d<f32>;

  @group(1) @binding(6) var irradianceMapSampler : sampler;
  @group(1) @binding(7) var irradianceMap : texture_2d<f32>;

  var<private> wsn:vec3<f32>;
  var<private> ulitColor:vec4<f32>;
  var<private> litColor:vec4<f32>;
  var<private> irradianceFieldSurface : IrradianceField ;
  var<private> probeID:u32;

  var<private> quaternion:vec4<f32> = vec4<f32>(0.0, -0.7071067811865475, 0.7071067811865475, 0.0);

  fn getIrradianceFieldSurface() -> IrradianceField{
    let data = uniformData;
    irradianceFieldSurface.probeStartPosition = vec4<f32>(data.startX, data.startY, data.startZ, 0.0);
    irradianceFieldSurface.probeCounts = vec4<f32>(data.gridXCount, data.gridYCount, data.gridZCount, 0.0);
    irradianceFieldSurface.probeStep = data.ProbeSpace;
    irradianceFieldSurface.irradianceTextureWidth = data.OctRTMaxSize;
    irradianceFieldSurface.irradianceTextureHeight = data.OctRTMaxSize;
    irradianceFieldSurface.irradianceProbeSideLength = data.OctRTSideSize;
    return irradianceFieldSurface;
  }

  fn rotateDir(n:vec3<f32>) -> vec3<f32>{
     return normalize(applyQuaternion(-n, quaternion));
  }

  fn sampleLitColor(uv:vec2<i32>) -> vec4<f32>
  {
      var oc1:vec4<f32> = textureSampleLevel(litMap, litMapSampler, vec2<f32>(0.0), 0.0);
      var oc:vec4<f32> = textureLoad(litMap, uv, 0);
      return oc;
  }

  fn sampleNormal(uv:vec2<i32>) -> vec4<f32>
  {
      var oc1:vec4<f32> = textureSampleLevel(normalMap, normalMapSampler, vec2<f32>(0.0), 0.0);
      var oc:vec4<f32> = textureLoad(normalMap, uv, 0);
      return oc;
  }

  fn sampleColor(uv:vec2<i32>) -> vec4<f32>
  {
      var oc1:vec4<f32> = textureSampleLevel(colorMap, colorMapSampler, vec2<f32>(0.0), 0.0);
      var oc:vec4<f32> = textureLoad(colorMap, uv, 0);
      return oc;
  }

  fn sampleProbe(fragCoord:vec2<u32>){
    var uv = vec2<i32>(i32(fragCoord.x), i32(fragCoord.y)) ;

    litColor = sampleLitColor(uv);

    var normalMap = sampleNormal(uv);
    wsn = normalMap.xyz * 2.0 - 1.0;

    ulitColor = sampleColor(uv);
  }

  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain(@builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    getIrradianceFieldSurface();
    var fragCoord = vec2<u32>( globalInvocation_id.x, globalInvocation_id.y);
    probeID = globalInvocation_id.z;
    fragCoord = fragCoord + getCoordOffset(probeID);

    sampleProbe(fragCoord);

    let irradiance = getIrradianceColor();
    let result = blendIrradianceColor(irradiance);
    textureStore(outputBuffer, vec2<i32>(fragCoord), result);
  }

  fn blendIrradianceColor(irradiance:vec4<f32>) -> vec4<f32>{
     var bounceColor = irradiance * ulitColor;
     let bounceIntensity = getBounceIntensity(uniformData.bounceIntensity);
     let conservation1 = 1.0 / sqrt((1.0 + bounceIntensity * 0.55));
     let conservation2 = 1.0 / sqrt((1.0 + bounceIntensity));
     var result = litColor * conservation2 + bounceColor * sqrt(bounceIntensity) * conservation1;
     return vec4<f32>(result.xyz, litColor.w);
  }

  fn getBounceIntensity(intensity:f32) -> f32 {
    var value = clamp(intensity, 0.0, 1.0) * 10.0;
    return value;
  }

  fn getCoordOffset(id:u32) -> vec2<u32>{
      var fullCol = u32(uniformData.ProbeSourceTextureSize / uniformData.ProbeSize);
      var offsetSampleUv = vec2<u32>( (id / fullCol) * 6u , id % fullCol) * u32(uniformData.ProbeSize);
      return offsetSampleUv;
  }

  fn getIrradianceColor() -> vec4<f32>{
     var probeIrradiance: vec4<f32> = vec4<f32>(0.0);
     if(length(wsn) > 0.01){
       probeIrradiance = getIrrdiaceIndex(i32(probeID), wsn);
     }
     return probeIrradiance;
  }

  n getIrrdiaceIndex(index:i32, wsn:vec3<f32>) -> vec4<f32>{
    var wsN = rotateDir(wsn.xyz);
    var texCoord:vec2<f32> = textureCoordFromDirection(wsN,
      index,
      irradianceFieldSurface.irradianceTextureWidth,
      irradianceFieldSurface.irradianceTextureHeight,
      irradianceFieldSurface.irradianceProbeSideLength);

    var probeIrradiance: vec3<f32> = textureSampleLevel(irradianceMap, irradianceMapSampler, texCoord, 0.0).xyz;
    return vec4<f32>(probeIrradiance, 1.0);
  }

  fn textureCoordFromDirection(dir:vec3<f32>, probeIndex:i32, width:f32, height:f32, sideLength:f32) -> vec2<f32>
  {
      var uv = getWriteOctUVByID(dir, u32(probeIndex), sideLength) ;
      uv.x = uv.x / irradianceFieldSurface.irradianceTextureWidth;
      uv.y = uv.y / irradianceFieldSurface.irradianceTextureHeight;
      return uv ;
  }

  fn getWriteOctUVByID(dir:vec3<f32> , probeID:u32, size: f32) -> vec2<f32>
  {
      var blockCount = u32(irradianceFieldSurface.probeCounts.x * irradianceFieldSurface.probeCounts.z) ;
      var offsetX = (probeID % blockCount) % u32(irradianceFieldSurface.probeCounts.x) ;
      var offsetY = u32(irradianceFieldSurface.probeCounts.z - 1.0) - (probeID % blockCount) / u32(irradianceFieldSurface.probeCounts.x) ;
      var offsetZ = probeID / blockCount ;

      var pixelCoord = (( octEncode(dir) + 1.0 ) * 0.5) * vec2<f32>(size,size) ;

      var blockOffset = vec2<f32>(0.0);
      blockOffset.x = f32(offsetX) * size;
      blockOffset.y = f32(offsetY) * size + f32(offsetZ) * f32(irradianceFieldSurface.probeCounts.z) * size;

      let mapHeight = u32(irradianceFieldSurface.irradianceTextureHeight);
      var probeCounts:vec3<f32> = vec3<f32>(irradianceFieldSurface.probeCounts.xyz);

      var gridOffsetFrom = vec2<i32>(blockOffset) + 1;
      var gridOffsetTo = offsetByCol(gridOffsetFrom, size, mapHeight, probeCounts);

      pixelCoord = pixelCoord + vec2<f32>(gridOffsetTo - 1) + vec2<f32>(vec2<i32>(vec2<f32>(gridOffsetTo) / size) * 2);

      return pixelCoord + 1.0 ;
  }

  fn offsetByCol(pixelCoord0:vec2<i32>, octSideSize:f32, mapHeight:u32, counts:vec3<f32>) -> vec2<i32>
  {
    var pixelCoord = pixelCoord0;
    let blockSize:vec2<i32> = vec2<i32>(i32(octSideSize * counts.x),  i32(octSideSize * counts.z));
    let blockSizeYBorder:i32 = i32((octSideSize + 2.0) * counts.z);
    let blockMaxRowBorder:i32 = i32(mapHeight) / blockSizeYBorder;
    let pixelCountYMax:i32 = blockMaxRowBorder * i32(octSideSize * counts.z);
    let col:i32 = pixelCoord.y / pixelCountYMax;

    pixelCoord.x = col * i32(octSideSize * counts.x) + pixelCoord.x;
    pixelCoord.y = pixelCoord.y % pixelCountYMax;

    return pixelCoord;
  }
`

export let SSR_RayTrace_cs: string = /*wgsl*/ `
  #include "GlobalUniform"

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

  struct HitData{
    hitPos:vec3<f32>,
    hitNormal:vec3<f32>,
    fadeAlpha:vec4<f32>,
    hitCoord:vec2<i32>,
    hitResult:i32,
    hitSky:i32,
  };

  struct RayTraceRetData{
    skyColor:vec3<f32>,
    roughness:f32,

    hitCoord:vec2<f32>,
    alpha:f32,
    fresnel:f32,
  }

  @group(0) @binding(0) var<uniform> standUniform: GlobalUniform;
  @group(0) @binding(1) var<uniform> ssrUniform: SSRUniformData;
  @group(0) @binding(2) var<storage, read_write> rayTraceBuffer : array<RayTraceRetData>;
  @group(0) @binding(4) var<storage, read_write> historyPosition : array<vec4<f32>>;

  @group(0) @binding(5) var zBufferTexture : texture_2d<f32>;
  @group(0) @binding(6) var normalBufferTex : texture_2d<f32>;
  @group(0) @binding(7) var materialBufferTex : texture_2d<f32>;
  @group(0) @binding(8) var prefilterMapSampler: sampler;
  @group(0) @binding(9) var prefilterMap: texture_cube<f32>;

  var<private> rayOrigin: vec3<f32>;
  var<private> rayDirection: vec3<f32>;
  var<private> cameraPosition: vec3<f32>;
  var<private> reflectionDir: vec3<f32>;
  var<private> colorTexSize: vec2<i32>;
  var<private> fragCoordColor: vec2<i32>;
  var<private> ssrBufferCoord: vec2<i32>;
  var<private> ssrBufferSize: vec2<i32>;
  var<private> hitData: HitData;
  var<private> rayTraceRet: RayTraceRetData;
  var<private> worldPosition: vec3<f32>;
  var<private> worldNormal: vec3<f32>;
  var<private> roughness: f32;
  var<private> fresnel: f32;

  var<private> historyPos: vec3<f32>;
  var<private> coordIndex: i32;

  var <private> PI: f32 = 3.14159;

  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    ssrBufferCoord = vec2<i32>( globalInvocation_id.xy);
    ssrBufferSize = vec2<i32>(i32(ssrUniform.ssrBufferSizeX), i32(ssrUniform.ssrBufferSizeY));
    if(ssrBufferCoord.x >= ssrBufferSize.x || ssrBufferCoord.y >= ssrBufferSize.y){
        return;
    }
    coordIndex = ssrBufferCoord.x + ssrBufferCoord.y * ssrBufferSize.x;

    colorTexSize = vec2<i32>(i32(ssrUniform.colorMapSizeX), i32(ssrUniform.colorMapSizeY));
    fragCoordColor = convertColorCoordFromSSRCoord(ssrBufferCoord);

    hitData.fadeAlpha = vec4<f32>(0.0);
    hitData.hitCoord = vec2<i32>(0);
    hitData.hitResult = 0;
    hitData.hitNormal = vec3<f32>(0.0, 1.0, 0.0);
    hitData.hitSky = 1;

    worldPosition = textureLoad(zBufferTexture, fragCoordColor , 0).xyz;
    historyPos = historyPosition[coordIndex].xyz;
    
    var mixFactor = 0.2;
    if(length(historyPos - worldPosition) < ssrUniform.mixThreshold){
        mixFactor = 0.9;
    }
    historyPosition[coordIndex] = vec4<f32>(worldPosition, mixFactor);
    
    let normal_v4 = textureLoad(normalBufferTex, fragCoordColor , 0);
    worldNormal = normalize(vec3<f32>(normal_v4.xyz) * 2.0 - 1.0);
    let materialData = textureLoad(materialBufferTex, fragCoordColor , 0 );
    let roughness = materialData.g * (1.0 - materialData.b);
    fresnel = (1.0 - roughness) * ssrUniform.reflectionRatio;

    cameraPosition = vec3<f32>(standUniform.cameraWorldMatrix[3].xyz);
    rayOrigin = vec3<f32>(worldPosition.xyz);

    rayDirection = normalize(vec3<f32>(worldPosition.xyz - cameraPosition));
    
    var randomSeed = fract(ssrUniform.randomSeedX + worldPosition.x);
    rand_seed.x = randomSeed;
    rand_seed.y = fract(ssrUniform.randomSeedY + worldPosition.y + worldPosition.z);
    randomSeed = rand();
    
    let normalRandom = makeRandomDirection(worldNormal, u32(randomSeed * 256.0), 256, roughness);
    
    reflectionDir = normalize(reflect(rayDirection, normalRandom));

    if(normal_v4.w > 0.5 && roughness < ssrUniform.roughnessThreshold){
      let uvOrigin = vec2<f32>(f32(fragCoordColor.x), f32(fragCoordColor.y));
      let rayMarchPosition = rayOrigin + reflectionDir * 100.0;
      var uvRayMarch = standUniform.projMat * (standUniform.viewMat * vec4<f32>(rayMarchPosition, 1.0));
      var uvOffset = (vec2<f32>(uvRayMarch.xy / uvRayMarch.w) + 1.0) * 0.5;
      uvOffset.y = 1.0 - uvOffset.y;
      uvOffset = uvOffset * vec2<f32>(colorTexSize - 1) - uvOrigin;
      uvOffset = normalize(uvOffset);

      rayTrace(uvOffset);
      if(hitData.hitResult == 1){
          hidingArtifact();
          rayTraceRet.alpha = hitData.fadeAlpha.x * hitData.fadeAlpha.y * hitData.fadeAlpha.z * hitData.fadeAlpha.w;
          if(hitData.hitSky == 1){
            rayTraceRet.alpha = 0.0;
          }
      }else{
        rayTraceRet.alpha = 0.0;
      }
      rayTraceRet.skyColor = getSkyColor();
    }else{
      rayTraceRet.alpha = -1.0;
      rayTraceRet.skyColor = vec3<f32>(0.0);
    }

    rayTraceRet.roughness = roughness;
    rayTraceRet.fresnel = fresnel;
    rayTraceRet.hitCoord = vec2<f32>(hitData.hitCoord);

    let index:i32 = ssrBufferCoord.x + ssrBufferCoord.y * ssrBufferSize.x;
    rayTraceBuffer[index] = rayTraceRet;
  }

  fn makeRandomDirection(srcDirection:vec3<f32>, i:u32, SAMPLE_COUNT:u32, roughness:f32) -> vec3<f32>
  {
    var N: vec3<f32> = normalize(srcDirection);
    var Xi:vec2<f32> = hammersley(i, SAMPLE_COUNT);
    return ImportanceSampleGGX(Xi, N, roughness);
  }

  fn hammersley( i : u32 ,  N : u32 ) -> vec2<f32>
  {
    // Radical inverse based on http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
    var bits = (i << 16u) | (i >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    var rdi = f32(bits) * 2.3283064365386963e-10;
    return vec2<f32>(f32(i) /f32(N), rdi);
  }

  fn ImportanceSampleGGX( Xi:vec2<f32>, N:vec3<f32>, roughness:f32) ->vec3<f32>
  {
    var a = roughness*roughness;

    var phi = 2.0 * PI * Xi.x;
    var cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    var sinTheta = sqrt(1.0 - cosTheta*cosTheta);

    // from spherical coordinates to cartesian coordinates
    var H:vec3<f32>;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // from tangent-space vector to world-space sample vector
  var up:vec3<f32>;
    if(abs(N.z) < 0.999)
    {
        up = vec3<f32>(0.0, 0.0, 1.0);
    }
    else
    {
        up = vec3<f32>(1.0, 0.0, 0.0);
    }
  var tangent:vec3<f32>  = normalize(cross(up, N));
  var bitangent:vec3<f32> = cross(N, tangent);
  var sampleVec:vec3<f32> = tangent * H.x + bitangent * H.y + N * H.z;
  return normalize(sampleVec);
  }

  var<private> rand_seed :vec2<f32> = vec2<f32>(0.0);
  fn rand() -> f32 {
    rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
    rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
    return rand_seed.y;
  }

  fn getSkyColor() -> vec3<f32>{
    let calcRoughness = clamp(roughness, 0.0, 1.0);
    let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
    var prefilterColor = textureSampleLevel(prefilterMap, prefilterMapSampler, reflectionDir, calcRoughness * MAX_REFLECTION_LOD);
    return LinearToGammaSpace(vec3<f32>(prefilterColor.xyz)) * standUniform.skyExposure;
  }

  fn LinearToGammaSpace(linRGB: vec3<f32>) -> vec3<f32> {
      var linRGB1 = max(linRGB, vec3<f32>(0.0));
      linRGB1 = pow(linRGB1, vec3<f32>(0.4166666567325592));
      return max(((1.0549999475479126 * linRGB1) - vec3<f32>(0.054999999701976776)), vec3<f32>(0.0));
  }

  fn convertColorCoordFromSSRCoord(coord:vec2<i32>) -> vec2<i32>{
    let color_ssr_ratio = ssrUniform.colorMapSizeX / ssrUniform.ssrBufferSizeX;
    let targetCoord = vec2<f32>(coord) * color_ssr_ratio;
    return vec2<i32>(targetCoord);
  }

  fn hidingArtifact(){
    let texSizeF32 = vec2<f32>(f32(colorTexSize.x), f32(colorTexSize.y));
    let halfTexSizeF32 = texSizeF32 * 0.5;

    //near screen edge
    var distance2Center = abs(vec2<f32>(f32(hitData.hitCoord.x), f32(hitData.hitCoord.y)) - halfTexSizeF32);
    let halfEdgeSize:f32 = min(texSizeF32.x, texSizeF32.y) * clamp(0.01, ssrUniform.fadeEdgeRatio, 1.0) * 0.5;
    var distance2Edge = min(vec2<f32>(halfEdgeSize), halfTexSizeF32 - distance2Center);
    var ratioXY = distance2Edge / halfEdgeSize;
    hitData.fadeAlpha.x = sqrt(ratioXY.x * ratioXY.y);

    //back face hit
    var backFaceBias = max(0.0, dot(hitData.hitNormal, -reflectionDir));
    hitData.fadeAlpha.y = pow(backFaceBias, max(0.0001, ssrUniform.powDotRN));

    //screen distance ratio
    let maxLength = max(f32(colorTexSize.x), f32(colorTexSize.y)) * ssrUniform.rayMarchRatio;
    let screenPointer = hitData.hitCoord - fragCoordColor;
    var screenDistance = length(vec2<f32>(f32(screenPointer.x), f32(screenPointer.y)));
    screenDistance = clamp(screenDistance / maxLength, 0.0, 1.0);
    hitData.fadeAlpha.z = 1.0 - screenDistance;

    //position distance ratio
    var fadeDistance = length(vec3<f32>(hitData.hitPos - cameraPosition));
    var dFar = ssrUniform.fadeDistanceMax;
    var dNear = ssrUniform.fadeDistanceMin;
    dFar = max(1.0, dFar);
    dNear = clamp(dNear, 0.001, dFar - 0.001);
    fadeDistance = clamp(fadeDistance, dNear, dFar);
    fadeDistance = (fadeDistance - dNear) / (dFar - dNear);
    hitData.fadeAlpha.w = 1.0 - fadeDistance;
  }

  fn rayTrace(rayMarchDir:vec2<f32>){
    let stepLength = 4.0;
    let maxLength = max(f32(colorTexSize.x), f32(colorTexSize.y)) * ssrUniform.rayMarchRatio;
    for(var i:f32 = 1.0; i < maxLength; i = i + stepLength){
        let offsetFloat32 = i * rayMarchDir;
        var uv = fragCoordColor + vec2<i32>(i32(offsetFloat32.x), i32(offsetFloat32.y));
        let hitRet = rayInterestScene(uv);
        if(hitRet > 0){
          hitData.hitResult = hitRet;
          break;
        }
    }
    if(hitData.hitResult == 1){
        let fromUV = hitData.hitCoord;
        for(var i:f32 = -stepLength; i <= 0.0; i = i + 1.0){
          let offsetFloat32 = i * rayMarchDir;
          var uv = fromUV + vec2<i32>(i32(offsetFloat32.x), i32(offsetFloat32.y));
          let hitRet = rayInterestScene(uv);
          if(hitRet == 1){
            let WN = textureLoad(normalBufferTex, hitData.hitCoord , 0 );
            if(WN.w > 0.5){
                hitData.hitSky = 0;
            }
            let normal = vec3<f32>(WN.xyz) * 2.0 - 1.0;
            hitData.hitNormal = normalize(vec3<f32>(normal.xyz));
            break;
          }
        }
    }
  }

  fn rayInterestScene(uv:vec2<i32>) -> i32 {
    if(uv.x < 0 || uv.y < 0 || uv.x >= colorTexSize.x || uv.y >= colorTexSize.y){
      return 2;
    }else{
      let hitPos = textureLoad(zBufferTexture, uv , 0 );
      let testDir = normalize(vec3<f32>(hitPos.xyz - rayOrigin));
      let cosValue = dot(reflectionDir, testDir);

      if(cosValue > 0.9996){
        let cross1 = cross(reflectionDir, -rayDirection);
        let cross2 = cross(reflectionDir, testDir);
        if(dot(cross1, cross2) > 0.0){
          hitData.hitPos = vec3<f32>(hitPos.xyz);
          hitData.hitCoord = uv;
          return 1;
        }
      }
    }
    return 0;
  }
`



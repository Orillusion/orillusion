import { CSM } from "../../../../core/csm/CSM";

export let ShadowMapping_frag: string = /*wgsl*/ `
    #if USE_SHADOWMAPING
    @group(1) @binding(auto) var shadowMapSampler: sampler;
    @group(1) @binding(auto) var shadowMap: texture_depth_2d_array;
    #endif

    @group(1) @binding(auto) var pointShadowMapSampler: sampler;
    @group(1) @binding(auto) var pointShadowMap: texture_depth_cube_array;

    struct ShadowStruct{
      directShadowVisibility: array<f32, 8>,
      pointShadows: array<f32, 8>,
    }
    var<private> shadowStrut: ShadowStruct ;

    fn useShadow(){
        shadowStrut.directShadowVisibility = array<f32, 8>( 1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0) ;
        shadowStrut.pointShadows = array<f32, 8>( 1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0) ;
        directShadowMaping(globalUniform.shadowBias);
        pointShadowMapCompare(globalUniform.pointShadowBias);
    }

    fn calcBasicBias(shadowWorldSize:f32, shadowDepthTexSize:f32, near:f32, far:f32) -> f32{
      var bias = shadowWorldSize / shadowDepthTexSize;
      bias = bias / (far - near);
      return bias * 2.0;
    }

    const dirCount:i32 = 8 ;
    const pointCount:i32 = 8 ;
    const csmCount:i32 = ${CSM.Cascades} ;
    var<private> csmLevel:i32 = -1;
    fn directShadowMaping(shadowBias: f32)  {
      #if USE_SHADOWMAPING
        let enableCSM:bool = globalUniform.enableCSM > 0.5;
        for (var i: i32 = 0; i < dirCount ; i = i + 1) {
          if( i >= globalUniform.nDirShadowStart && i < globalUniform.nDirShadowEnd ){
            let ldx = globalUniform.shadowLights[u32(i) / 4u][u32(i) % 4u];
            let light = lightBuffer[u32(ldx)] ;
            var shadowIndex = i32(light.castShadow);
            var visibility = 1.0;
            var shadowMatrix:mat4x4<f32>;
            #if USE_CSM
              if(enableCSM && shadowIndex == 0){
                var totalWeight = 0.0;
                visibility = 0.0;
                var validCount = 0;
                for(var csm:i32 = 0; csm < csmCount; csm ++){
                  var csmShadowBias = globalUniform.csmShadowBias[csm];
                  shadowMatrix = globalUniform.csmMatrix[csm];
                  let csmShadowResult = directShadowMapingIndex(light, shadowMatrix, csm, csmShadowBias);
                  if(csmShadowResult.y < 0.5){
                    validCount ++;

                    var uv = 2.0 * csmShadowResult.zw - vec2<f32>(1.0);
                    uv = saturate(vec2<f32>(1.0) - abs(uv));
                    uv /= clamp(globalUniform.csmMargin, 0.01, 0.5);
                    var weight:f32 = min(uv.x, 1.0);
                    weight = min(weight, uv.y);

                    if(validCount == 1 && csm == csmCount - 1){
                      visibility = 1.0 - weight + csmShadowResult.x * weight;
                      totalWeight = 1.0;
                    }else{
                      weight *= 1.0 - totalWeight;
                      visibility += csmShadowResult.x * weight;
                      totalWeight += weight;
                    }
                    // if(weight < 1.0){
                    //   visibility += 0.1;
                    // }
                    if(validCount >= 2 || totalWeight >= 0.99){
                      csmLevel = csm;
                      break;
                    }
                  }
                }
                totalWeight += 0.0001;
                if(validCount == 0){
                  visibility = 1.0;
                }else{
                  visibility = visibility / totalWeight ;
                }
              }else{
                shadowMatrix = globalUniform.shadowMatrix[shadowIndex];
                if(enableCSM) {
                  shadowIndex += csmCount - 1;
                }
                visibility = directShadowMapingIndex(light, shadowMatrix, shadowIndex, shadowBias).x;
              }
            #else
              shadowMatrix = globalUniform.shadowMatrix[shadowIndex];
              visibility = directShadowMapingIndex(light, shadowMatrix, shadowIndex, shadowBias).x;
            #endif 
            shadowStrut.directShadowVisibility[i] = visibility;
          }
        }
      #endif
    }

    fn directShadowMapingIndex(light:LightData, matrix:mat4x4<f32>, depthTexIndex:i32, shadowBias:f32) -> vec4<f32>
    {
      var visibility = 1.0;
      var isOutSideArea:f32 = 1.0;
      var varying_shadowUV:vec2<f32> = vec2<f32>(0.0);
      #if USE_SHADOWMAPING
        var shadowPosTmp = matrix * vec4<f32>(ORI_VertexVarying.vWorldPos.xyz, 1.0);
        var shadowPos = shadowPosTmp.xyz / shadowPosTmp.w;
        varying_shadowUV = shadowPos.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
        if (varying_shadowUV.x <= 1.0
          && varying_shadowUV.x >= 0.0
          && varying_shadowUV.y <= 1.0
          && varying_shadowUV.y >= 0.0
          && shadowPosTmp.z <= 1.0
          && shadowPosTmp.z >= 0.0)
        {
          visibility = 0.0;
          isOutSideArea = 0.0;
          var uvOnePixel = 1.0 / vec2<f32>(globalUniform.shadowMapSize);
          var totalWeight = 0.0;
          var NoL = (dot(normalize(ORI_VertexVarying.vWorldNormal), normalize(-light.direction)));
          let v = max(NoL, 0.0) ;
          var bias = shadowBias / v;
          for (var y = -1; y <= 1; y++) {
            for (var x = -1; x <= 1; x++) {
              var offset = vec2<f32>(f32(x), f32(y)) * uvOnePixel;
              
              // visibility += textureSampleCompare(shadowMap, shadowMapSampler, varying_shadowUV + offset, depthTexIndex, shadowPos.z - bias);
              var depth = textureSampleLevel(shadowMap, shadowMapSampler, varying_shadowUV + offset, depthTexIndex, 0);
              if ((shadowPos.z - bias ) < depth) {
                visibility += 1.0 ;
              }
              totalWeight += 1.0;
            }
          }
          visibility /= totalWeight;
          visibility += 0.001;
        }
      #endif
      return vec4<f32>(visibility, isOutSideArea, varying_shadowUV);
    }

    fn pointShadowMapCompare(shadowBias: f32){
      let worldPos = ORI_VertexVarying.vWorldPos.xyz;
      let offset = 0.1;

      for (var i: i32 = 0; i < pointCount ; i = i + 1) {
        if( i >= globalUniform.nPointShadowStart && i < globalUniform.nPointShadowEnd ){
          let ldx = globalUniform.shadowLights[u32(i) / 4u][u32(i) % 4u];
          let light = lightBuffer[u32(ldx)] ;

          #if USE_SHADOWMAPING
              let lightPos = light.position.xyz;
              var shadow = 0.0;
              let frgToLight = worldPos - lightPos.xyz;
              var dir: vec3<f32> = normalize(frgToLight);
              var len = length(frgToLight);
              var bias = max(shadowBias * globalUniform.far * (1.0 - dot(ORI_ShadingInput.Normal, dir)), 0.005);
  
          #if USE_PCF_SHADOW
              let samples = 4.0;
              for (var x: f32 = -offset; x < offset; x += offset / (samples * 0.5)) {
                for (var y: f32 = -offset; y < offset; y += offset / (samples * 0.5)) {
                  for (var z: f32 = -offset; z < offset; z += offset / (samples * 0.5)) {
                    let offsetDir = normalize(dir.xyz + vec3<f32>(x, y, z));
                    var depth = textureSampleLevel(pointShadowMap, pointShadowMapSampler, offsetDir, light.castShadow, 0);
                    depth *= globalUniform.far;
                    if ((len - bias) > depth) {
                      shadow += 1.0 * dot(offsetDir, dir.xyz);
                    }
                  }
                }
              }
              shadow = min(max(shadow / (samples * samples * samples), 0.0), 1.0);
          #endif
  
          #if USE_SOFT_SHADOW
              let vDis = length(globalUniform.CameraPos.xyz - worldPos.xyz);
              let sampleRadies = globalUniform.shadowSoft;
              let samples = 20;
              for (var j: i32 = 0; j < samples; j += 1) {
                let offsetDir = normalize(dir.xyz + sampleOffsetDir[j] * sampleRadies);
                var depth = textureSampleLevel(pointShadowMap, pointShadowMapSampler, offsetDir, light.castShadow, 0);
                depth *= globalUniform.far;
                if ((len - bias) > depth) {
                  shadow += 1.0 * dot(offsetDir, dir.xyz);
                }
              }
              shadow = min(max(shadow / f32(samples), 0.0), 1.0);
          #endif
  
          #if USE_HARD_SHADOW
              var depth = textureSampleLevel(pointShadowMap, pointShadowMapSampler, dir.xyz, light.castShadow, 0);
              depth *= globalUniform.far;
              if ((len - bias) > depth) {
                shadow = 1.0;
              }
          #endif
              for (var j = 0; j < pointCount ; j+=1 ) {
                  if(i32(light.castShadow) == j){
                    shadowStrut.pointShadows[j] = 1.0 - shadow ;
                  }
              }
          #endif
        }
        }
    }

    #if USE_SOFT_SHADOW
      var<private>sampleOffsetDir : array<vec3<f32>, 20> = array<vec3<f32>, 20>(
        vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, -1.0, 1.0), vec3<f32>(-1.0, -1.0, 1.0), vec3<f32>(-1.0, 1.0, 1.0),
        vec3<f32>(1.0, 1.0, -1.0), vec3<f32>(1.0, -1.0, -1.0), vec3<f32>(-1.0, -1.0, -1.0), vec3<f32>(-1.0, 1.0, -1.0),
        vec3<f32>(1.0, 1.0, 0.0), vec3<f32>(1.0, -1.0, 0.0), vec3<f32>(-1.0, -1.0, 0.0), vec3<f32>(-1.0, 1.0, 0.0),
        vec3<f32>(1.0, 0.0, 1.0), vec3<f32>(-1.0, 0.0, 1.0), vec3<f32>(1.0, 0.0, -1.0), vec3<f32>(-1.0, 0.0, -1.0),
        vec3<f32>(0.0, 1.0, 1.0), vec3<f32>(0.0, -1.0, 1.0), vec3<f32>(0.0, -1.0, -1.0), vec3<f32>(0.0, 1.0, -1.0),
      );
    #endif
`



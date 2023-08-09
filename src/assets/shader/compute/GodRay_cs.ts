export let GodRay_cs: string = /*wgsl*/ `

    #include "GlobalUniform"
    struct LightData {
      index:f32,
      lightType:i32,
      radius:f32,
      linear:f32,
      
      position:vec3<f32>,
      lightMatrixIndex:f32,

      direction:vec3<f32>,
      quadratic:f32,

      lightColor:vec3<f32>,
      intensity:f32,

      innerCutOff :f32,
      outerCutOff:f32,
      range :f32,
      castShadow:i32,

      lightTangent:vec3<f32>,
      ies:f32,
    };

    struct Uniforms {
      matrix : array<mat4x4<f32>>
    };

    struct CacheGodRay {
      pos:vec3<f32>,
      value:f32,
    };

    struct GodRayUniform{
      intensity: f32,
      rayMarchCount: f32,
      viewPortWidth: f32,
      viewPortHeight: f32,

      blendColor: f32,
      scatteringExponent: f32,
    }

    @group(0) @binding(1) var<uniform> godRayUniform: GodRayUniform;
    @group(0) @binding(2) var posTex : texture_2d<f32>;
    @group(0) @binding(3) var normalTex : texture_2d<f32>;
    @group(0) @binding(4) var inTex : texture_2d<f32>;
    @group(0) @binding(5) var outTex : texture_storage_2d<rgba16float, write>;
    @group(0) @binding(6) var shadowMapSampler : sampler_comparison;
    @group(0) @binding(7) var shadowMap : texture_depth_2d_array;

    @group(1) @binding(0)
    var<storage,read> lightBuffer: array<LightData>;
    @group(1) @binding(1)
    var<storage, read> models : Uniforms;

    @group(2) @binding(0) var<storage, read_write> historyGodRayData: array<CacheGodRay>;

    var<private> viewDirection: vec3<f32> ;
    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> wPosition: vec3<f32>;
    var<private> wNormal: vec4<f32>;
    var<private> directLight: LightData;
  
    fn directionShadowMapping(worldPos:vec3<f32>, shadowBias:f32) -> f32 {
      var shadowPos = globalUniform.shadowMatrix[0] * vec4<f32>(worldPos.xyz, 1.0);
      var shadowUV = shadowPos.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5) ;
      var visibility = textureSampleCompareLevel( shadowMap, shadowMapSampler, shadowUV, 0, shadowPos.z - shadowBias );
      return visibility;
   }

    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );

      texSize = textureDimensions(inTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      wNormal = textureLoad(normalTex, fragCoord, 0);
      var oc = textureLoad(inTex, fragCoord, 0);
      var outColor = oc.xyz;
      directLight = lightBuffer[0] ;
      if(directLight.castShadow >= 0){
        let index = fragCoord.x + fragCoord.y * i32(texSize.x);
        var historyData = historyGodRayData[index];
        let lightColor = directLight.lightColor;
        
        var godRayFactor = 0.0;
        if(wNormal.w > 0.5){
          //not sky
          let lightPos = models.matrix[u32(directLight.lightMatrixIndex)][3].xyz;
          wPosition = textureLoad(posTex, fragCoord, 0).xyz;
          viewDirection = normalize(globalUniform.CameraPos - wPosition) ;
          godRayFactor = rayMarch();
          godRayFactor = updateGodRay(historyData, godRayFactor);
        }
        historyData.pos = wPosition;
        historyData.value = godRayFactor;
        historyGodRayData[index] = historyData;

        outColor = oc.xyz + vec3<f32>(godRayFactor * godRayUniform.intensity * lightColor);
      }
      textureStore(outTex, fragCoord , vec4<f32>(outColor, oc.w));
    }

    fn updateGodRay(historyData:CacheGodRay, newFactor:f32) -> f32 {
      var changeFactor = 0.2;
      if(length(historyData.pos - wPosition) > 0.01){
        changeFactor = 0.4;
      }
      var factor = mix(historyData.value, newFactor, changeFactor);
      
      let pixelOffset = 1 + i32(globalUniform.frame) % 3;
      let coordRange = vec2<i32>(texSize);
      let coordIndex0 = getCoordIndex(fragCoord.x + pixelOffset, fragCoord.y - pixelOffset, coordRange);
      let coordIndex1 = getCoordIndex(fragCoord.x - pixelOffset, fragCoord.y - pixelOffset, coordRange);
      let coordIndex2 = getCoordIndex(fragCoord.x, fragCoord.y + pixelOffset * 2, coordRange);

      let oldOC0 = historyGodRayData[coordIndex0].value;
      let oldOC1 = historyGodRayData[coordIndex1].value;
      let oldOC2 = historyGodRayData[coordIndex2].value;

      let opRound = (oldOC0 + oldOC1 + oldOC2) * 0.3333333;
      factor = mix(opRound, factor, 0.5);

      return factor;
    }

    fn getCoordIndex(x0:i32, y0:i32, size:vec2<i32>) -> i32{
      let x = clamp(x0, 0, size.x - 1);
      let y = clamp(y0, 0, size.y - 1);
      return y * size.x + x;
    }
    
    
    fn rayMarch() -> f32{
      var godRayFactor = 0.0;
      let L = normalize(directLight.direction);
      let rayMarchCount = godRayUniform.rayMarchCount;
      if(godRayUniform.blendColor > 0.5){
        let eyePosition = globalUniform.CameraPos;
        var samplePosition = eyePosition;
        var lastSamplePosition = eyePosition;
        
        var frameOffset = f32(i32(globalUniform.frame) % 4);
        frameOffset *= 0.25;

        for(var i:f32 = 1.0; i < rayMarchCount; i += 1.0){
          var t = (i + frameOffset) / rayMarchCount;
          lastSamplePosition = samplePosition;
          samplePosition = mix(eyePosition, wPosition, t * t);

          var shadowVisibility = directionShadowMapping(samplePosition, globalUniform.shadowBias);
          if(shadowVisibility > 0.5){
            var stepFactor = calcGodRayValue(samplePosition, L, viewDirection);
            stepFactor *= length(lastSamplePosition - samplePosition);
            godRayFactor += stepFactor;
          }
        }
        godRayFactor /= length(wPosition - eyePosition);
      }
      return godRayFactor;
    }

    fn calcGodRayValue(pos:vec3<f32>, L:vec3<f32>, V:vec3<f32>) -> f32{
      var halfLoV = normalize(L + V);
      var LoV = saturate(dot(V,halfLoV));
      LoV = pow(LoV, godRayUniform.scatteringExponent);
      var distance = length(pos - globalUniform.CameraPos) / (globalUniform.far);
      distance = 1.0 - saturate(distance);
      distance *= distance;
      return LoV * distance;
    }
  `
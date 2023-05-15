export let ShadowMapping_frag: string = /*wgsl*/ `
    #if USE_SHADOWMAPING
    @group(1) @binding(auto) var shadowMapSampler: sampler_comparison;
    @group(1) @binding(auto) var shadowMap: texture_depth_2d_array;
    #endif

    @group(1) @binding(auto) var pointShadowMapSampler: sampler;
    @group(1) @binding(auto) var pointShadowMap: texture_depth_cube_array;

            struct ShadowStruct{
      directShadowVisibility: array<f32, 8>,
        pointShadows: array<f32, 8>,
            }

    var<private>shadowStrut: ShadowStruct;

    struct ShadowBuffer{
      nDirShadowStart: i32,
      nDirShadowEnd: i32,
      nPointShadowStart: i32,
      nPointShadowEnd: i32,
      shadowLights:array<u32,16>
    }

    @group(2) @binding(5) var<storage,read> shadowBuffer: ShadowBuffer;

    fn directShadowMaping(shadowBias: f32)  {
        for (var i: i32 = shadowBuffer.nDirShadowStart; i < shadowBuffer.nDirShadowEnd ; i = i + 1) {
          let ldx = shadowBuffer.shadowLights[i];
          var light = lightBuffer[ldx];
          var shadowIndex = i32(light.castShadow);
          shadowStrut.directShadowVisibility[shadowIndex] = 1.0;
          #if USE_SHADOWMAPING
            var shadowPosTmp = globalUniform.shadowMatrix[shadowIndex] * vec4<f32>(ORI_VertexVarying.vWorldPos.xyz, 1.0);
            var shadowPos = shadowPosTmp.xyz / shadowPosTmp.w;
            var varying_shadowUV = shadowPos.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
            var bias = max(shadowBias * (1.0 - dot(ORI_ShadingInput.Normal, light.direction)), 0.000005);

            // if(varying_shadowUV.y>=1.0) {
            //     shadowStrut.directShadowVisibility[shadowIndex] = 2.0 ;
            //     continue;
            // }
            if (varying_shadowUV.x <= 1.0 && varying_shadowUV.x >= 0.0 && varying_shadowUV.y <= 1.0 && varying_shadowUV.y >= 0.0 && shadowPosTmp.z <= 1.0) {
              var texelSize = 1.0 / vec2<f32>(globalUniform.shadowMapSize);
              var oneOverShadowDepthTextureSize = texelSize;
              var size = 1;
              var sizeBlock = size * 2 + 1;
              var sizeBlockA = sizeBlock * sizeBlock;
              var visibility = 0.0;
              for (var y = -size; y <= size; y++) {
                for (var x = -size; x <= size; x++) {
                  var offset = vec2<f32>(f32(x), f32(y)) * oneOverShadowDepthTextureSize / f32(sizeBlock);
                  visibility += textureSampleCompare(
                    shadowMap,
                    shadowMapSampler,
                    varying_shadowUV + offset,
                    shadowIndex,
                    shadowPos.z - bias
                  );
                }
              }
              visibility /= f32(sizeBlockA);
              shadowStrut.directShadowVisibility[shadowIndex] = visibility + 0.001;
            }
          #endif
      }
    }

            fn pointShadowMapCompare(shadowBias: f32){
      let worldPos = ORI_VertexVarying.vWorldPos.xyz;
      let offset = 0.1;
      // let lightIndex = getCluster(ORI_VertexVarying.fragCoord);
      // let start = max(lightIndex.start, 0.0);
      // let count = max(lightIndex.count, 0.0);
      // let end = max(start + count, 0.0);

      for (var i: i32 = shadowBuffer.nPointShadowStart; i < shadowBuffer.nPointShadowEnd ; i = i + 1) {
        let ldx = shadowBuffer.shadowLights[i];
        let light = lightBuffer[ldx] ;
        shadowStrut.pointShadows[light.castShadow] = 1.0;

        #if USE_SHADOWMAPING
        let lightPos = models.matrix[u32(light.lightMatrixIndex)][3].xyz;
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
          let offsetDir = normalize(dir.xyz + sampleOffetDir[j] * sampleRadies);
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

        shadowStrut.pointShadows[light.castShadow] = 1.0 - shadow;
        #endif
      }
    }

    #if USE_SOFT_SHADOW
    var<private>sampleOffetDir : array<vec3<f32>, 20> = array<vec3<f32>, 20>(
      vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, -1.0, 1.0), vec3<f32>(-1.0, -1.0, 1.0), vec3<f32>(-1.0, 1.0, 1.0),
      vec3<f32>(1.0, 1.0, -1.0), vec3<f32>(1.0, -1.0, -1.0), vec3<f32>(-1.0, -1.0, -1.0), vec3<f32>(-1.0, 1.0, -1.0),
      vec3<f32>(1.0, 1.0, 0.0), vec3<f32>(1.0, -1.0, 0.0), vec3<f32>(-1.0, -1.0, 0.0), vec3<f32>(-1.0, 1.0, 0.0),
      vec3<f32>(1.0, 0.0, 1.0), vec3<f32>(-1.0, 0.0, 1.0), vec3<f32>(1.0, 0.0, -1.0), vec3<f32>(-1.0, 0.0, -1.0),
      vec3<f32>(0.0, 1.0, 1.0), vec3<f32>(0.0, -1.0, 1.0), vec3<f32>(0.0, -1.0, -1.0), vec3<f32>(0.0, 1.0, -1.0),
    );
    #endif
`



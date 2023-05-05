export let BxDF_frag: string = /*wgsl*/ `
  #include "Clearcoat_frag"
  #include "BRDF_frag"
  #include "MathShader"
  #include "FastMathShader"
  #include "Common_frag"
  #include "GlobalUniform"

  #include "PhysicMaterialUniform_frag"
  #include "NormalMap_frag"
  #include "LightingFunction_frag"
  #include "Irradiance_frag"
  #include "ColorUtil_frag"
  #include "BxdfDebug_frag"


 
  //ORI_ShadingInput
  fn initFragData() {
      fragData.Albedo = ORI_ShadingInput.BaseColor ;
      fragData.Ao = ORI_ShadingInput.AmbientOcclusion ; 
      fragData.Roughness = max(ORI_ShadingInput.Roughness,0.003) ; 
      fragData.Metallic = ORI_ShadingInput.Metallic ; 
      fragData.Emissive = ORI_ShadingInput.EmissiveColor.rgb ; 
      fragData.N = ORI_ShadingInput.Normal;
      fragData.V = normalize(globalUniform.cameraWorldMatrix[3].xyz - ORI_VertexVarying.vWorldPos.xyz) ;

      let R = 2.0 * dot( fragData.V , fragData.N ) * fragData.N - fragData.V ;
      fragData.R = R;//reflect( fragData.V , -fragData.N ) ;

      fragData.NoV = saturate(dot(fragData.N, fragData.V)) ;

      fragData.F0 = mix(vec3<f32>(0.04), fragData.Albedo.rgb, fragData.Metallic);
      
      fragData.F = computeFresnelSchlick(fragData.NoV, fragData.F0);
      fragData.KD = vec3<f32>(fragData.F) ;
      fragData.KS = vec3<f32>(0.0) ;

      fragData.Indirect = 0.0 ;
      fragData.Reflectance = 1.0 ;

      fragData.DiffuseColor = fragData.Albedo.rgb * (1.0 - fragData.Metallic);
      fragData.SpecularColor = mix(vec3<f32>(1.0), fragData.Albedo.rgb, fragData.Metallic);

      fragData.ClearcoatRoughness = 0.0 ;
      #if USE_CLEARCOAT_ROUGHNESS
        fragData.ClearcoatRoughness = getClearcoatRoughnees() ;
      #endif
  }

  fn BxDFShading(){
      initFragData();

      var color = vec3<f32>(0.0);

      let lightIndex = getCluster(ORI_VertexVarying.fragCoord);
      let start = max(lightIndex.start, 0.0);
      let count = max(lightIndex.count, 0.0);
      let end = max(start + count , 0.0);
      for(var i:i32 = i32(start) ; i < i32(end); i += 1 )
      {
        let light = getLight(i32(i));

        switch (light.lightType) {
          case PointLightType: {
              color += pointLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness , light ) ;
          }
          case DirectLightType: {
            color += directLighting( fragData.Albedo.rgb ,fragData.N,fragData.V,fragData.Roughness , light , globalUniform.shadowBias) ;
          }
          case SpotLightType: {
            color += spotLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness , light ) ;
          }
          default: {
          }
        }
      }

      var kS = FresnelSchlickRoughness(fragData.NoV, fragData.F0, fragData.Roughness );
      var kD = vec3(1.0) - kS;
      kD = kD * (1.0 - fragData.Metallic);
      kD = max(vec3<f32>(0.04),kD) ;

      let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
      var diffuseIrradiance: vec3<f32> = vec3<f32>(0.0);//

      #if USE_SKYLIGHT
          var prefilterTex: vec3<f32> = globalUniform.skyExposure * (textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 8.0 ).rgb);
          prefilterTex = LinearToGammaSpace(prefilterTex);
          var skyLight = kD * fragData.Albedo.xyz * prefilterTex;
          // color += skyLight ;
      #endif

      var envRef = kS * approximateSpecularIBL( fragData.SpecularColor , fragData.Roughness , fragData.R ) ;//* (materialUniform.ior - 1.0) ;
      
      var irradiance = diffuseIrradiance ;
      #if USEGI
          irradiance += getIrradiance().rgb ;
      #else
          irradiance += LinearToGammaSpace(globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);
      #endif

      fragData.Irradiance = irradiance;


      var diffuseIBL = fragData.Albedo.rgb * irradiance.rgb ;
      // var ambientIBL = kD * fragData.Albedo.rgb * fragData.Ao;
      fragData.EnvColor = materialUniform.envIntensity * envRef  ;

      ORI_FragmentOutput.color = vec4<f32>(0.0);

      #if USE_CLEARCOAT
          for(var i:i32 = i32(start) ; i < i32(end); i = i + 1 )
          {
              let light = getLight(i);
              switch (light.lightType) {
                  case PointLightType: {
                      color += pointLighting(fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness , light ) ;
                  }
                  case DirectLightType: {
                      color += directLighting( fragData.Albedo.rgb ,fragData.N,fragData.V,fragData.Roughness , light , globalUniform.shadowBias) ;
                  }
                  case SpotLightType: {
                      color += spotLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness , light ) ;
                  }
                  default: {
                  }
              }
          }
      #endif
    
      // // Using stripped down, 'pure log', formula. Parameterized by grey points and dynamic range covered.
      #if USEGBUFFER
          var normal_rgba8unorm = (ORI_VertexVarying.vWorldNormal + 1.0) * 0.5;
          normal_rgba8unorm = clamp(normal_rgba8unorm, vec3<f32>(0.0), vec3<f32>(1.0));
      #endif
      
      // ORI_FragmentOutput.color = vec4<f32>(ORI_FragmentOutput.color.xyz,fragData.Albedo.a) ;
      #if USE_WORLDPOS
          ORI_FragmentOutput.worldPos = vec4<f32>(ORI_VertexVarying.vWorldPos.xyzw);
      #endif

      #if USEGBUFFER
          ORI_FragmentOutput.worldNormal = vec4<f32>(normal_rgba8unorm,1.0);
          ORI_FragmentOutput.material = vec4<f32>(1.0,fragData.Roughness,fragData.Metallic,1.0);
      #endif
      
      // color = pow(color.rgb,vec3<f32>(2.0));

      color += diffuseIBL ;
      // color += ambientIBL ;
      color += fragData.EnvColor * fragData.Ao ;
      color += fragData.Emissive.xyz ;

      //-1 1
      // color = diffuseIBL ;
      ORI_FragmentOutput.color = vec4<f32>(color.rgb,fragData.Albedo.a) ;

      // let gamma = 2.0 ;
      // ORI_FragmentOutput.color = pow(ORI_FragmentOutput.color,vec4(gamma,gamma,gamma,1.0));
  }
  `


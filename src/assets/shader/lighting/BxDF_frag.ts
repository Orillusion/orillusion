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
      fragData.Roughness = clamp(ORI_ShadingInput.Roughness,0.003,1.0) ; 
      fragData.Metallic = ORI_ShadingInput.Metallic ; 
      fragData.Emissive = ORI_ShadingInput.EmissiveColor.rgb ; 
      fragData.N = ORI_ShadingInput.Normal;
      let viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;
      fragData.V = viewDir ;
    //   fragData.V = normalize(globalUniform.cameraWorldMatrix[3].xyz - ORI_VertexVarying.vWorldPos.xyz) ;

      let R = 2.0 * dot( fragData.V , fragData.N ) * fragData.N - fragData.V ;
      fragData.R = R ;//reflect( fragData.V , fragData.N ) ;

      fragData.NoV = saturate(dot(fragData.N, fragData.V)) ;

      fragData.F0 = mix(vec3<f32>(materialUniform.materialF0.rgb), fragData.Albedo.rgb, fragData.Metallic);
      
      fragData.F = computeFresnelSchlick(fragData.NoV, fragData.F0);
      fragData.KD = vec3<f32>(fragData.F) ;
      fragData.KS = vec3<f32>(0.0) ;

      fragData.Indirect = 0.0 ;
      fragData.Reflectance = 1.0 ;

      fragData.DiffuseColor = fragData.Albedo.rgb * (1.0 - fragData.Metallic);
      fragData.SpecularColor = mix(vec3<f32>(1.0), fragData.Albedo.rgb, fragData.Metallic);

      fragData.ClearcoatRoughness = materialUniform.clearcoatRoughnessFactor ;
      #if USE_CLEARCOAT_ROUGHNESS
        fragData.ClearcoatRoughness = getClearcoatRoughnees() * materialUniform.clearcoatRoughnessFactor;
      #endif
  }

  fn BxDFShading(){
      initFragData();

      var irradiance = vec3<f32>(0.0) ;
      #if USEGI
          irradiance += getIrradiance().rgb ;
      #else
          let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
          irradiance += LinearToGammaSpace(globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);
      #endif

      //***********lighting-PBR part********* 
      var specColor = vec3<f32>(0.0) ;
      let lightIndex = getCluster(ORI_VertexVarying.fragCoord);
      let start = max(lightIndex.start, 0.0);
      let count = max(lightIndex.count, 0.0);
      let end = max(start + count , 0.0);
      for(var i:i32 = i32(start) ; i < i32(end); i += 1 )
      {
        let light = getLight(i32(i));

        switch (light.lightType) {
          case PointLightType: {
            specColor += pointLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness,fragData.Metallic,light) ;
          }
          case DirectLightType: {
            specColor += directLighting( fragData.Albedo.rgb ,fragData.N,fragData.V,fragData.Roughness ,fragData.Metallic, light , globalUniform.shadowBias) ;
          }
          case SpotLightType: {
            specColor += spotLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness,fragData.Metallic , light ) ;
          }
          default: {
          }
        }
      }
      //***********lighting-PBR part********* 
      var F = FresnelSchlickRoughness(fragData.NoV, fragData.F0, fragData.Roughness);
      var kS = F;
      var kD = vec3(1.0) - kS;
      kD = kD * (1.0 - fragData.Metallic);
      let env =  materialUniform.envIntensity * approximateSpecularIBL( F , fragData.Roughness , fragData.R ) ;

      //***********indirect-specular part********* 
      var surfaceReduction = 1.0/(fragData.Roughness*fragData.Roughness+1.0);            //压暗非金属的反射
      var oneMinusReflectivity = materialUniform.materialF0.a - materialUniform.materialF0.a * fragData.Metallic ;
      var grazingTerm= clamp((1.0 - fragData.Roughness ) + (1.0 - oneMinusReflectivity),0.0,1.0);
      var t = pow5(1.0-fragData.NoV);
      var fresnelLerp = mix(fragData.F0,vec3<f32>(grazingTerm),t);                   //控制反射的菲涅尔和金属色
      var iblSpecularResult = surfaceReduction*env*fresnelLerp ;
      //***********indirect-specular part********* 
      
      //***********indirect-ambient part********* 
      var kdLast = (1.0 - F) * (1.0 - fragData.Metallic);                   //压暗边缘，边缘处应当有更多的镜面反射
      var iblDiffuseResult = irradiance * kdLast * fragData.Albedo.rgb ;
      //***********indirect-ambient part********* 
      let sunLight = lightBuffer[0] ;
      var indirectResult = (iblSpecularResult + iblDiffuseResult) * fragData.Ao * sunLight.quadratic ;


      ORI_FragmentOutput.color = vec4<f32>(0.0);

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
      
      var color = specColor + indirectResult ;
      color += fragData.Emissive.xyz ;

      var clearCoatColor = vec3<f32>(0.0);
      #if USE_CLEARCOAT
        let clearCoatBaseColor = vec3<f32>(1.0) * materialUniform.baseColor.rgb ;
        for(var i:i32 = i32(start) ; i < i32(end); i = i + 1 )
        {
            let light = getLight(i32(i));
            switch (light.lightType) {
                case PointLightType: {
                  clearCoatColor += pointLighting( clearCoatBaseColor ,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.ClearcoatRoughness , 0.0, light ) ;
                }
                case DirectLightType: {
                  clearCoatColor += directLighting( clearCoatBaseColor ,fragData.N,fragData.V,fragData.ClearcoatRoughness ,0.0,light , globalUniform.shadowBias) ;
                }
                case SpotLightType: {
                  clearCoatColor += spotLighting( clearCoatBaseColor,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.ClearcoatRoughness ,0.0, light ) ;
                }
                default: {
                }
            }
        }
        clearCoatColor += approximate_coating(color,clearCoatColor,-fragData.N,fragData.V,sunLight);
        // clearCoatColor /= fragData.Albedo.a ;
        color += clearCoatColor.rgb ; 
      #endif
   
      ORI_FragmentOutput.color = vec4<f32>(LinearToGammaSpace(color.rgb),fragData.Albedo.a) ;
      // ORI_FragmentOutput.color = vec4<f32>(vec3<f32>(clearCoatColor),fragData.Albedo.a) ;
  }

  fn clearCoat(){
   
  }
  `


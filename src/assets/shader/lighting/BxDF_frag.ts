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
      fragData.Ao = clamp( pow(ORI_ShadingInput.AmbientOcclusion,materialUniform.ao) , 0.0 , 1.0 ) ; 
      fragData.Roughness = clamp((ORI_ShadingInput.Roughness),0.003,1.0) ; 
      fragData.Metallic = ORI_ShadingInput.Metallic ; 
      fragData.Emissive = ORI_ShadingInput.EmissiveColor.rgb ; 
      fragData.N = ORI_ShadingInput.Normal;
      let viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;
      fragData.V = viewDir ;

      #if USE_TANGENT
        fragData.T = ORI_VertexVarying.TANGENT.xyz * ORI_VertexVarying.TANGENT.w ;
      #endif
 
      let R = 2.0 * dot( fragData.V , fragData.N ) * fragData.N - fragData.V ;
      fragData.R = R ;//reflect( fragData.V , fragData.N ) ;

      fragData.NoV = saturate(dot(fragData.N, fragData.V)) ;

      fragData.F0 = mix(vec3<f32>(materialUniform.specularColor.rgb), fragData.Albedo.rgb, fragData.Metallic);
      
      fragData.F = computeFresnelSchlick(fragData.NoV, fragData.F0);
      fragData.KD = vec3<f32>(fragData.F) ;
      fragData.KS = vec3<f32>(0.0) ;

      fragData.Indirect = 0.0 ;
      fragData.Reflectance = 1.0 ;

      fragData.ClearcoatRoughness = materialUniform.clearcoatRoughnessFactor ;
      #if USE_CLEARCOAT_ROUGHNESS
        fragData.ClearcoatRoughness = getClearcoatRoughness() * materialUniform.clearcoatRoughnessFactor;
      #endif
  }

  fn BxDFShading(){
      initFragData();

      var irradiance = vec3<f32>(0.0) ;
      #if USEGI
          irradiance += getIrradiance().rgb ;
      #else
          let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
          irradiance += (globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);
      #endif
      irradiance = LinearToGammaSpace(irradiance.rgb);
      fragData.Irradiance = irradiance.rgb ;


      //***********lighting-PBR part********* 
      var specColor = vec3<f32>(0.0) ;
      let lightIndex = getCluster();
      let start = max(lightIndex.start, 0.0);
      let count = max(lightIndex.count, 0.0);
      let end = max(start + count , 0.0);
      for(var i:i32 = i32(start) ; i < i32(end); i += 1 )
      {
          let light = getLight(i32(i));
          switch (light.lightType) {
            case PointLightType: {
              specColor += pointLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness,fragData.Metallic,light) ;
              break;
            }
            case DirectLightType: {
              specColor += directLighting( fragData.Albedo.rgb ,fragData.N,fragData.V,fragData.Roughness ,fragData.Metallic, light , globalUniform.shadowBias) ;
              break;
            }
            case SpotLightType: {
              specColor += spotLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness,fragData.Metallic , light ) ;
              break;
            }
            default: {
              break;
            }
          }
      }

      fragData.LightChannel = specColor ;

      let sunLight = lightBuffer[0] ;
      //***********lighting-PBR part********* 
      var F = FresnelSchlickRoughness(fragData.NoV, fragData.F0, fragData.Roughness);
      var kS = F;
      var kD = vec3(1.0) - kS;
      kD = kD * (1.0 - fragData.Metallic);
      let envIBL =  materialUniform.envIntensity * approximateSpecularIBL( F , fragData.Roughness , fragData.R , fragData.NoV ) ;
      fragData.EnvColor = envIBL ;
      //***********indirect-specular part********* 
      
      var surfaceReduction = 1.0/(fragData.Roughness*fragData.Roughness+1.0);   
      var oneMinusReflectivity = oneMinusReflectivity(fragData.Metallic , materialUniform.materialF0.r );
      var grazingTerm = clamp((1.0 - fragData.Roughness ) + (1.0 - oneMinusReflectivity),0.0,1.0);
      var t = pow5(fragData.NoV);
      var fresnelLerp = FresnelLerp(fragData.NoV,fragData.F0.rgb,vec3<f32>(grazingTerm)) ;   
      var iblSpecularResult = surfaceReduction * fragData.EnvColor * fresnelLerp + envIBL;
      iblSpecularResult *= max(sunLight.quadratic,0.05) ;
      //***********indirect-specular part********* 
      
      //***********indirect-ambient part********* 
      var kdLast = (1.0 - 0.04) * (1.0 - fragData.Metallic);    
      //  Dim the edges, there should be more specular reflection at the edges
      var iblDiffuseResult = irradiance * vec3f(kdLast) * fragData.Albedo.rgb ;
      //irradiance
      //***********indirect-ambient part********* 
      var indirectResult = (iblSpecularResult + iblDiffuseResult) * fragData.Ao * max(sunLight.quadratic,0.05);
      // debugOut = vec4f(iblDiffuseResult,1.0);

      ORI_FragmentOutput.color = vec4<f32>(0.0);

      // Using stripped down, 'pure log', formula. Parameterized by grey points and dynamic range covered.
      #if USEGBUFFER
          var normal_rgba8unorm = (ORI_VertexVarying.vWorldNormal + 1.0) * 0.5;
          ORI_FragmentOutput.worldNormal = vec4<f32>(normal_rgba8unorm,1.0);
          ORI_FragmentOutput.material = vec4<f32>(1.0,fragData.Roughness,fragData.Metallic,1.0);
      #endif
      
      // ORI_FragmentOutput.color = vec4<f32>(ORI_FragmentOutput.color.xyz,fragData.Albedo.a) ;
      #if USE_WORLDPOS
          ORI_FragmentOutput.worldPos = vec4<f32>(ORI_VertexVarying.vWorldPos.xyzw);
          // ORI_FragmentOutput.worldPos = vec4<f32>(0.0,0.0,1.0,1.0);
      #endif
      
      var color = specColor + indirectResult ;

      var clearCoatColor = vec3<f32>(0.0);
      #if USE_CLEARCOAT
        let clearCoatBaseColor = vec3<f32>(1.0) * materialUniform.baseColor.rgb ;
        let clearNormal = fragData.N ;
        let clearcoatRoughness = fragData.ClearcoatRoughness ;
        let att = sunLight.intensity / LUMEN ;
        let clearCoatLayer = ClearCoat_BRDF( color , materialUniform.clearcoatColor.rgb , materialUniform.ior , clearNormal , -sunLight.direction ,-fragData.V , materialUniform.clearcoatWeight , clearcoatRoughness , att );
        color = vec3<f32>(clearCoatLayer.rgb/fragData.Albedo.a) ; 
      #endif
      
      var retColor = (LinearToGammaSpace(color.rgb));
      retColor += fragData.Emissive.xyz ;
      ORI_FragmentOutput.color = vec4<f32>( retColor.rgb * fragData.Albedo.a ,fragData.Albedo.a) ;
  }

  `


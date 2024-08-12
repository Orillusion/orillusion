import { SHCommon_frag } from './../core/common/SHCommon_frag';
/**
 * @internal
 */
export let BxDF_frag: string = /*wgsl*/ `
  #include "Clearcoat_frag"
  #include "BRDF_frag"
  #include "MathShader"
  #include "FastMathShader"
  #include "BitUtil"
  #include "Common_frag"
  #include "GlobalUniform"
  #include "SHCommon_frag"

  #include "PhysicMaterialUniform_frag"
  #include "NormalMap_frag"
  #include "LightingFunction_frag"
  #include "Irradiance_frag"
  #include "ColorUtil_frag"
  #include "BxdfDebug_frag"
  #include "ReflectionCG"
 
  //ORI_ShadingInput
  fn initFragData() {
      // fragData.Albedo = vec4f(gammaToLiner(ORI_ShadingInput.BaseColor.rgb),ORI_ShadingInput.BaseColor.w) ;
      fragData.Albedo = vec4f((ORI_ShadingInput.BaseColor.rgb),ORI_ShadingInput.BaseColor.w) ;
      fragData.Ao = clamp( pow(ORI_ShadingInput.AmbientOcclusion,materialUniform.ao) , 0.0 , 1.0 ) ; 
      fragData.Roughness = clamp((ORI_ShadingInput.Roughness),0.0001,1.0) * 1.85 ; 
      fragData.Metallic = ORI_ShadingInput.Metallic ; 
      fragData.Emissive = gammaToLiner(ORI_ShadingInput.EmissiveColor.rgb) * materialUniform.emissiveIntensity ; 
      fragData.N = ORI_ShadingInput.Normal;
      let viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;
      fragData.V = viewDir ;

      #if USE_TANGENT
        fragData.T = ORI_VertexVarying.TANGENT.xyz * ORI_VertexVarying.TANGENT.w ;
      #endif
 
      let R = 2.0 * dot( fragData.V , fragData.N ) * fragData.N - fragData.V ;
      fragData.R = R ;//reflect( fragData.V , fragData.N ) ;

      fragData.NoV = saturate(dot(fragData.N, fragData.V)) ;

      fragData.F0 = mix(vec3<f32>(0.04), fragData.Albedo.rgb , fragData.Metallic);
      // fragData.F0 = gammaToLiner(fragData.F0);
      
      fragData.F = computeFresnelSchlick(fragData.NoV, fragData.F0);
      fragData.KD = vec3<f32>(fragData.F) ;
      fragData.KS = vec3<f32>(0.0) ;

      fragData.Indirect = 0.0 ;
      fragData.Reflectance = 1.0 ;

      fragData.ClearcoatRoughness = materialUniform.clearcoatRoughnessFactor ;
      fragData.ClearcoatIor = materialUniform.clearcoatIor ;
      fragData.ClearcoatFactor = materialUniform.clearcoatFactor;
        
      #if USE_CLEARCOAT_ROUGHNESS
        fragData.ClearcoatRoughness *= getClearcoatRoughness() ;
        fragData.ClearcoatFactor *= getClearcoatWeight() ;
      #endif
  }

  fn BxDFShading(){
      initFragData();

      let sunLight = lightBuffer[0] ;

      var irradiance = vec3<f32>(0.0) ;
      #if USEGI
          irradiance += getIrradiance().rgb ;
      #else
          let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
          #if USE_CASTREFLECTION
              irradiance += globalUniform.hdrExposure * (globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);
          #else
              useSphereReflection();
              irradiance = getReflectionsEnv(fragData.N,ORI_VertexVarying.vWorldPos.xyz,1.0) ;
          #endif
       #endif
      fragData.Irradiance = irradiance.rgb ;

      //***********lighting-PBR part********* 
      var F = FresnelSchlickRoughness(fragData.NoV, fragData.Albedo.rgb , fragData.Roughness);
      var kS = F;
      var kD = vec3(1.0) - kS;
      kD = kD * (1.0 - fragData.Metallic);
      //***********lighting-PBR part********* 
      
      //***********indirect-specular part********* 
      var surReduction = 1.0/(fragData.Roughness * fragData.Roughness + 1.0);
      var grazingTerm = saturate(1.0 - fragData.Roughness + kD);
      var surfaceReduction = 1.0 / (pow(fragData.Roughness,2.0) + 1.0);
      var fresnelLerp = FresnelLerp(fragData.NoV,fragData.F0.rgb,vec3<f32>(grazingTerm)) ;  
      var iblSpecularResult = fresnelLerp * surReduction ;
      //***********indirect-specular part********* 

      //***********lighting-PBR part********* 
      var diffuseColor = mix(fragData.Albedo.rgb,vec3f(0.04),fragData.Metallic);
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
              specColor += pointLighting(ORI_VertexVarying.vWorldPos.xyz, light ,iblSpecularResult) ;
              break;
            }
            case DirectLightType: {
              specColor += directLighting(light,iblSpecularResult);
              // specColor = iblSpecularResult;
              break;
            }
            case SpotLightType: {
              specColor += spotLighting( ORI_VertexVarying.vWorldPos.xyz, light ,iblSpecularResult) ;
              break;
            }
            default: {
              break;
            }
          }
      }

      //***********indirect-ambient part********* 
      // var kdLast = (1.0 - 0.04) * (1.0 - fragData.Metallic);    
      var iblDiffuseResult : vec3f ;

      let MAX_LOD  = i32(textureNumLevels(prefilterMap)) ;
      let mip = roughnessToMipmapLevel(fragData.Roughness,MAX_LOD) * f32(MAX_LOD) * 0.5;
    
      var indirectionDiffuse = indirectionDiffuse_Function(fragData.NoV,fragData.N,fragData.Metallic,fragData.Albedo.rgb,fragData.Roughness,fragData.Ao,fragData.F0);
      iblDiffuseResult += indirectionDiffuse / 3.14;

      var indirectionSpec    = indirectionSpec_Function(fragData.R,fragData.Roughness,fragData.NoV,fragData.Ao,gammaToLiner(fragData.F0));
      #if USE_CASTREFLECTION
        indirectionSpec *= globalUniform.hdrExposure ;
      #endif

      var color = vec3f(iblDiffuseResult + indirectionSpec + specColor)  ;
      // var color = vec3f(indirectionDiffuse )  ;

      var clearCoatColor = vec3<f32>(0.0);
      #if USE_CLEARCOAT
        let clearCoatBaseColor = vec3<f32>(1.0) * materialUniform.baseColor.rgb ;
        let clearNormal = fragData.N ;
        let clearcoatRoughness = fragData.ClearcoatRoughness ;
           
        for(var i:i32 = i32(start) ; i < i32(end); i += 1 )
        {
            let light = getLight(i32(i));
            switch (light.lightType) {
              case PointLightType: {
                var lightColor = light.lightColor.rgb  ;
                var att = pointAtt(ORI_VertexVarying.vWorldPos.xyz, light);
                clearCoatColor += ClearCoat_BRDF( color , materialUniform.clearcoatColor.rgb , fragData.ClearcoatIor , clearNormal ,  light.direction , fragData.V , clearcoatRoughness , lightColor,  att );
                break;
              }
              case DirectLightType: {
                var lightColor = getHDRColor( light.lightColor.rgb , light.linear )  ;
                var att = max(0.0,light.intensity);
                clearCoatColor += ClearCoat_BRDF( color , materialUniform.clearcoatColor.rgb , fragData.ClearcoatIor , clearNormal ,  light.direction , fragData.V , clearcoatRoughness , lightColor,  att );
                break;
              }
              case SpotLightType: {
                // var lightColor = light.lightColor.rgb  ;
                // var att = pointAtt(ORI_VertexVarying.vWorldPos.xyz, light);
                // clearCoatColor += ClearCoat_BRDF( color , materialUniform.clearcoatColor.rgb , 1.5 , clearNormal ,  light.direction , fragData.V , clearcoatRoughness , lightColor,  att );
                break;
              }
              default: {
                break;
              }
            }
        }
       
        color = clearCoatColor ;
      #endif
      
        var retColor = (LinearToGammaSpace(color.rgb));
        retColor += fragData.Emissive.xyz ;

        var viewColor = vec4<f32>( retColor.rgb * fragData.Albedo.w, fragData.Albedo.a) ;

        let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        let ORI_NORMALMATRIX = transpose(inverse( nMat ));

        var vNormal = ORI_VertexVarying.vWorldNormal.rgb ;

        let gBuffer = packNHMDGBuffer(
          ORI_VertexVarying.fragCoord.z,
          fragData.Albedo.rgb,
          viewColor.rgb,
          vec3f(fragData.Roughness,fragData.Metallic,fragData.Ao),
          vNormal,
          fragData.Albedo.a
        ) ;

        #if USE_CASTREFLECTION
          ORI_FragmentOutput.gBuffer = gBuffer ;
        #else
          ORI_FragmentOutput.gBuffer = gBuffer ;
          ORI_FragmentOutput.color = viewColor ;
        #endif
  }

  `


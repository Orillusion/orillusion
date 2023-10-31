export let Hair_frag: string = /*wgsl*/ `
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

  struct FHairTransmittanceData{
    bUseBacklit:bool,
    bUseSeparableR:bool,
    bUseLegacyAbsorption:bool
  };
 
  //ORI_ShadingInput
  fn initFragData() {
      fragData.Albedo = ORI_ShadingInput.BaseColor ;
      fragData.Ao = clamp( pow(ORI_ShadingInput.AmbientOcclusion,materialUniform.ao) , 0.0 , 1.0 ) ; 
      fragData.Roughness = ORI_ShadingInput.Roughness ; 
      fragData.Metallic = ORI_ShadingInput.Metallic ; 
      fragData.Emissive = ORI_ShadingInput.EmissiveColor.rgb ; 
      fragData.Specular = vec3f(materialUniform.specularColor.rgb) ; 
      fragData.N = ORI_ShadingInput.Normal;
      let viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz ) ;
      fragData.V = viewDir ;
      fragData.Ao = materialUniform.ao ;
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
  }

  

  fn transformHairNormal(normal : vec3<f32>) -> vec3<f32>{
      var face = 1.0 ;
      if(ORI_VertexVarying.face){
          face = 1.0 ;
      }else{
          face = -1.0 ;
      }
      #if USE_TANGENT
        let T = ORI_VertexVarying.TANGENT.xyz;
        let N = ORI_VertexVarying.vWorldNormal ;
        let B = cross(T,N) * ORI_VertexVarying.TANGENT.w * face;
        let mat3 = mat3x3<f32>(T,B,N);
        let n = mat3 * normal;
        return n ;
      #else
        return normal ;
      #endif
  }


  fn Hair_g( B:f32 ,  Theta:f32 ) -> f32
  {
      return exp(-0.5 * pow2(Theta) / (B * B)) / (sqrt(2 * PI) * B);
  }

  fn Hair_F( CosTheta:f32 )-> f32
  {
      let n = 1.55;
      let F0 = pow2((1.0 - n) / (1.0 + n));
      return F0 + (1.0 - F0) * pow5(1.0 - CosTheta);
  }

  fn HairColorToAbsorption( C:vec3f ,  B:f32 ) -> vec3f
  {
      let b2 = B * B;
      let b3 = B * b2;
      let b4 = b2 * b2;
      let b5 = B * b4;
      let D = (5.969 - 0.215 * B + 2.532 * b2 - 10.73 * b3 + 5.574 * b4 + 0.245 * b5);
      return pow2v3(log(C) / D);
  }

  fn Luminance(  LinearColor : vec3f ) -> f32
  {
    return dot( LinearColor, vec3f( 0.3, 0.59, 0.11 ) );
  }

  fn KajiyaKayDiffuseAttenuation( L:vec3f,  V:vec3f,  N:vec3f,  Shadow:f32 ) -> vec3f
  {
    // Use soft Kajiya Kay diffuse attenuation
    var KajiyaDiffuse = 1.0 - abs(dot(N, L));

    var FakeNormal = normalize(V - N * dot(V, N));
    //N = normalize( DiffuseN + FakeNormal * 2 );
    let nN = FakeNormal;

    let BaseColor = fragData.Albedo.rgb / PI ;
    // Hack approximation for multiple scattering.
    var Wrap = 1.0;
    var NoL = saturate((dot(nN, L) + Wrap) / squareF(1.0 + Wrap));
    var DiffuseScatter = (1.0 / PI) * mix(NoL, KajiyaDiffuse, 0.33) * fragData.Metallic;
    var Luma = Luminance(BaseColor);
    var ScatterTint = pow(BaseColor / Luma, vec3f(1.0 - Shadow));
    return sqrt(BaseColor) * DiffuseScatter * ScatterTint;
  }

  fn HairNormal( ID : f32 ) -> vec4f {
      let tangentA = vec4f(0.0,0.0,0.3,1.0);
      let tangentB = vec4f(0.0,0.0,-0.3,1.0);

      let iTangent = mix(tangentA,tangentB,vec4f(ID));
      var tangent = vec4f(0.0);
      #if USE_FLOWER

      #else 
        let tt = vec4f(0.0,-1.0,0.0,1.0);
        tangent = tt + iTangent;
      #endif

      return normalize(tangent) ;
  }

  fn hairShading( light:LightData , sV:vec3f, N:vec3f, Shadow:f32 , HairTransmittance : FHairTransmittanceData ,  InBacklit:f32 ,  Area:f32 ,  Random:vec2f ) -> vec3f{
      var ClampedRoughness = clamp(fragData.Roughness, 1/255.0, 1.0);
      let Backlit	= min(InBacklit, materialUniform.backlit);
      let HairColor = fragData.Albedo.rgb ;
      let lightCC = pow( light.lightColor.rgb,vec3<f32>(2.2));
      var lightColor = getHDRColor( lightCC.rgb , light.linear )  ;
      var lightAtt = light.intensity  ;

      let V = normalize(sV) ;
      let L = normalize(-light.direction) ;
      let H = normalize(N+L) ;
      var S : vec3f= vec3f(0.0) ;

      var KajiyaKayDiffuseFactor = 1.0;

      let VoL       = dot(V,L);                                                      
      let SinThetaL = clamp(dot(N,L), -1.0, 1.0);
      let SinThetaV = clamp(dot(N,V), -1.0, 1.0);

      var CosThetaD = cos( 0.5 * abs( asinFast( SinThetaV ) - asinFast( SinThetaL ) ) );
      // var CosThetaD = cos( 0.5 * abs( asin( SinThetaV ) - asin( SinThetaL ) ) );
      
      var Lp = L - SinThetaL * N;
      var Vp = V - SinThetaV * N;
      var CosPhi = dot(Lp,Vp) * rsqrt( dot(Lp,Lp) * dot(Vp,Vp) + 1e-4 );
      var CosHalfPhi = sqrt( saturate( 0.5 + 0.5 * CosPhi ) );

      let n = 1.55;
      let n_prime = 1.19 / CosThetaD + 0.36 * CosThetaD;

      let Shift = 0.035;
      var Alpha:array<f32,3> = array<f32,3>(
        -Shift * 2.0,
        Shift,
        Shift * 4.0,
      );

      var B:array<f32,3> =array<f32,3>(
        Area + pow2(ClampedRoughness),
        (Area + pow2(ClampedRoughness) / 2.0),
        Area + pow2(ClampedRoughness) * 2.0,
      );
     
      //S SR
      let sa = sin(Alpha[0]);
      let ca = cos(Alpha[0]);
      var ShiftA = 2.0 * sa * (ca * CosHalfPhi * sqrt(1.0 - SinThetaV * SinThetaV) + sa * SinThetaV);
      var BScale = 1.0;
      if(HairTransmittance.bUseSeparableR){
          BScale = sqrt(2.0) * CosHalfPhi ;
      }
      var Mp_R = Hair_g(B[0] * BScale, SinThetaL + SinThetaV - ShiftA);
      var Np_R = 0.25 * CosHalfPhi;
      var Fp_R = Hair_F(sqrt(saturate(0.5 + 0.5 * (VoL))));
      S += vec3f(Mp_R* Np_R * Fp_R * (fragData.F0 * 2.0)) * mix(1.0, 0.0, saturate(-VoL));
      KajiyaKayDiffuseFactor -= Fp_R;

      //S ST
      var Mp_ST = Hair_g( B[1], SinThetaL + SinThetaV - Alpha[1] );
      var a_ST = 1.0 / n_prime;
      var h_ST = CosHalfPhi * ( 1.0 + a_ST * ( 0.6 - 0.8 * CosPhi ) );
      var f_ST = Hair_F( CosThetaD * sqrt( saturate( 1.0 - h_ST * h_ST ) ) );
      var Fp_ST = pow2(1.0 - f_ST);
      var Tp_ST : vec3f = vec3f( 0.0 );
      if (HairTransmittance.bUseLegacyAbsorption)
      {
        Tp_ST = pow(HairColor.rgb, vec3f(0.5 * sqrt(1.0 - pow2(h_ST * a_ST)) / CosThetaD));
      }
      else
      {
        let AbsorptionColor = HairColorToAbsorption(HairColor.rgb,0.3);
        Tp_ST = exp(-AbsorptionColor * 2.0 * abs(1.0 - pow2(h_ST * a_ST) / CosThetaD));
      }
     
      var Np_ST = exp( -3.65 * CosPhi - 3.98 );
      
      S += Mp_ST * Np_ST * Fp_ST * Tp_ST * Backlit;
      KajiyaKayDiffuseFactor -= Fp_ST;

      //S TRT
      var Mp_TRT = Hair_g( B[2], SinThetaL + SinThetaV - Alpha[2] );
      
      //float h = 0.75;
      var f_TRT = Hair_F( CosThetaD * 0.5 );
      var Fp_TRT = pow2(1.0 - f_TRT) * f_TRT;
      var Tp_TRT = pow( HairColor.rgb , vec3f(0.8 / CosThetaD) );
      var Np_TRT = exp( 17.0 * CosPhi - 16.78 );
      
      S += Mp_TRT * Np_TRT * Fp_TRT * Tp_TRT;
      KajiyaKayDiffuseFactor -= Fp_TRT;
      // S = vec3f((KajiyaKayDiffuseFactor));
     
      S += KajiyaKayDiffuseAttenuation(L,V,N,Shadow) ;//* saturate(KajiyaKayDiffuseFactor);
      // S = vec3f((KajiyaKayDiffuseFactor));
      S = -min(-S, vec3f(0.0));
      return 2.0 * PI *vec3f(S) * (lightAtt / LUMEN) ;
  }

  fn BSSSRDFShading(){
    initFragData();

    var irradiance = vec3<f32>(0.0) ;
    #if USEGI
        irradiance += getIrradiance().rgb ;
    #else
        let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
        irradiance += (globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);
    #endif
    irradiance = ORI_ShadingInput.SSS + (irradiance.rgb);
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
            // specColor += pointLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness,fragData.Metallic,light) ;
          }
          case DirectLightType: {
              // specColor += directHairLighting( fragData.Albedo.rgb ,fragData.N,fragData.V,fragData.Roughness ,fragData.Metallic, light , globalUniform.shadowBias) ;
              var fHairTransmittanceData : FHairTransmittanceData ;
              fHairTransmittanceData.bUseBacklit = true ;
              fHairTransmittanceData.bUseSeparableR = true ;
              fHairTransmittanceData.bUseLegacyAbsorption = false ;

              //use shadow visible backlit
              // var shadow = 0.0 ;
              // if(light.castShadow>=0){
              //     #if USE_SHADOWMAPING
              //       shadow = shadowStrut.directShadowVisibility[i32(light.castShadow)] ; 
              //     #endif
              // }

              specColor = hairShading(light,fragData.V, ORI_ShadingInput.HairNormal , 1.0 ,fHairTransmittanceData,1.0,materialUniform.area,vec2f(0.0));
          }
          case SpotLightType: {
            // specColor += spotLighting( fragData.Albedo.rgb,ORI_VertexVarying.vWorldPos.xyz,fragData.N,fragData.V,fragData.Roughness,fragData.Metallic , light ) ;
          }
          default: {
          }
        }
    }


    let sunLight = lightBuffer[0] ;
    //***********lighting-PBR part********* 
    var F = FresnelSchlickRoughness(fragData.NoV, fragData.F0.rgb , fragData.Roughness);
    var kS = F;
    // var kD = vec3(1.0) - kS;
    // kD = kD * (1.0 - fragData.Metallic);
    let envIBL =  materialUniform.envIntensity * IBLEnv(fragData.V ,fragData.N ,fragData.Roughness ) ;
    fragData.EnvColor = envIBL ;
    // fragData.Specular = envIBL ;
    //***********indirect-specular part********* 
    
    var iblSpecularResult = fragData.Metallic * fragData.EnvColor * materialUniform.specularColor.rgb ;
    //***********indirect-specular part********* 
    
    //***********indirect-ambient part********* 
    var kdLast = (1.0 - fragData.F0.r) * (1.0 - fragData.Metallic);    
    var iblDiffuseResult = irradiance * kdLast * fragData.Albedo.rgb * (vec3(1.0) - kS) ;
    //irradiance
    //***********indirect-ambient part********* 
    var indirectResult = (iblSpecularResult + iblDiffuseResult * max(sunLight.quadratic,0.05) ) * fragData.Ao ;
    fragData.LightChannel = specColor ;

    // Using stripped down, 'pure log', formula. Parameterized by grey points and dynamic range covered.
    #if USEGBUFFER
        var normal_rgba8unorm = (ORI_VertexVarying.vWorldNormal + 1.0) * 0.5;
        normal_rgba8unorm = clamp(normal_rgba8unorm, vec3<f32>(0.0), vec3<f32>(1.0));
        ORI_FragmentOutput.worldNormal = vec4<f32>(normal_rgba8unorm,1.0);
        ORI_FragmentOutput.material = vec4<f32>(1.0,fragData.Roughness,fragData.Metallic,1.0);
    #endif
    
    #if USE_WORLDPOS
        ORI_FragmentOutput.worldPos = vec4<f32>(ORI_VertexVarying.vWorldPos.xyzw);
    #endif
  
    let finalColor =  LinearToGammaSpace(vec3f(specColor + indirectResult) ) ;
    ORI_FragmentOutput.color = vec4<f32>( finalColor ,fragData.Albedo.a) ;
    // ORI_FragmentOutput.color = vec4<f32>( vec3f(specColor) ,fragData.Albedo.a) ;
}

  `


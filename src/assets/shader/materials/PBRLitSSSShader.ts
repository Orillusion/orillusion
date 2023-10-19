export let PBRLitSSSShader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "BsDF_frag"

    @group(1) @binding(auto)
    var baseMapSampler: sampler;
    @group(1) @binding(auto)
    var baseMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var normalMapSampler: sampler;
    @group(1) @binding(auto)
    var normalMap: texture_2d<f32>;

    #if USE_CUSTOMUNIFORM
        struct MaterialUniform {
          transformUV1:vec4<f32>,
          transformUV2:vec4<f32>,

          baseColor: vec4<f32>,
          emissiveColor: vec4<f32>,
          materialF0: vec4<f32>,
          specularColor: vec4<f32>,
          envIntensity: f32,
          normalScale: f32,
          roughness: f32,
          metallic: f32,

          ao: f32,
          roughness_min: f32,
          roughness_max: f32,
          metallic_min: f32,

          metallic_max: f32,
          emissiveIntensity: f32,
          alphaCutoff: f32,
          ior: f32,

          clearcoatColor: vec4<f32>,

          clearcoatWeight: f32,
          clearcoatFactor: f32,
          clearcoatRoughnessFactor: f32,
          skinPower: f32,
          
          skinColor: vec4<f32>,
          skinColorIns: f32,
          curveFactor: f32,
        };
    #endif
    // #if USE_ARMC
        // @group(1) @binding(auto)
        // var maskMapSampler: sampler;
        // @group(1) @binding(auto)
        // var maskMap: texture_2d<f32>;
    // #endif

    // #if USE_MR
        @group(1) @binding(auto)
        var maskMapSampler: sampler;
        @group(1) @binding(auto)
        var maskMap: texture_2d<f32>;
    // #endif

    #if USE_AOTEX
        @group(1) @binding(auto)
        var aoMapSampler: sampler;
        @group(1) @binding(auto)
        var aoMap: texture_2d<f32>;
    #endif

    @group(1) @binding(auto)
    var emissiveMapSampler: sampler;
    @group(1) @binding(auto)
    var emissiveMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var sssMapSampler: sampler;
    @group(1) @binding(auto)
    var sssMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var lutMapSampler: sampler;
    @group(1) @binding(auto)
    var lutMap: texture_2d<f32>;

    var<private> debugOut : vec4f = vec4f(0.0) ;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 

        #if USE_SRGB_ALBEDO
            ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv )  ;
            ORI_ShadingInput.BaseColor = vec4f(ORI_ShadingInput.BaseColor.rgb/ORI_ShadingInput.BaseColor.a,ORI_ShadingInput.BaseColor.a)  ;
            ORI_ShadingInput.BaseColor = vec4<f32>(gammaToLiner(ORI_ShadingInput.BaseColor.rgb) * materialUniform.baseColor.rgb, ORI_ShadingInput.BaseColor.w * materialUniform.baseColor.a)  ;
        #else
            ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv )  ;
            ORI_ShadingInput.BaseColor = vec4f(ORI_ShadingInput.BaseColor.rgb/ORI_ShadingInput.BaseColor.a,ORI_ShadingInput.BaseColor.a)  ;
            ORI_ShadingInput.BaseColor = vec4<f32>(gammaToLiner(ORI_ShadingInput.BaseColor.rgb) * materialUniform.baseColor.rgb, ORI_ShadingInput.BaseColor.w * materialUniform.baseColor.a)  ;
        #endif

        var maskTex = textureSample(maskMap, maskMapSampler, uv ) ;
       
        #if USE_ALPHA_A
            ORI_ShadingInput.BaseColor.a =  ORI_ShadingInput.BaseColor.a * (maskTex.a) ;
            ORI_ShadingInput.BaseColor =  vec4f(ORI_ShadingInput.BaseColor.rgb/ORI_ShadingInput.BaseColor.a,ORI_ShadingInput.BaseColor.a) ;
        #endif

        #if USE_ALPHACUT 
            if( (ORI_ShadingInput.BaseColor.a - materialUniform.alphaCutoff) <= 0.0 ){
                ORI_FragmentOutput.color = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.worldPos = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.worldNormal = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.material = vec4<f32>(0.0,0.0,0.0,1.0);
                discard;
            }
        #endif

        #if USE_SHADOWMAPING
            useShadow();
        #endif

        // maskTex =vec4f( gammaToLiner(maskTex.rgb), maskTex.a );

        var roughnessChannel:f32 = 1.0 ;
        #if USE_ROUGHNESS_A
            roughnessChannel = maskTex.a ;
        #else if USE_ROUGHNESS_R
            roughnessChannel = maskTex.r ;
        #else if USE_ROUGHNESS_G
            roughnessChannel = maskTex.g ;
        #else if USE_ROUGHNESS_B
            roughnessChannel = maskTex.b ;
        #else if USE_ALBEDO_A
            roughnessChannel = ORI_ShadingInput.BaseColor.a ;
        #endif  

        #if USE_SMOOTH
            var roughness = ( 1.0 - roughnessChannel ) * materialUniform.roughness;
            ORI_ShadingInput.Roughness = clamp(roughness , 0.0001 , 1.0);
        #else
            ORI_ShadingInput.Roughness = clamp(roughnessChannel * materialUniform.roughness ,0.0001,1.0);
        #endif 

        var metallicChannel:f32 = 1.0 ;
        #if USE_METALLIC_A
            metallicChannel = maskTex.a ;
        #else if USE_METALLIC_R
            metallicChannel = maskTex.r ;
        #else if USE_METALLIC_G
            metallicChannel = maskTex.g ;
        #else if USE_METALLIC_B
            metallicChannel = maskTex.b ;
        #endif    
        ORI_ShadingInput.Metallic = metallicChannel * metallicChannel * materialUniform.metallic ;
   
        var aoChannel:f32 = 1.0 ;
        #if USE_AOTEX
            var aoMap = textureSample(aoMap, aoMapSampler, uv );
            aoChannel = aoMap.g ;
        #else
            #if USE_AO_A
                aoChannel = maskTex.a ;
            #else if USE_AO_R
                aoChannel = maskTex.r ;
            #else if USE_AO_G
                aoChannel = maskTex.g ;
            #else if USE_AO_B
                aoChannel = maskTex.b ;
            #endif  
        #endif

        // ORI_ShadingInput.BaseColor.a = maskTex.a ;

        ORI_ShadingInput.AmbientOcclusion = aoChannel ;

        ORI_ShadingInput.Specular = 1.0 ;

        var emissiveColor = textureSample(emissiveMap, emissiveMapSampler , ORI_VertexVarying.fragUV0.xy) ;

        emissiveColor = vec4<f32>(gammaToLiner(emissiveColor.rgb),emissiveColor.w);

        ORI_ShadingInput.EmissiveColor = vec4<f32>(materialUniform.emissiveColor.rgb * emissiveColor.rgb * materialUniform.emissiveIntensity,1.0);

     

        var Normal = textureSample(normalMap,normalMapSampler,uv).rgb ;

        let normal = unPackRGNormal(Normal,1.0,1.0) ;  
        
        ORI_ShadingInput.Normal = normal ;

        var sssColor = vec3f(pow(textureSample(sssMap, sssMapSampler, uv ).r,materialUniform.skinPower)) * materialUniform.skinColor.rgb ;
        let sunLight = lightBuffer[0] ;
        let sunLightIntensity = (sunLight.intensity / LUMEN)  ;
        let ndl = 1.0 - clamp(dot(normalize(normal),-normalize(sunLight.direction)),0.0,1.0) * 0.5 + 0.5 ;//1.0 - saturate( dot(normalize(normal),normalize(sunLight.direction)) ) * 0.5 + 0.5 ;
        ORI_ShadingInput.SSS += 0.5 * vec3f(sssColor * sunLightIntensity * materialUniform.skinColorIns * ndl * sunLight.lightColor.rgb ) ;
     
        var curve = clamp(materialUniform.curveFactor * (length(fwidth(ORI_ShadingInput.Normal.xyz)) / length(fwidth(ORI_VertexVarying.vWorldPos.xyz*100.0))),0.0,1.0);
        var NDotL = dot(ORI_ShadingInput.Normal, -sunLight.direction );
        var sssColor2 = textureSample(lutMap, lutMapSampler ,vec2f(NDotL * 0.5 + 0.5, materialUniform.curveFactor * sssColor.r)).rgb * sunLight.lightColor.rgb * sunLightIntensity ;
        ORI_ShadingInput.SSS = sssColor2.rgb * ORI_ShadingInput.BaseColor.rgb ;
     
        BsDFShading();

        // ORI_FragmentOutput.color = vec4f(vec3f(0.5*ORI_ShadingInput.SSS),1.0)  ;
    }
`


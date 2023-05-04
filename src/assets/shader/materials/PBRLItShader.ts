export let PBRLItShader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "BxDF_frag"

    @group(1) @binding(auto)
    var baseMapSampler: sampler;
    @group(1) @binding(auto)
    var baseMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var normalMapSampler: sampler;
    @group(1) @binding(auto)
    var normalMap: texture_2d<f32>;

    #if USE_ARMC
    @group(1) @binding(auto)
    var maskMapSampler: sampler;
    @group(1) @binding(auto)
    var maskMap: texture_2d<f32>;
    #endif

    #if USE_AOTEX
    @group(1) @binding(auto)
    var aoMapSampler: sampler;
    @group(1) @binding(auto)
    var aomapMap: texture_2d<f32>;
    #endif

    @group(1) @binding(auto)
    var emissiveMapSampler: sampler;
    @group(1) @binding(auto)
    var emissiveMap: texture_2d<f32>;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 

        ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv ) * materialUniform.baseColor ;
    
        // #if USE_ALPHACUT
            // ORI_ShadingInput.BaseColor.a = clamp(ORI_ShadingInput.BaseColor.a, 0.001 , 1.0 );
            if( (ORI_ShadingInput.BaseColor.a - materialUniform.alphaCutoff) <= 0.0 ){
                ORI_FragmentOutput.color = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.worldPos = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.worldNormal = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.material = vec4<f32>(0.0,0.0,0.0,1.0);
                discard;
            }
        // #endif

        #if USE_SHADOWMAPING
            directShadowMaping(globalUniform.shadowBias);
            pointShadowMapCompare(globalUniform.pointShadowBias);
        #endif


        // ORI_ShadingInput.BaseColor = vec4<f32>(sRGBToLinear(ORI_ShadingInput.BaseColor.xyz),ORI_ShadingInput.BaseColor.w);
    
        #if USE_ARMC
            var maskTex = textureSample(maskMap, maskMapSampler, uv ) ;

            ORI_ShadingInput.AmbientOcclusion = maskTex.r * materialUniform.ao ; 

            #if USE_AOTEX
                var aoMap = textureSample(aomapMap, aoMapSampler, uv );
                ORI_ShadingInput.AmbientOcclusion = mix(0.0,aoMap.r,materialUniform.ao) ;
            #endif

            ORI_ShadingInput.Roughness = maskTex.g * materialUniform.roughness ;
            ORI_ShadingInput.Metallic =  maskTex.b * materialUniform.metallic ;

        #else
            ORI_ShadingInput.Roughness = materialUniform.roughness ;
            ORI_ShadingInput.Metallic = materialUniform.metallic ;
            ORI_ShadingInput.AmbientOcclusion =  materialUniform.ao ;
            #if USE_AOTEX
                var aoMap = textureSample(aomapMap, aoMapSampler, ORI_VertexVarying.fragUV0.xy );
                ORI_ShadingInput.AmbientOcclusion = mix(0.0,aoMap.r,materialUniform.ao) ;
            #endif
        #endif

        ORI_ShadingInput.Roughness = clamp(ORI_ShadingInput.Roughness,0.084,1.0);
        ORI_ShadingInput.Specular = 0.5 ;

        var emissiveColor = textureSample(emissiveMap, emissiveMapSampler , ORI_VertexVarying.fragUV0.xy) ;
        ORI_ShadingInput.EmissiveColor = vec4<f32>(materialUniform.emissiveColor.rgb * emissiveColor.rgb * materialUniform.emissiveIntensity,1.0);

        var Normal = textureSample(normalMap,normalMapSampler,ORI_VertexVarying.fragUV0).rgb ;
        // Normal.y = 1.0 - Normal.y ;
        // let normal = unPackNormal(Normal,1.0,materialUniform.normalScale) ;
        let normal = unPackNormal(Normal,materialUniform.normalScale) ;  
        ORI_ShadingInput.Normal = normal ;

        BxDFShading();
    }
`


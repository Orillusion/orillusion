export let UnLitTextureArray: string = /*wgsl*/ `
    // #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"

    #include "WorldMatrixUniform"
    #include "VertexAttributeIndexShader"
    #include "GlobalUniform"
    #include "Inline_vert"
    #include "EnvMap_frag"
    #include "ColorUtil_frag"

    const DEGREES_TO_RADIANS : f32 = 3.1415926 / 180.0 ;
    const PI : f32 = 3.1415926 ;

    #if USE_CUSTOMUNIFORM
        struct MaterialUniform {
            transformUV1:vec4<f32>,
            transformUV2:vec4<f32>,
            baseColor: vec4<f32>,
            alphaCutoff: f32,
        };
    #endif

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d_array<f32>;

    @group(2) @binding(5)
    var<storage,read> graphicBuffer : array<GraphicNodeStruct>;
    
    @vertex
    fn VertMain( vertex:VertexAttributes ) -> VertexOutput {
        vertex_inline(vertex);
        vert(vertex);
        return ORI_VertexOut ;
    }

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        // var irradiance = vec3<f32>(0.0) ;
        // let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
        // irradiance += (globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, ORI_VertexVarying.vWorldNormal.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);

        graphicNode = graphicBuffer[u32(round(ORI_VertexVarying.index))];
        
        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 
        uv = graphicNode.uvRect.zw * uv.xy + graphicNode.uvRect.xy; 
        var color = textureSample(baseMap,baseMapSampler,uv, u32(round(graphicNode.texIndex)) ) * graphicNode.baseColor ;
        // let color = textureSample(baseMap,baseMapSampler,uv, u32(round(ORI_VertexVarying.index)));

        // ORI_ViewDir = normalize( globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz);
        // let att = dot( ORI_ViewDir , ORI_VertexVarying.vWorldNormal.xyz );

        // irradiance = LinearToGammaSpace(irradiance.rgb) * color.rgb ;//* att ;

        color += graphicNode.emissiveColor ;
        if(color.w < 0.5){
            discard ;
        }

        // let outColor = vec4f( color.rgb * (att * 0.5 + 0.5 ) , 1.0 ) * materialUniform.baseColor ;
        let outColor = vec4f( color.rgb , 1.0 ) * materialUniform.baseColor ;
        
        // ORI_ShadingInput.BaseColor = color  ;
        ORI_ShadingInput.BaseColor = vec4f(outColor.xyz,1.0)  ;
        UnLit();
    }
`


export let UnLitTextureArray: string = /*wgsl*/ `
    // #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"

    #include "WorldMatrixUniform"
    #include "VertexAttributeIndexShader"
    #include "GlobalUniform"
    #include "Inline_vert"

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
    
    struct TransformStruct{
        matrix: mat4x4<f32>,
        index:f32,
        index2:f32,
        index3:f32,
        index4:f32,
    }

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d_array<f32>;

    @group(2) @binding(5)
    var<storage,read> transformBuffer : array<TransformStruct>;
    
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

        let transform = transformBuffer[u32(round(ORI_VertexVarying.index))];

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 
        let color = textureSample(baseMap,baseMapSampler,uv, u32(transform.index) );
        
        if(color.w < 0.5){
            discard ;
        }
        
        ORI_ShadingInput.BaseColor = color * materialUniform.baseColor ;
        UnLit();
    }
`


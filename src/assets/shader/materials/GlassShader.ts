export let GlassShader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"

    // @group(1) @binding(auto)
    // var noes_MapSampler: sampler;
    // @group(1) @binding(auto)
    // var noes_Map: texture_2d<f32>;

    @group(1) @binding(auto)
    var splitTexture_MapSampler: sampler;
    @group(1) @binding(auto)
    var splitTexture_Map: texture_2d<f32>;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var screenUV = ORI_VertexVarying.fragPosition.xy / ORI_VertexVarying.fragPosition.w;
        screenUV = (screenUV.xy + 1.0) * 0.5;
        screenUV.y = 1.0 - screenUV.y;

        screenUV.x = clamp(sin(screenUV.x * 1.0),0.0,1.0) ;
        screenUV.y = clamp(sin(screenUV.y * 1.0),0.0,1.0) ;
        // screenUV.y = cos(ORI_VertexVarying.fragPosition.y/7.15);

        let frameMap = textureSample(splitTexture_Map,splitTexture_MapSampler,screenUV);
        // let noesMap = textureSample(noes_Map,noes_MapSampler,screenUV);

        ORI_ShadingInput.BaseColor = vec4<f32>( frameMap.rgb , 1.0) ;
        UnLit();
    }
`


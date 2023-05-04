#include "Common_vert"
#include "Common_frag"
#include "UnLit_frag"
#include "VideoUniform_frag"

@group(1) @binding(auto)
var baseMapSampler: sampler;
@group(1) @binding(auto)
var baseMap: texture_2d<f32>;

fn vert(inputData:VertexAttributes) -> VertexOutput {
    ORI_Vert(inputData) ;
    return ORI_VertexOut ;
}

fn frag(){
    let transformUV1 = materialUniform.transformUV1;

    let uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 

    if(uv.x < materialUniform.rectClip.x || uv.x > (1.0-materialUniform.rectClip.z)) {
        discard;
    }

    if(uv.y < materialUniform.rectClip.y || uv.y > (1.0-materialUniform.rectClip.w)) {
        discard;
    }

    let videoColor = textureSample(baseMap, baseMapSampler, uv);

    ORI_ShadingInput.BaseColor = videoColor * materialUniform.baseColor ;
    UnLit();
}
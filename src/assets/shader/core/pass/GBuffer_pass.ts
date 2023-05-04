export let GBuffer_pass: string = /*wgsl*/ `
#include "Common_vert"
#include "FragmentVarying"
#include "GlobalUniform"

struct FragmentOutput {
    @location(0) o_Position: vec4<f32>,
    @location(1) o_Normal: vec4<f32>,
    @location(2) o_Color: vec4<f32>
};

struct MaterialUniform {
    baseColor: vec4<f32>,
    emissiveColor: vec4<f32>,
    emissiveIntensity: f32,
    normalScale: f32,
    alphaCutoff: f32
};

@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;

@group(1) @binding(auto)
var baseMapSampler: sampler;
@group(1) @binding(auto)
var baseMap: texture_2d<f32>;

@group(1) @binding(auto)
var normalMapSampler: sampler;
@group(1) @binding(auto)
var normalMap: texture_2d<f32>;

@group(1) @binding(auto)
var emissiveMapSampler: sampler;
@group(1) @binding(auto)
var emissiveMap: texture_2d<f32>;

fn vert(inputData:VertexAttributes) -> VertexOutput {
    ORI_Vert(inputData) ;
    return ORI_VertexOut ;
}

var<private> ORI_FragmentOutput: FragmentOutput;
var<private> ORI_VertexVarying: FragmentVarying;

@fragment
fn FragMain(vertex_varying:FragmentVarying) -> FragmentOutput {
    ORI_VertexVarying = vertex_varying;
    var texColor = textureSample(baseMap, baseMapSampler, ORI_VertexVarying.fragUV0.xy );

    var emissive = textureSample(emissiveMap, emissiveMapSampler, ORI_VertexVarying.fragUV0.xy ).rgb ;
    let intensity = materialUniform.emissiveIntensity * materialUniform.emissiveColor.a ;
    emissive = emissive.rgb * materialUniform.emissiveColor.rgb ;
    emissive = convertToHDRRGB(emissive,intensity);

    if (materialUniform.alphaCutoff-texColor.w > 0.0) {
        discard ;
    }

    var o_Position = vec4<f32>(ORI_VertexVarying.vWorldPos.xyz,emissive.r) ;
    var o_Normal = vec4<f32>((ORI_VertexVarying.vWorldNormal.xyz * 0.5 + 0.5 ),emissive.g) ;
    var o_Color = vec4<f32>((texColor * materialUniform.baseColor).rgb , emissive.b )  ;
    return FragmentOutput(o_Position,o_Normal,vec4<f32>(o_Color));
}

fn convertToHDRRGB( color : vec3<f32> , ins:f32 ) -> vec3<f32> {
    var hdrColor = vec3<f32>(0.0,0.0,0.0);
    hdrColor.r = color.r * pow(2.4, ins);
    hdrColor.g = color.g * pow(2.4, ins);
    hdrColor.b = color.b * pow(2.4, ins);
    return hdrColor;
}
`


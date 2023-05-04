export let SkyGBuffer_pass: string = /*wgsl*/ `
#include "GlobalUniform"

struct uniformData {
    exposure: f32,
    roughness: f32
};

struct FragmentOutput {
    @location(0) o_Position: vec4<f32>,
    @location(1) o_Normal: vec4<f32>,
    @location(2) o_Color: vec4<f32>
};

@group(1) @binding(4)
var baseMapSampler: sampler;
@group(1) @binding(5)
var baseMap: texture_cube<f32>;

@group(2) @binding(0)
var<uniform> global: uniformData;

fn LinearToGammaSpace(linRGB: vec3<f32>) -> vec3<f32> {
    var linRGB1: vec3<f32>;
    linRGB1 = linRGB;
    linRGB1 = max(linRGB1, vec3<f32>(0.0, 0.0, 0.0));
    linRGB1.x = pow(linRGB1.x, 0.4166666567325592);
    linRGB1.y = pow(linRGB1.y, 0.4166666567325592);
    linRGB1.z = pow(linRGB1.z, 0.4166666567325592);
    return max(((1.0549999475479126 * linRGB1) - vec3<f32>(0.054999999701976776)), vec3<f32>(0.0));
}

@fragment
fn main(@location(0) fragUV: vec2<f32>, @location(1) vWorldPos: vec4<f32>, @location(2) vWorldNormal: vec3<f32>) -> FragmentOutput {
    let maxLevel: u32 = textureNumLevels(baseMap);
    let textureColor:vec3<f32> = textureSampleLevel(baseMap, baseMapSampler, normalize(vWorldPos.xyz), global.roughness * f32(maxLevel) ).xyz;
    let o_Color = 0.618 * vec4<f32>(LinearToGammaSpace(textureColor) * globalUniform.skyExposure , 1.0);
    let o_Normal = vec4(vWorldNormal,1.0) ;
    let o_Position = vec4<f32>(vWorldPos.xyz,100000.0) ;
    return FragmentOutput(o_Position,o_Normal,o_Color);
}
`



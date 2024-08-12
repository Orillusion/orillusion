/**
 * @internal
 */
export let SkyGBuffer_pass: string = /*wgsl*/ `
#include "GlobalUniform"
#include "ColorUtil_frag"

struct uniformData {
    eyesPos: vec3<f32>,
    exposure: f32,
    roughness: f32,
};

struct FragmentOutput {
    @location(auto) o_Position: vec4<f32>,
    @location(auto) o_Normal: vec4<f32>,
    @location(auto) o_Color: vec4<f32>
};

@group(1) @binding(4)
var baseMapSampler: sampler;
@group(1) @binding(5)
var baseMap: texture_cube<f32>;

@group(2) @binding(0)
var<uniform> global: uniformData;

@fragment
fn main(@location(auto) fragUV: vec2<f32>,@location(auto) vClipPos: vec4<f32>, @location(auto) vWorldPos: vec4<f32>, @location(auto) vWorldNormal: vec3<f32> , @builtin(position) fragCoord : vec4<f32> ) -> FragmentOutput {
    let maxLevel: u32 = textureNumLevels(baseMap);
    let textureColor:vec3<f32> = textureSampleLevel(baseMap, baseMapSampler, normalize(vWorldPos.xyz), global.roughness * f32(maxLevel) ).xyz;
    let o_Color = 0.618 * vec4<f32>(LinearToGammaSpace(textureColor) * globalUniform.skyExposure , 1.0);
    let o_Normal = vec4(vWorldNormal,1.0) ;
    let o_Position = vec4<f32>(vWorldPos.xyz,100000.0) ;
    return FragmentOutput(o_Position,o_Normal,o_Color);
}
`



import { GlobalUniform } from "../core/common/GlobalUniform";

/**
 * @internal
 */
export let GlobalFog_shader = /* wgsl */ `
struct FragmentOutput {
    @location(0) o_Target: vec4<f32>
};

${GlobalUniform}

#include "FastMathShader" 

struct UniformData {
    fogColor : vec4<f32>,
    fogType : f32 ,
    height : f32 , 
    start: f32,
    end: f32,
    density : f32 ,
    ins : f32 ,
    skyFactor: f32,
    skyRoughness: f32,
    overrideSkyFactor: f32,
    isSkyHDR: f32
};

@group(1) @binding(0)
var positionMapSampler: sampler;
@group(1) @binding(1)
var positionMap: texture_2d<f32>;

@group(1) @binding(2)
var colorMapSampler: sampler;
@group(1) @binding(3)
var colorMap: texture_2d<f32>;

@group(1) @binding(4)
var normalMapSampler: sampler;
@group(1) @binding(5)
var normalMap: texture_2d<f32>;

@group(1) @binding(6)
var prefilterMapSampler: sampler;
@group(1) @binding(7)
var prefilterMap: texture_cube<f32>;


@group(2) @binding(0)
var<uniform> global : UniformData;
var<private> varying_uv: vec2<f32>;

fn LinearToGammaSpace(linRGB: vec3<f32>) -> vec3<f32> {
    var linRGB1 = max(linRGB, vec3<f32>(0.0));
    linRGB1 = pow(linRGB1, vec3<f32>(0.4166666567325592));
    return max(((1.0549999475479126 * linRGB1) - vec3<f32>(0.054999999701976776)), vec3<f32>(0.0));
}

fn getSkyColor(worldPosition:vec3<f32>, skyRoughness:f32, isHDRTexture:bool) -> vec3<f32>{
    let cameraPosition = vec3<f32>(globalUniform.cameraWorldMatrix[3].xyz);
    let rayDirection = normalize(vec3<f32>(worldPosition.xyz - cameraPosition));
    let calcRoughness = clamp(skyRoughness, 0.0, 1.0);
    let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
    var prefilterColor = textureSampleLevel(prefilterMap, prefilterMapSampler, rayDirection, calcRoughness * MAX_REFLECTION_LOD);
    if(isHDRTexture){
        prefilterColor = vec4<f32>(LinearToGammaSpace(vec3<f32>(prefilterColor.xyz)), prefilterColor.w);
    }
     return prefilterColor.xyz * globalUniform.skyExposure;
  }

  var<private> texPosition: vec4<f32>;
  var<private> texNormal: vec4<f32>;
  var<private> texColor: vec4<f32>;

@fragment
fn main(@location(0) fragUV: vec2<f32>,
@builtin(position) coord: vec4<f32>) -> FragmentOutput {
    var texCoord = vec2<f32>(fragUV.x, 1.0 - fragUV.y);
    texPosition = textureSample(positionMap, positionMapSampler, texCoord) ;
    texNormal = textureSample(normalMap, normalMapSampler, texCoord) ;
    texColor = textureSample(colorMap, colorMapSampler, texCoord) ;
  
    var opColor = vec3<f32>(0.0);
    if(texNormal.w <= 0.5){
        //for sky
        if(global.overrideSkyFactor > 0.01){
            opColor = blendSkyColor();
        }else{
            opColor = texColor.xyz;
        }
    }else{
        //for ground
        var fogFactor = calcFogFactor();
        if(global.skyFactor > 0.01 || global.overrideSkyFactor > 0.01){
            opColor = blendGroundColor(fogFactor);
        }else{
            opColor = mix(texColor.rgb, global.fogColor.xyz, fogFactor);
        }
    }
    return FragmentOutput(vec4<f32>(opColor.xyz, texColor.a));
}

fn calcFogFactor() -> f32{
    var cameraPos = globalUniform.cameraWorldMatrix[3].xyz  ;
    let dis = texNormal.w * distance(cameraPos,texPosition.xyz);
    let height = texPosition.y ;
    //var heightFactor = computeFog((dis + height) / 2.0 );
    var heightFactor = computeFog((dis));
    return clamp(global.ins * heightFactor,0.0,1.0);
}

    
fn blendGroundColor(fogFactor:f32) -> vec3<f32>
{
    var skyColorBlur = getSkyColor(texPosition.xyz, global.skyRoughness, global.isSkyHDR > 0.5);
    let skyFactor = clamp(global.skyFactor - global.overrideSkyFactor * 0.5, 0.0, 1.0);
    var fogColor = mix(global.fogColor.xyz, skyColorBlur, skyFactor);
    return mix(texColor.rgb, fogColor.rgb, fogFactor);
}

fn blendSkyColor() -> vec3<f32>
{
    let overrideSkyFactor = sqrt(global.overrideSkyFactor);
    var skyColorBlur = getSkyColor(texPosition.xyz, overrideSkyFactor * 0.3, global.isSkyHDR > 0.5);
    return mix(global.fogColor.xyz, skyColorBlur, 1.0 - overrideSkyFactor);
}


fn computeFog(z:f32) -> f32 {
    var fog = 0.0;
    if( global.fogType == 0.0 ){
        fog = (global.end - z) / (global.end - global.start);
    }else if(global.fogType == 1.0 ){
        fog = exp2(-global.density * z);
    }else if(global.fogType == 2.0 ){
        fog = global.density * z;
        fog = exp2(-fog * fog);
    }
    return max(fog,0.0);
}
`;

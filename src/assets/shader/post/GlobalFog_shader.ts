import { GlobalUniform } from "../core/common/GlobalUniform";

/**
 * @internal
 */
export let GlobalFog_shader = /* wgsl */ `
var<private> PI: f32 = 3.14159265359;

struct FragmentOutput {
    @location(0) o_Target: vec4<f32>
};

${GlobalUniform}

#include "FastMathShader" 
 
struct LightData {
    index:f32,
    lightType:i32,
    radius:f32,
    linear:f32,
    
    position:vec3<f32>,
    lightMatrixIndex:f32,

    direction:vec3<f32>,
    quadratic:f32,

    lightColor:vec3<f32>,
    intensity:f32,

    innerCutOff :f32,
    outerCutOff:f32,
    range :f32,
    castShadow:i32,

    lightTangent:vec3<f32>,
    ies:f32,
};

struct UniformData {
    fogColor : vec4<f32>,
    fogType : f32 ,
    fogHeightScale : f32 , 
    start: f32,
    end: f32,
    density : f32 ,
    ins : f32 ,
    falloff : f32 ,
    rayLength : f32 ,
    scatteringExponent : f32 ,
    dirHeightLine : f32 ,
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

@group(2) @binding(1)
var<storage,read> lightBuffer: array<LightData>;

var<private> texPosition: vec4<f32>;
var<private> texNormal: vec4<f32>;
var<private> texColor: vec4<f32>;

fn LinearToGammaSpace(linRGB: vec3<f32>) -> vec3<f32>
{
    var linRGB1 = max(linRGB, vec3<f32>(0.0));
    linRGB1 = pow(linRGB1, vec3<f32>(0.4166666567325592));
    return max(((1.0549999475479126 * linRGB1) - vec3<f32>(0.054999999701976776)), vec3<f32>(0.0));
}

fn getSkyColor(worldPosition:vec3<f32>, skyRoughness:f32, isHDRTexture:bool) -> vec3<f32>
{
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

@fragment
fn main(@location(0) fragUV: vec2<f32>, @builtin(position) coord: vec4<f32>) -> FragmentOutput {
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

        let sunLight = lightBuffer[0] ;
        var inScatteringValue = inScatterIng(sunLight.direction, texPosition.xyz, sunLight.lightColor);
        opColor += inScatteringValue;
    }
    return FragmentOutput(vec4<f32>(opColor.xyz, texColor.a));
}

fn calcFogFactor() -> f32 
{
    var cameraPos = globalUniform.cameraWorldMatrix[3].xyz  ;
    let dis = distance(cameraPos, texPosition.xyz);
    var heightFactor = computeFog(dis) + cFog(-texPosition.y);
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


fn computeFog(z:f32) -> f32 
{
    var fog = 0.0;
    if( global.fogType < 0.5 ){
        fog = (global.end - z) / (global.end - global.start);
    }else if(global.fogType < 1.5 ){
        fog = exp2(-global.density * z);
    }else if(global.fogType == 2.5 ){
        fog = global.density * z;
        fog = exp2(-fog * fog);
    }
    return max(fog,0.0);
}

  fn cFog(y:f32) -> f32 
  {
     let fogDensity = global.density * exp(global.fogHeightScale * y);
     let fogFactor = (1.0 - exp2(-global.falloff)) / global.falloff ;
     let fog = fogDensity * fogFactor * max(global.rayLength - global.start, 0.0); 
     return max(fog,0.0);
  }

  fn inScatterIng(sunDir:vec3<f32>, worldPos:vec3<f32>, sunColor:vec3<f32>) -> vec3<f32> 
  {
    let viewDir = normalize(globalUniform.CameraPos.xyz - worldPos.xyz) ;
    let VoL = saturate(dot(viewDir,sunDir)) ;
    var scatter = pow(VoL,global.scatteringExponent);
    scatter *= (1.0-saturate(exp2(-global.dirHeightLine)));
    return vec3<f32>(scatter*sunColor);
  }

`;



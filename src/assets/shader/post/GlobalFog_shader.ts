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


@group(2) @binding(0)
var<uniform> global : UniformData;
var<private> varying_uv: vec2<f32>;

@fragment
fn main(@location(0) fragUV: vec2<f32>,
@builtin(position) coord: vec4<f32>) -> FragmentOutput {
    var texCoord = fragUV ;
    texCoord.y = 1.0 - texCoord.y ;

    var cameraPos = globalUniform.cameraWorldMatrix[3].xyz  ;

    var texPosition = textureSample(positionMap, positionMapSampler ,texCoord) ;
    var texNormal = textureSample(normalMap, normalMapSampler,texCoord) ;
    var texColor = textureSample(colorMap, colorMapSampler ,texCoord) ;

    let dis = texNormal.w * distance(cameraPos,texPosition.xyz);
    let height = texPosition.y ;

    // var heightFactor = computeFog((dis + height) / 2.0 );
    var heightFactor = computeFog((dis));
    // visible test
    if(texNormal.w<=0.5){
        return FragmentOutput(vec4<f32>(texColor.rgb,texColor.a));
    }else{
        // var emissive = mix( global.fogColor.rgb , texColor.rgb , global.ins * heightFactor );
        var emissive = mix( texColor.rgb , global.fogColor.rgb , clamp(global.ins * heightFactor,0.0,1.0) );
        return FragmentOutput(vec4<f32>(emissive.rgb,texColor.a));
    }
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

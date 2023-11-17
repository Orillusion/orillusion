import { CSM } from "../../../core/csm/CSM";

export let DDGILighting_shader = /*wgsl*/`
var<private> PI: f32 = 3.14159265359;

#include "GlobalUniform"
#include "MathShader"
#include "FastMathShader"
#include "ColorUtil"

struct ConstUniform{
   screenWidth:f32,
   screenHeight:f32
}

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

struct Uniforms {
     matrix : array<mat4x4<f32>>
 };

const PointLightType = 1;
const DirectLightType = 2;
const SpotLightType = 3;

@group(0) @binding(1) var outputBuffer : texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var prefilterMapSampler: sampler;
@group(0) @binding(3) var prefilterMap: texture_cube<f32>;

@group(1) @binding(0) var positionMapSampler : sampler;
@group(1) @binding(1) var positionMap : texture_2d<f32>;

@group(1) @binding(2) var normalMapSampler : sampler;
@group(1) @binding(3) var normalMap : texture_2d<f32>;

@group(1) @binding(4) var colorMapSampler : sampler;
@group(1) @binding(5) var colorMap : texture_2d<f32>;

@group(1) @binding(6) var shadowMapSampler : sampler_comparison;
@group(1) @binding(7) var shadowMap : texture_depth_2d_array;

@group(1) @binding(8) var pointShadowMapSampler: sampler;
@group(1) @binding(9) var pointShadowMap: texture_depth_cube_array ;

@group(2) @binding(0)
var<storage,read> lightBuffer: array<LightData>;

@group(2) @binding(1)
var<storage, read> models : Uniforms;

struct ShadowStruct{
 directShadowVisibility:f32,
 pointShadows:array<f32,8>,
}

var<private> shadowStrut: ShadowStruct ;
var<private> ulitColor:vec3<f32>;
var<private> wPosition:vec3<f32>;
var<private> wNormal:vec3<f32>;

const LUMEN = 10.764;

fn samplePosition(uv:vec2<f32>) -> vec4<f32>
{
   return textureSampleLevel(positionMap, positionMapSampler,uv, 0.0);
}

fn sampleNormal(uv:vec2<f32>) -> vec4<f32>
{
  return textureSampleLevel(normalMap, normalMapSampler, uv, 0.0);
}

fn sampleColor(uv:vec2<f32>) -> vec4<f32>
{
   var oc:vec4<f32> = textureSampleLevel(colorMap, colorMapSampler, uv, 0.0);
   ulitColor = vec3(oc.xyz);
   return oc;
}

const csmCount:i32 = ${CSM.Cascades} ;
fn directShadowMaping(P:vec3<f32>, N:vec3<f32>, shadowBias: f32)  {
  let enableCSM:bool = globalUniform.enableCSM > 0.5;
  var light = lightBuffer[0];
  var visibility = 1.0;
  var shadowIndex = i32(light.castShadow);
  if (shadowIndex >= 0 ) {
    var shadowMatrix:mat4x4<f32>;
    if(enableCSM && csmCount > 1){
      for(var csm:i32 = 0; csm < csmCount; csm ++){
        var csmShadowBias = globalUniform.csmShadowBias[csm];
        shadowMatrix = globalUniform.csmMatrix[csm];
        let csmShadowResult = directShadowMapingIndex(light, shadowMatrix, P, N, csm, csmShadowBias);
        if(csmShadowResult.y < 0.5){
          visibility = csmShadowResult.x;
          break;
        }
      }
    }else{
      shadowMatrix = globalUniform.shadowMatrix[shadowIndex];
      visibility = directShadowMapingIndex(light, shadowMatrix, P, N, shadowIndex, shadowBias).x;
    }
  }
  shadowStrut.directShadowVisibility = visibility;
}

fn directShadowMapingIndex(light:LightData, matrix:mat4x4<f32>, P:vec3<f32>, N:vec3<f32>, depthTexIndex:i32, shadowBias:f32) -> vec2<f32>
{
  var visibility = 1.0;
  var isOutSideArea:f32 = 1.0;
  var shadowPosTmp = matrix * vec4<f32>(P.xyz, 1.0);
  var shadowPos = shadowPosTmp.xyz / shadowPosTmp.w;
  var varying_shadowUV = shadowPos.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
  if (varying_shadowUV.x <= 1.0
    && varying_shadowUV.x >= 0.0
    && varying_shadowUV.y <= 1.0
    && varying_shadowUV.y >= 0.0
    && shadowPosTmp.z <= 1.0
    && shadowPosTmp.z >= 0.0)
  {
    isOutSideArea = 0.0;
    var uvOnePixel = 1.0 / vec2<f32>(globalUniform.shadowMapSize);
    var NoL = abs(dot(N, normalize(light.direction)));
    var bias = shadowBias / max(NoL, 0.000001);
    visibility = textureSampleCompareLevel(shadowMap, shadowMapSampler, varying_shadowUV, depthTexIndex, shadowPos.z - bias);
    visibility += 0.001;
  }
  return vec2<f32>(visibility, isOutSideArea);
}

fn pointShadowMapCompare(shadowBias:f32){
   for(var i:i32 = i32(0) ; i < i32(8); i = i + 1 )
   { 
       var v = 1.0 ;
       let light = lightBuffer[i] ;
       if(light.castShadow < 0 ){
         shadowStrut.pointShadows[i] = v ;
         continue ;
       }

       let frgToLight = wPosition - light.position.xyz;
       var dir:vec3<f32> = normalize(frgToLight)  ;

       var len = length(frgToLight) ;
       var depth = textureSampleLevel(pointShadowMap,pointShadowMapSampler,dir.xyz,i,0); 
       depth *= globalUniform.far ;
       if((len - shadowBias) > depth){
          v = 0.0 ; 
       }
       shadowStrut.pointShadows[i] = v ;
   }
} 

fn directLighting( albedo:vec3<f32> , WP :vec3<f32>, N:vec3<f32> , V:vec3<f32> , light:LightData , shadowBias:f32  ) -> vec3<f32> {
 var L = -normalize(light.direction.xyz) ;
 var NoL = max(dot(N,L),0.0);
 let lightCC = pow( light.lightColor.rgb,vec3<f32>(2.2));
 var lightColor = getHDRColor( lightCC , light.linear ) ;
 var att = light.intensity / LUMEN ;
 if(light.castShadow>=0){
     lightColor *= shadowStrut.directShadowVisibility ;
 }
 let finalLight = (albedo / PI) * lightColor * NoL * att * 2.0 ;
 return finalLight ;
}

fn pointLighting( albedo:vec3<f32>,WP:vec3<f32>, N:vec3<f32>, V:vec3<f32>, light:LightData ) -> vec3<f32> {
 let lightPos = models.matrix[u32(light.lightMatrixIndex)][3].xyz;
 var dir = lightPos.xyz - WP ;
 let dist = length(dir);
 var color = vec3<f32>(0.0) ;

 if(dist != 0.0){
   dir *= 1.0 / dist ;
 }

 if( abs(dist) < light.range ){
     var L = dir ;
     var atten = 1.0 ;
     atten = 1.0 - smoothstep(0.0,light.range,dist) ;
     atten *= 1.0 / max(light.radius,0.0001) ;

     var lightColor = light.lightColor.rgb  ;
     lightColor = getHDRColor(lightColor , light.linear ) * light.intensity / LUMEN * 2.0;
     color = (albedo / PI) * lightColor.rgb * atten ;
 }

 return  color *0.0;
}

fn spotLight( albedo:vec3<f32>,WP:vec3<f32>, N:vec3<f32>, V:vec3<f32>, light:LightData ) -> vec3<f32> {
 let lightPos = models.matrix[u32(light.lightMatrixIndex)][3].xyz;
 var dir = lightPos.xyz - WP ;
 let dist = length(dir) ;

 if(dist != 0.0){
   dir *= 1.0 / dist ;
 }

 var color = vec3<f32>(0.0) ;
 if( abs(dist) < light.range * 2.0 ){
     var L = dir ;
     let theta = dot(-L, normalize(light.direction));
     let angle = acos(theta) ;
     var atten = 1.0 ;
     atten = 1.0 - smoothstep(0.0,light.range,dist) ;
     atten *= 1.0 / max(light.radius,0.1) ;
     if(angle < light.outerCutOff){
       if(angle > light.innerCutOff){
         atten *= 1.0 - smoothstep(light.innerCutOff, light.outerCutOff, angle) ;
       }
     }else{
       atten = 0.0 ;
     }
     var lightColor = light.lightColor.rgb  ;
     lightColor = getHDRColor(lightColor , light.linear ) * light.intensity / LUMEN * 2.0;
     color = (albedo / PI) * lightColor.rgb * atten ;
   }
 return  color ;
}

fn CalcUV_01(coord:vec2<i32>, texSize:vec2<u32>) -> vec2<f32>
{
  let u = (f32(coord.x) + 0.5) / f32(texSize.x);
  let v = (f32(coord.y) + 0.5) / f32(texSize.y);
  return vec2<f32>(u, v);
}

fn coordFun(fragCoord:vec2<i32>)-> vec4<f32>{
 let uv_01 = CalcUV_01(fragCoord, texSize);
 var pos = samplePosition(uv_01);

 var normalMap = sampleNormal(uv_01);
 var normal = normalize( normalMap.xyz * 2.0 - 1.0 );

 var color = sampleColor(uv_01);
 var emissive = vec4<f32>(pos.a,normalMap.a,color.a,0.0) * 1.0 ;
 if(pos.w + 1.0 > 10000.0){
   return vec4<f32>(color);
 }
 var V = normalize(pos.xyz - globalUniform.cameraWorldMatrix[3].xyz);
 var N = normal.xyz ;

 wPosition = pos.xyz;
 wNormal = N;

 directShadowMaping(wPosition, wNormal, globalUniform.shadowBias);
 pointShadowMapCompare(globalUniform.shadowBias);

 var lighting = vec3<f32>(0.0);
 let lightCount = 32 ;
 for(var i:i32 = 0 ; i < lightCount ; i = i + 1 )
 {
     let light = lightBuffer[i];
     switch (light.lightType) {
         case PointLightType: {
             lighting += pointLighting(color.rgb,pos.xyz,N,V,light);
         }
         case DirectLightType: {
             lighting += directLighting(color.rgb,pos.xyz,N,V,light,globalUniform.shadowBias);
         }
         case SpotLightType: {
             lighting += spotLight(color.rgb,pos.xyz,N,V,light);
         }
         default: {
         }
     }
 }

 // lighting = vec3<f32>(1.0) / (vec3<f32>(1.0) + lighting.rgb) * lighting.rgb;

 var skyLight: vec3<f32> = globalUniform.skyExposure * (textureSampleLevel(prefilterMap, prefilterMapSampler, N.xyz, 8.0 ).rgb);
 // skyLight = LinearToGammaSpace(skyLight);
 // skyLight = (color.rgb / 3.1415926 ) * skyLight;
 // skyLight = vec3<f32>(1.0) / (vec3<f32>(1.0) + skyLight.rgb) * skyLight.rgb;

 lighting = lighting.rgb ;//+ skyLight.rgb ;

 return vec4<f32>(lighting.rgb,color.w)+emissive;
}

// fn vertexToCoord(vertexPosition:vec3<f32>) -> vec4<f32>{
//   var worldPos = vec4<f32>(vertexPosition.xyz, 1.0);
//   var fragPosition = globalUniform.viewMat * worldPos ;
//   // var position = globalUniform.projMat * fragPosition ;
//   return fragPosition;
// }

var<private> texSize: vec2<u32>;

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
   var fragCoord = vec2<i32>(globalInvocation_id.xy);
   texSize = textureDimensions(colorMap).xy;
   var color = coordFun(fragCoord);
   // color = vec4(pow(color.rgb,vec3<f32>(1.0/2.4)),1.0);
   textureStore(outputBuffer, fragCoord, color);
}

`
export let DDGILighting_shader = /*wgsl*/`

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

var<private> wsn:vec3<f32>;
var<private> ulitColor:vec3<f32>;

var<private> shadow:f32 = 1.0;

const LUMEN = 10.764;

fn samplePosition(uv:vec2<i32>) -> vec4<f32>
{
   var oc1:vec4<f32> = textureSampleLevel(positionMap, positionMapSampler, vec2<f32>(0.0), 0.0);
   var oc:vec4<f32> = textureLoad(positionMap, uv, 0) ;
   return oc;
}

fn sampleNormal(uv:vec2<i32>) -> vec4<f32>
{
   var oc1:vec4<f32> = textureSampleLevel(normalMap, normalMapSampler, vec2<f32>(0.0), 0.0);
   var oc:vec4<f32> = textureLoad(normalMap, uv, 0);
   return oc;
}

fn sampleColor(uv:vec2<i32>) -> vec4<f32>
{
   var oc1:vec4<f32> = textureSampleLevel(colorMap, colorMapSampler, vec2<f32>(0.0), 0.0);
   var oc:vec4<f32> = textureLoad(colorMap, uv, 0);
   ulitColor = vec3(oc.xyz);
   return oc;
}

fn directionShadowMapping(worldPos:vec3<f32>,shadowBias:f32) {
   var shadowPos = globalUniform.shadowMatrix[0] * vec4<f32>(worldPos.xyz, 1.0);
   var shadowUV = shadowPos.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5) ;
   let texelSize = 1.0 / vec2<f32>(globalUniform.shadowMapSize);

   var visibility = 0.0 ;
   let oneOverShadowDepthTextureSize = texelSize ;
   for (var y = -1; y <= 1; y++) {
       for (var x = -1; x <= 1; x++) {
           let offset = shadowUV * oneOverShadowDepthTextureSize;
           visibility += textureSampleCompareLevel( shadowMap, shadowMapSampler, shadowUV + offset , 0 , shadowPos.z - shadowBias );
       }
   }
   visibility /= 9.0;
   shadowStrut.directShadowVisibility = visibility;
}

fn pointShadowMapCompare(worldPos:vec3<f32>,shadowBias:f32){
   for(var i:i32 = i32(0) ; i < i32(8); i = i + 1 )
   { 
       var v = 1.0 ;
       let light = lightBuffer[i] ;
       if(light.castShadow < 0 ){
         shadowStrut.pointShadows[i] = v ;
         continue ;
       }

       let frgToLight = worldPos - light.position.xyz;
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

fn coordFun(fragCoord:vec2<u32>)-> vec4<f32>{
 var uv = vec2<i32>(i32(fragCoord.x), i32(fragCoord.y)) ;
 var pos = samplePosition(uv);

 var normalMap = sampleNormal(uv);
 wsn = normalMap.xyz * 2.0 - 1.0;
 var normal = normalize( wsn );

 var color = sampleColor(uv);
 var emissive = vec4<f32>(pos.a,normalMap.a,color.a,0.0) * 1.0 ;
 if(pos.w + 1.0 > 10000.0){
   return vec4<f32>(color);
 }
 var V = normalize(pos.xyz - globalUniform.cameraWorldMatrix[3].xyz);
 var N = normal.xyz ;

 directionShadowMapping(pos.xyz,globalUniform.shadowBias);
 pointShadowMapCompare(pos.xyz,globalUniform.shadowBias);

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

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
   var fragCoord = vec2<u32>( globalInvocation_id.x, globalInvocation_id.y);
   var color = coordFun(fragCoord);
   
   // color = vec4(pow(color.rgb,vec3<f32>(1.0/2.4)),1.0);
   textureStore(outputBuffer, vec2<i32>(fragCoord),color);
}

`
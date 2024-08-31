/**
 * @internal
 */
export let LightingFunction_frag: string = /*wgsl*/ `
#include "BRDF_frag"
#include "ClusterLight"
#include "ShadowMapping_frag"

#if USE_IES_PROFILE
  #include "IESProfiles_frag"
#endif



const PI2 = 3.1415926 * 3.1415926 ;

fn sampleLighting(light:LightData,direction:vec3f,iblSpecularResult:vec3f , intensity :f32 , shadow:f32 ) -> vec3f{
  var ret = vec3f(0.0);
  var normalDir  = fragData.N;
  var viewDir    = fragData.V;

  var lightDir   = normalize(-direction.xyz);
  var halfDir    = normalize(lightDir + viewDir);
  var reflectDir = normalize(reflect(-viewDir,normalDir));

  var NdotH = max(0.00001,dot(normalDir,halfDir));
  var NdotL = max(0.00001,dot(normalDir,lightDir));
  var NdotV = max(0.00001,dot(normalDir,viewDir));
  var HdotL = max(0.00001,dot(halfDir,lightDir));

  var baseColor = fragData.Albedo.rgb ; 
  var metallic = fragData.Metallic ;
  var roughness = fragData.Roughness ;

  var lightColor = getHDRColor( light.lightColor.rgb , light.linear )  ;
  var att = max(0.0,intensity);
  
  var lighting:vec3f = lightContribution(NdotH,NdotL,NdotV,HdotL,fragData.Roughness,fragData.Albedo.rgb / 3.14, metallic ,shadow,fragData.F0,lightColor.rgb);
  // lighting = fragData.F0 / 3.1415926 * NdotL ;
  lighting = ACESToneMapping(lighting,att);
  // ret += lighting ;
  return lighting ;
}

fn directLighting( light:LightData , iblSpecularResult : vec3f) -> vec3<f32> {
    var color = vec3<f32>(0.0) ;
    #if USE_LIGHT
      var L = normalize(light.direction.xyz) ;
      #if USE_BRDF
        var shadow = directShadowVisibility[(light.castShadow)] ;
        var att = light.intensity;
        color = sampleLighting(light,L,iblSpecularResult,att, shadow);
      #endif 
    #endif 
    return color;
}

fn directDulLighting( albedo:vec3<f32>, N:vec3<f32>, V:vec3<f32>,  roughness:f32 , metallic:f32 , light:LightData , shadowBias:f32 ) -> vec3<f32> {
  var color = vec3<f32>(0.0) ;
  #if USE_LIGHT
    var L = -normalize(light.direction.xyz) ;
    let lightCC = pow( light.lightColor.rgb,vec3<f32>(2.2));
    var lightColor = getHDRColor( lightCC.rgb , light.linear )  ;
    var att = light.intensity;
    if(light.castShadow>=0){
        #if USE_SHADOWMAPING
          for (var j: i32 = 0; j < 8; j += 1) {
              if(j == light.castShadow){
                att *= directShadowVisibility[j] ; 
              }
          }
        #endif
    }
    #if USE_LAMBERT
      color = vec3<f32>(1.0,1.0,1.0) ;
    #endif 
    
    #if USE_BRDF
      color = 0.85 * simpleBRDF(albedo,N,V,L,att,lightColor,0.85 * roughness,metallic) ;
      color += 0.15 * simpleBRDF(albedo,N,V,L,att,lightColor,0.15 * roughness,metallic) ;
    #endif 
  #endif 
  return color;
}

fn directHairLighting( albedo:vec3<f32>, N:vec3<f32>, V:vec3<f32>,  roughness:f32 , metallic:f32 , light:LightData , shadowBias:f32 ) -> vec3<f32> {
  var color = vec3<f32>(0.0) ;
  #if USE_LIGHT
    var L = -normalize(light.direction.xyz) ;
    let lightCC = pow( light.lightColor.rgb,vec3<f32>(2.2));
    var lightColor = getHDRColor( lightCC.rgb , light.linear )  ;
    var att = light.intensity;
    if(light.castShadow>=0){
        #if USE_SHADOWMAPING
          for (var j: i32 = 0; j < 8; j += 1) {
              if(j == light.castShadow){
                att *= directShadowVisibility[j] ; 
              }
          }
        #endif
    }
    #if USE_LAMBERT
      color = vec3<f32>(1.0,1.0,1.0) ;
    #endif 
    
    #if USE_BRDF
      color = 0.5 * simpleBRDF(albedo,N,V,L,att,lightColor,0.85 ,metallic) ;
      color += 0.5 * simpleBRDF(albedo,N,V,L,att,lightColor,0.15 ,metallic) ;
    #endif 
  #endif 
  return color;
}


fn pointLighting( WP:vec3<f32>, light:LightData , iblSpecularResult : vec3f ) -> vec3<f32> {
    var color = vec3<f32>(0.0) ;
    let lightPos = light.position.xyz;
    var dir = lightPos.xyz - WP ;
    let dist = length(dir);
    if(dist != 0.0){
      dir *= 1.0 / dist ;
    }
    if( abs(dist) < light.range ){
        var L = dir ;
        var atten = 1.0 ;
        atten = 1.0 - smoothstep(0.0,light.range,dist) ;
        atten *= 1.0 / max(light.radius,0.001)  ;

        // if( light.castShadow >= 0 )
        // {
        //     #if USE_SHADOWMAPING
        //       for (var j: i32 = 0; j < 8; j += 1) {
        //           if(j == light.castShadow){
        //             atten *= pointShadows[j] ; 
        //           }
        //       }
        //     #endif
        // }

        var shadow = pointShadows[i32(light.castShadow)] ;

        #if USE_IES_PROFILE
            atten *= getLightIESProfileAtt(WP,light);
        #endif

        atten *= sphere_unit(light.range,light.intensity) ;

        color = sampleLighting(light,-L,iblSpecularResult,atten,shadow);
    } 
    return color ;
}

fn pointAtt( WP:vec3<f32>, light:LightData ) -> f32 {
  var atten = 0.0 ;
  let lightPos = light.position.xyz;
  var dir = lightPos.xyz - WP ;
  let dist = length(dir);
  if(dist != 0.0){
    dir *= 1.0 / dist ;
  }
  if( abs(dist) < light.range ){
      var L = dir ;
      atten = 1.0 - smoothstep(0.0,light.range,dist) ;
      atten *= 1.0 / max(light.radius,0.001)  ;
      var shadow = pointShadows[i32(light.castShadow)] ;
      #if USE_IES_PROFILE
          atten *= getLightIESProfileAtt(WP,light);
      #endif
      atten *= sphere_unit(light.range,light.intensity) ;
  } 
  return atten ;
}

fn getDistanceAtten(  light:LightData , dist : f32 ) -> f32 {
  return 1.0 - smoothstep(0.0,light.range,dist) ;
}

fn spotLighting( WP:vec3<f32>, light:LightData , iblSpecularResult : vec3f) -> vec3<f32> {
    let lightPos = light.position.xyz;
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
        var lightColor = light.lightColor.rgb  ;

        atten = 1.0 - smoothstep(0.0,light.range,dist) ;
        atten *= 1.0 / max(light.radius,0.001) ;
        if(angle < light.outerCutOff){
          if(angle > light.innerCutOff){
            atten *= 1.0 - smoothstep(light.innerCutOff, light.outerCutOff, angle) ;
          }
        }else{
            atten = 0.0 ;
        }

        var shadow = pointShadows[i32(light.castShadow)] ;

        #if USE_IES_PROFILE
            atten *= getLightIESProfileAtt(WP,light);
        #endif

        atten *= sphere_unit(light.range, light.intensity) ;

        color = sampleLighting(light,-L,iblSpecularResult,atten,shadow);
    }
    return  color ;
}

fn sphere_unit( radius:f32 , intensity:f32 ) -> f32 {
  return intensity / (4.0 * PI2 * radius * radius) ;
}
`

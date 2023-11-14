export let LightingFunction_frag: string = /*wgsl*/ `
#include "BRDF_frag"
#include "ClusterLight"
#include "ShadowMapping_frag"

#if USE_IES_PROFILE
  #include "IESProfiles_frag"
#endif



const LUMEN = 10.764;



fn calcAttenuation( d : f32 ,  falloffStart : f32 ,  falloffEnd : f32)-> f32
{
    // Linear falloff.
    return saturate((falloffEnd-d) / (falloffEnd - falloffStart));
}

fn directLighting( albedo:vec3<f32>, N:vec3<f32>, V:vec3<f32>,  roughness:f32 , metallic:f32 , light:LightData , shadowBias:f32 ) -> vec3<f32> {
    var color = vec3<f32>(0.0) ;
    #if USE_LIGHT
      var L = -normalize(light.direction.xyz) ;
      let lightCC = pow( light.lightColor.rgb,vec3<f32>(2.2));
      var lightColor = getHDRColor( lightCC.rgb , light.linear )  ;
      var att = light.intensity / LUMEN ;
      if(light.castShadow>=0){
          #if USE_SHADOWMAPING
            for (var j: i32 = 0; j < 8; j += 1) {
                if(j == light.castShadow){
                  att *= shadowStrut.directShadowVisibility[j] ; 
                }
            }
          #endif
      }

      #if USE_LAMBERT
        color = vec3<f32>(1.0,1.0,1.0) ;
      #endif 
      
      #if USE_BRDF
        color = simpleBRDF(albedo,N,V,L,att,lightColor,roughness,metallic) ;
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
    var att = light.intensity / LUMEN ;
    if(light.castShadow>=0){
        #if USE_SHADOWMAPING
          for (var j: i32 = 0; j < 8; j += 1) {
              if(j == light.castShadow){
                att *= shadowStrut.directShadowVisibility[j] ; 
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
    var att = light.intensity / LUMEN ;
    if(light.castShadow>=0){
        #if USE_SHADOWMAPING
          for (var j: i32 = 0; j < 8; j += 1) {
              if(j == light.castShadow){
                att *= shadowStrut.directShadowVisibility[j] ; 
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


fn pointLighting( albedo:vec3<f32>,WP:vec3<f32>, N:vec3<f32>, V:vec3<f32>, roughness:f32 , metallic:f32 ,light:LightData ) -> vec3<f32> {
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
        atten *= 1.0 / max(light.radius,0.001) * light.intensity / LUMEN;
        if( light.castShadow >= 0 )
        {
            #if USE_SHADOWMAPING
              // atten *= shadowStrut.pointShadows[light.castShadow] ; 
              for (var j: i32 = 0; j < 8; j += 1) {
                  if(j == light.castShadow){
                    atten *= shadowStrut.pointShadows[j] ; 
                  }
              }
            #endif
        }

        #if USE_IES_PROFILE
          atten *= getLightIESProfileAtt(WP,light);
        #endif

        var lightColor = light.lightColor.rgb  ;
        lightColor = getHDRColor(lightColor , light.linear )  ;

        #if USE_LAMBERT
          color = vec3<f32>(1.0,1.0,1.0) ;
        #endif 

        #if USE_BRDF
          color = (simpleBRDF(albedo,N,V,L,atten,lightColor,roughness,metallic))  ;
        #endif 
    } 
    return color ;
}

fn getDistanceAtten(  light:LightData , dist : f32 ) -> f32 {
  return 1.0 - smoothstep(0.0,light.range,dist) ;
}

fn spotLighting( albedo:vec3<f32>,WP:vec3<f32>, N:vec3<f32>, V:vec3<f32>, roughness:f32 , metallic:f32 ,light:LightData ) -> vec3<f32> {
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
        atten *= 1.0 / max(light.radius,0.1) * light.intensity / LUMEN;
        if(angle < light.outerCutOff){
          if(angle > light.innerCutOff){
            atten *= 1.0 - smoothstep(light.innerCutOff, light.outerCutOff, angle) ;
          }
        }else{
            atten = 0.0 ;
        }

        if( light.castShadow >= 0 )
        {
            #if USE_SHADOWMAPING
            for (var j: i32 = 0; j < 8; j += 1) {
                if(j == light.castShadow){
                  atten *= shadowStrut.pointShadows[j] ; 
                }
            }
          #endif
        }

        #if USE_IES_PROFILE
            atten *= getLightIESProfileAtt(WP,light);
        #endif

        lightColor = getHDRColor(lightColor , light.linear ) ;

        #if USE_LAMBERT
          color = vec3<f32>(1.0,0.5,1.0) ;
        #endif 

        #if USE_BRDF
          color = (simpleBRDF(albedo,N,V,L,atten,lightColor,roughness,metallic)) ;
        #endif 
    }
    return  color ;
}
`

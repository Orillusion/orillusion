export let LightingFunction_frag: string = /*wgsl*/ `
#include "BRDF_frag"
#include "LightStruct"
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

fn directLighting( albedo:vec3<f32>, N:vec3<f32>, V:vec3<f32>,  roughness:f32 , light:LightData , shadowBias:f32 ) -> vec3<f32> {
    var color = vec3<f32>(0.0) ;
    #if USE_LIGHT
      var L = -normalize(light.direction.xyz) ;
      let lightCC = pow( light.lightColor.rgb,vec3<f32>(2.2));
      var lightColor = getHDRColor( lightCC.rgb , light.linear )  ;
      var att = light.intensity / LUMEN ;
      if(light.castShadow>=0){
          #if USE_SHADOWMAPING
            att *= shadowStrut.directShadowVisibility[light.castShadow] ; 
          #endif
      }

      #if USE_LAMBERT
        color = vec3<f32>(1.0,0.5,1.0) ;
      #endif 

      #if USE_BRDF
        color = simpleBRDF(albedo,N,V,L,att,lightColor,fragData.Roughness) ;
      #endif 
    #endif 
    return color ;
}

fn pointLighting( albedo:vec3<f32>,WP:vec3<f32>, N:vec3<f32>, V:vec3<f32>, roughness:f32 , light:LightData ) -> vec3<f32> {
    var color = vec3<f32>(0.0) ;
    let lightPos = models.matrix[u32(light.lightMatrixIndex)][3].xyz;
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
            atten *= shadowStrut.pointShadows[light.castShadow] ;
        }

        #if USE_IES_PROFILE
          atten *= getLightIESProfileAtt(WP,light);
        #endif

        var lightColor = light.lightColor.rgb  ;
        lightColor = getHDRColor(lightColor , light.linear )  ;
        // lightColor = LinearToSrgbBranchless(lightColor.rgb) ;

        #if USE_LAMBERT
          color = vec3<f32>(1.0,0.5,1.0) ;
        #endif 

        #if USE_BRDF
          color = (simpleBRDF(albedo,N,V,L,atten,lightColor,fragData.Roughness))  ;
        #endif 
    } 
    return color ;
}

fn getDistanceAtten(  light:LightData , dist : f32 ) -> f32 {
  return 1.0 - smoothstep(0.0,light.range,dist) ;
}

fn spotLighting( albedo:vec3<f32>,WP:vec3<f32>, N:vec3<f32>, V:vec3<f32>, roughness:f32 , light:LightData ) -> vec3<f32> {
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
            atten *= shadowStrut.pointShadows[light.castShadow] ;
        }

        #if USE_IES_PROFILE
            atten *= getLightIESProfileAtt(WP,light);
        #endif

        lightColor = getHDRColor(lightColor , light.linear ) ;

        #if USE_LAMBERT
          color = vec3<f32>(1.0,0.5,1.0) ;
        #endif 

        #if USE_BRDF
          color = (simpleBRDF(albedo,N,V,L,atten,lightColor,fragData.Roughness)) ;
        #endif 
    }
    return  color ;
}
`

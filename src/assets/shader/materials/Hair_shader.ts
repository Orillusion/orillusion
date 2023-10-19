export let Hair_shader_op: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "Hair_frag"

    @group(1) @binding(auto)
    var baseMapSampler: sampler;
    @group(1) @binding(auto)
    var baseMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var idMapSampler: sampler;
    @group(1) @binding(auto)
    var idMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var depthMapSampler: sampler;
    @group(1) @binding(auto)
    var depthMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var rootMapSampler: sampler;
    @group(1) @binding(auto)
    var rootMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var alphaMapSampler: sampler;
    @group(1) @binding(auto)
    var alphaMap: texture_2d<f32>;

    #if USE_CUSTOMUNIFORM
    struct MaterialUniform {
      transformUV1:vec4<f32>,
      transformUV2:vec4<f32>,

      baseColor0: vec4<f32>,
      baseColor1: vec4<f32>,
      emissiveColor: vec4<f32>,
      materialF0: vec4<f32>,
      specularColor: vec4<f32>,
      envIntensity: f32,
      normalScale: f32,
      roughness: f32,
      metallic: f32,

      ao: f32,
      roughness_min: f32,
      roughness_max: f32,
      metallic_min: f32,

      metallic_max: f32,
      emissiveIntensity: f32,
      alphaCutoff: f32,
      ior: f32,

      backlit: f32,
      area: f32,
    };
#endif
    
    var<private> debugOut : vec4f = vec4f(0.0) ;
    var<private> uv : vec2f = vec2f(0.0) ;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;
        uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 

        ORI_ShadingInput.Roughness = materialUniform.roughness;
        ORI_ShadingInput.Metallic = materialUniform.metallic;
        

        #if USE_HAIRCOLOR
            let root = textureSample(rootMap, rootMapSampler, uv ).r ;
            ORI_ShadingInput.BaseColor = mix(materialUniform.baseColor0,materialUniform.baseColor1,root)  ;
        #else
            #if USE_SRGB_ALBEDO
                ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv )  ;
            #else 
                ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv )  ;
            #endif
        #endif

        fragData.Alpha = 1.0 ;
        #if USE_ALPHA_A
        // fragData.Alpha =  textureSampleLevel(alphaMap, alphaMapSampler, uv , 0.0 ).r ;
            // let shake = (globalUniform.frame % 5.0) / 5.0 * 2.0 ;
            fragData.Alpha =  textureSample(alphaMap, alphaMapSampler, uv ).r ;
        #endif

        #if USE_ALPHACUT 
            if( (fragData.Alpha - materialUniform.alphaCutoff) < 0.0 ){
                #if USEGBUFFER
                    ORI_FragmentOutput.worldPos = vec4<f32>(0.0,0.0,0.0,1.0);
                    ORI_FragmentOutput.worldNormal = vec4<f32>(0.0,0.0,0.0,1.0);
                    ORI_FragmentOutput.material = vec4<f32>(0.0,0.0,0.0,1.0);
                #endif
                discard;
            }
        #endif

        #if USE_SHADOWMAPING
            useShadow();
        #endif

        ORI_ShadingInput.Specular = 1.0 ;

        let idMap = textureSampleLevel(idMap, idMapSampler, uv , 0.0 );
        var hairNormal = HairNormal(idMap.r).rgb ;
        hairNormal = transformHairNormal( hairNormal) ;  
        ORI_ShadingInput.HairNormal = hairNormal ;

        ORI_ShadingInput.Normal = unPackRGNormal(vec3f(0.5,0.5,1.0),1.0,1.0) ;

        ORI_ShadingInput.BaseColor.a = fragData.Alpha;
        
        BSSSRDFShading();
    }
`

export let Hair_shader_tr: string = /*wgsl*/ `
#include "Common_vert"
#include "Common_frag"
#include "Hair_frag"

@group(1) @binding(auto)
var baseMapSampler: sampler;
@group(1) @binding(auto)
var baseMap: texture_2d<f32>;

@group(1) @binding(auto)
var idMapSampler: sampler;
@group(1) @binding(auto)
var idMap: texture_2d<f32>;

@group(1) @binding(auto)
var depthMapSampler: sampler;
@group(1) @binding(auto)
var depthMap: texture_2d<f32>;

@group(1) @binding(auto)
var rootMapSampler: sampler;
@group(1) @binding(auto)
var rootMap: texture_2d<f32>;

@group(1) @binding(auto)
var alphaMapSampler: sampler;
@group(1) @binding(auto)
var alphaMap: texture_2d<f32>;

#if USE_CUSTOMUNIFORM
struct MaterialUniform {
  transformUV1:vec4<f32>,
  transformUV2:vec4<f32>,

  baseColor0: vec4<f32>,
  baseColor1: vec4<f32>,
  emissiveColor: vec4<f32>,
  materialF0: vec4<f32>,
  specularColor: vec4<f32>,
  envIntensity: f32,
  normalScale: f32,
  roughness: f32,
  metallic: f32,

  ao: f32,
  roughness_min: f32,
  roughness_max: f32,
  metallic_min: f32,

  metallic_max: f32,
  emissiveIntensity: f32,
  alphaCutoff: f32,
  ior: f32,

  backlit: f32,
  area: f32,
};
#endif

var<private> debugOut : vec4f = vec4f(0.0) ;
var<private> uv : vec2f = vec2f(0.0) ;

fn vert(inputData:VertexAttributes) -> VertexOutput {
    ORI_Vert(inputData) ;
    return ORI_VertexOut ;
}

fn frag(){
    var transformUV1 = materialUniform.transformUV1;
    var transformUV2 = materialUniform.transformUV2;
    uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 

    ORI_ShadingInput.Roughness = materialUniform.roughness;
    ORI_ShadingInput.Metallic = materialUniform.metallic;

    #if USE_HAIRCOLOR
        let root = textureSample(rootMap, rootMapSampler, uv ).r ;
        ORI_ShadingInput.BaseColor = mix(materialUniform.baseColor0,materialUniform.baseColor1,root)  ;
    #else
        #if USE_SRGB_ALBEDO
            ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv )  ;
        #else 
            ORI_ShadingInput.BaseColor = textureSample(baseMap, baseMapSampler, uv )  ;
        #endif
    #endif

    fragData.Alpha = 1.0 ;
    #if USE_ALPHA_A
        fragData.Alpha =  textureSampleLevel(alphaMap, alphaMapSampler, uv , 0.0 ).r ;
    #endif

    #if USE_ALPHACUT 
        if( (((1.0 - fragData.Alpha) - (1.0 - materialUniform.alphaCutoff))) < 0.0 ){
            #if USEGBUFFER
                ORI_FragmentOutput.worldPos = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.worldNormal = vec4<f32>(0.0,0.0,0.0,1.0);
                ORI_FragmentOutput.material = vec4<f32>(0.0,0.0,0.0,1.0);
            #endif
            discard;
        }
    #endif

    #if USE_SHADOWMAPING
        useShadow();
    #endif

    ORI_ShadingInput.Specular = 1.0 ;

    let idMap = textureSampleLevel(idMap, idMapSampler, uv , 0.0 );
    var hairNormal = HairNormal(idMap.r).rgb ;
    hairNormal = transformHairNormal( hairNormal) ;  
    ORI_ShadingInput.HairNormal = hairNormal ;

    ORI_ShadingInput.Normal = unPackRGNormal(vec3f(0.5,0.5,1.0),1.0,1.0) ;

    ORI_ShadingInput.BaseColor.a = fragData.Alpha;
    
    BSSSRDFShading();
}
`


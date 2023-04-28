
export let PointShadowDebug:string = /*wgsl*/`
        #include "Common_vert"
        #include "Common_frag"
        #include "UnLit_frag"

        @group(1) @binding(auto) var pointShadowMapSampler: sampler;
        @group(1) @binding(auto) var pointShadowMap: texture_depth_cube ;

        struct MaterialUniform {
            center: vec3<f32>,
        };
      
        @group(2) @binding(0)
        var<uniform> materialUniform: MaterialUniform;

        fn vert(inputData:VertexAttributes) -> VertexOutput {
            ORI_Vert(inputData) ;
            return ORI_VertexOut ;
        }
 
        fn frag(){

            var center = materialUniform.center ; 

            var dir = normalize(ORI_VertexVarying.vWorldPos.xyz - center) ;
            var depth = textureSample(pointShadowMap,pointShadowMapSampler,dir.xyz) ;
            depth = depth * globalUniform.far ;

            ORI_ShadingInput.BaseColor = vec4<f32>(depth*255.0,0.0,0.0,1.0)  ;
            UnLit();
        }
    `

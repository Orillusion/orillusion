export let Lambert_shader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "ClusterLight"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 
        let baseColor = textureSample(baseMap,baseMapSampler,uv) ;
        if(baseColor.w < 0.5){
            discard ;
        }

        var lightColor = vec4<f32>(0.0);
        let lightIndex = getCluster();
        let start = max(lightIndex.start, 0.0);
        let count = max(lightIndex.count, 0.0);
        let end = max(start + count , 0.0);
        for(var i:i32 = i32(start) ; i < i32(end); i += 1 )
        {
          let light = getLight(i32(i));
  
          switch (light.lightType) {
            case PointLightType: {
            }
            case DirectLightType: {
                var normal = ORI_VertexVarying.vWorldNormal ;
                let intensity = (light.intensity/10.0);
                let att = max(dot(normal,-light.direction),0.0) * intensity ;
                lightColor += baseColor * att * 0.5 + baseColor * 0.5 ; 
                // lightColor = baseColor * 0.5; 
            }
            case SpotLightType: {
            }
            default: {
            }
          }
        }
        
        ORI_ShadingInput.BaseColor = lightColor * materialUniform.baseColor ;
        ORI_ShadingInput.BaseColor.w = 1.0 ;
        UnLit();

        // let n = globalUniform.near ;
        // let f = globalUniform.far ;
        // let z = ORI_VertexVarying.fragCoord.z ;
        // ORI_FragmentOutput.out_depth = z * (n/(f-n)) ;
    }
`


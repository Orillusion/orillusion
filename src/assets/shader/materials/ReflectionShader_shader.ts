/**
 * @internal
 */
export let ReflectionShader_shader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "GlobalUniform"
    #include "BitUtil"
    #include "MathShader"
    #include "ReflectionCG"
    #include "ColorUtil_frag"
    
    struct MaterialUniform {
        transformUV1:vec4<f32>,
        transformUV2:vec4<f32>,
        baseColor: vec4<f32>,
        alphaCutoff: f32,
        reflectionIndex : f32,
    };

    // @group(1) @binding(0)
    // var baseMapSampler: sampler;
    // @group(1) @binding(1)
    // var baseMap: texture_2d<f32>;
    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        useSphereReflection();
        var finalColor : vec3f ;
        let scale = vec2f(1.0/8.0,1.0/globalUniform.reflectionProbeMaxCount) ;
        var uv = (octEncode(-ORI_VertexVarying.vWorldNormal) + 1.0) * 0.5 ;
        var uv1 = uv * scale + vec2f(0.0,(materialUniform.reflectionIndex * scale.y )) ;
        let gBuffer = textureSampleLevel(reflectionMap,reflectionMapSampler,uv1,0.0);
        ORI_ShadingInput.BaseColor = vec4f(gBuffer.rgb,1.0) ;
        UnLit();
    }

    fn UnLit(){
        var viewColor = ORI_ShadingInput.BaseColor ;
            let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
            let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
            let ORI_NORMALMATRIX = transpose(inverse( nMat ));

            var vNormal = normalize(ORI_NORMALMATRIX * (ORI_VertexVarying.vWorldNormal ));
            var worldNormal = vec3<f32>( (vNormal.xyz + 1.0) * 0.5);

            let gBuffer = packNHMDGBuffer(
                ORI_VertexVarying.fragCoord.z,
                vec3f(0.0),
                viewColor.rgb,
                vec3f(0.0),
                vNormal,
                viewColor.a
            );

            #if USE_CASTREFLECTION
                ORI_FragmentOutput.gBuffer = gBuffer ;
            #else
                ORI_FragmentOutput.color = viewColor ;
                ORI_FragmentOutput.gBuffer = gBuffer ;
            #endif
    }
`


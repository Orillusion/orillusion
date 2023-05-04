export let OutlinePass: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;


    struct MaterialUniform {
        baseColor:vec4<f32>,
        lineWeight:f32
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    fn vert(vertex:VertexAttributes) -> VertexOutput {
        var vertexPosition = vertex.position;
        var vertexNormal = vertex.normal;

                #if USE_MORPHTARGETS
                    vertexPosition = vertexPosition * morphTargetData.morphBaseInfluence + vertex.a_morphPositions_0 * morphTargetData.morphInfluence0;
                    #if USE_MORPHNORMALS
                        vertexNormal = vertexNormal * morphTargetData.morphBaseInfluence + vertex.a_morphNormals_0 * morphTargetData.morphInfluence0;
                    #endif
                #endif

                #if USE_SKELETON
                    #if USE_JOINT_VEC8
                        let skeletonNormal = getSkeletonWorldMatrix_8(vertex.joints0, vertex.weights0, vertex.joints1, vertex.weights1);
                        ORI_MATRIX_M *= skeletonNormal ;
                        // vertexNormal = vec4<f32>(vec4<f32>(vertexNormal,0.0) * skeletonNormal).xyz; 
                    #else
                        let skeletonNormal = getSkeletonWorldMatrix_4(vertex.joints0, vertex.weights0);
                        ORI_MATRIX_M *= skeletonNormal ;
                        // vertexNormal = vec4<f32>(vec4<f32>(vertexNormal,0.0) * skeletonNormal).xyz; 
                    #endif
                #endif


                #if USE_TANGENT
                    ORI_VertexOut.varying_Tangent = vertex.TANGENT ;
                #endif

                ORI_NORMALMATRIX = transpose(inverse( mat3x3<f32>(ORI_MATRIX_M[0].xyz,ORI_MATRIX_M[1].xyz,ORI_MATRIX_M[2].xyz) ));

                let worldNormal = normalize(ORI_NORMALMATRIX * vertexNormal.xyz) ;

                vertexPosition = vertexPosition + worldNormal * materialUniform.lineWeight ;

                var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));
                var viewPosition = ORI_MATRIX_V * worldPos;
                var clipPosition = ORI_MATRIX_P * viewPosition ;

                ORI_VertexOut.varying_UV0 = vertex.uv.xy ;
                ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;
                ORI_VertexOut.varying_ViewPos = viewPosition / viewPosition.w;
                ORI_VertexOut.varying_Clip = clipPosition ;
                ORI_VertexOut.varying_WPos = worldPos ;
                ORI_VertexOut.varying_WPos.w = f32(vertex.index);
                ORI_VertexOut.varying_WNormal = worldNormal ;
                ORI_VertexOut.member = clipPosition ;


        return ORI_VertexOut ;
    }

    fn frag(){
        let color = textureSample(baseMap,baseMapSampler,ORI_VertexVarying.fragUV0) ;
        ORI_ShadingInput.BaseColor = color * materialUniform.baseColor ;
        ORI_ShadingInput.Roughness = 0.5  ;
        ORI_ShadingInput.Metallic = 0.5 ;
        ORI_ShadingInput.Specular = 0.5 ;
        ORI_ShadingInput.AmbientOcclusion = 1.0 ;
        ORI_ShadingInput.EmissiveColor = vec4<f32>(0.0);
        ORI_ShadingInput.Normal = ORI_VertexVarying.vWorldNormal.rgb ;
        UnLit();
    }
`


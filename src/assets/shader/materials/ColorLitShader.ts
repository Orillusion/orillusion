export class ColorLitShader {
    public static Ori_AllShader:string = /*wgsl*/`
        #include "Common_vert"
        #include "Common_frag"
        #include "BxDF_frag"

        fn vert(inputData:VertexAttributes) -> VertexOutput {
            ORI_Vert(inputData) ;
            return ORI_VertexOut ;
        }

        fn frag(){
            ORI_ShadingInput.BaseColor = materialUniform.baseColor ;
            ORI_ShadingInput.Roughness = materialUniform.roughness  ;
            ORI_ShadingInput.Metallic = materialUniform.metallic ;
            ORI_ShadingInput.Specular = 0.5 ;
            ORI_ShadingInput.AmbientOcclusion = materialUniform.ao ;
            ORI_ShadingInput.EmissiveColor = vec4<f32>(0.0);

            ORI_ShadingInput.Normal = ORI_VertexVarying.vWorldNormal.rgb ;

            #if USE_SHADOWMAPING
                directShadowMaping(globalUniform.shadowBias);
                pointShadowMapCompare(globalUniform.pointShadowBias);
            #endif

            BxDFShading();
        }
    `
}

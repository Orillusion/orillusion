export let PavementShader:string = /*wgsl*/`
        #include "Common_vert"
        #include "Common_frag"
        #include "BxDF_frag"

        @group(1) @binding(auto)
        var rtColorTex: texture_2d<f32>;

        @group(1) @binding(auto)
        var baseMapSampler: sampler;
        @group(1) @binding(auto)
        var baseMap: texture_2d<f32>;

        @group(1) @binding(auto)
        var normalMapSampler: sampler;
        @group(1) @binding(auto)
        var normalMap: texture_2d<f32>;

        @group(1) @binding(auto)
        var displaceMapSampler: sampler;
        @group(1) @binding(auto)
        var displaceMap: texture_2d<f32>;

        @group(1) @binding(auto)
        var aoMapSampler: sampler;
        @group(1) @binding(auto)
        var aoMap: texture_2d<f32>;
 
        @group(1) @binding(auto)
        var reflectMapSampler: sampler;
        @group(1) @binding(auto)
        var reflectMap: texture_2d<f32>;

        fn vert(inputData:VertexAttributes) -> VertexOutput {
            ORI_Vert(inputData) ;
            // let displaceDimensions = textureDimensions(displaceMap) ;
            // let displace = textureGather(0,displaceMap,displaceMapSampler,inputData.uv) ;
            // ORI_VertexOut.member.y += displace.r * 10.0;
            return ORI_VertexOut ;
        }

        fn frag(){
            var screenUV = ORI_VertexVarying.fragPosition.xy / ORI_VertexVarying.fragPosition.w;
            screenUV = (screenUV.xy + 1.0) * 0.5;
            screenUV.y = 1.0 - screenUV.y;

            let FrameMap = textureSample(rtColorTex,baseMapSampler,screenUV);

            let Albedo = textureSample(baseMap,baseMapSampler,ORI_VertexVarying.fragUV0);
            var Normal = textureSample(normalMap,normalMapSampler,ORI_VertexVarying.fragUV0).rgb ;
            Normal.y = 1.0 - Normal.y ;
            let Displace = textureSample(displaceMap,displaceMapSampler,ORI_VertexVarying.fragUV0).rgb ;
            let Ao = textureSample(aoMap,aoMapSampler,ORI_VertexVarying.fragUV0).r ;
            let ReflectMap = 1.0 - textureSample(reflectMap,reflectMapSampler,ORI_VertexVarying.fragUV0).r ;

            ORI_ShadingInput.BaseColor = FrameMap * materialUniform.baseColor * vec4<f32>(LinearToGammaSpace(Albedo.rgb),1.0);
            ORI_ShadingInput.Roughness = ReflectMap * materialUniform.roughness  ;
            ORI_ShadingInput.Metallic = materialUniform.metallic ;
            ORI_ShadingInput.Specular = 0.5 ;
            ORI_ShadingInput.AmbientOcclusion = Ao * materialUniform.ao ;
            ORI_ShadingInput.EmissiveColor = vec4<f32>(0.0);

            let normal = unPackRGNormal(Normal,Displace.r*materialUniform.normalScale,1.0) ;
            ORI_ShadingInput.Normal = normal ;

            BxDFShading();
        }
    `

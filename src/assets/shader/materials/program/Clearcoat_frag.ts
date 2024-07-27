/**
 * @internal
 */
export let Clearcoat_frag: string = /*wgsl*/ `
    #if USE_CLEARCOAT_ROUGHNESS
    @group(1) @binding(auto)
    var clearCoatRoughnessMapSampler: sampler;
    @group(1) @binding(auto)
    var clearCoatRoughnessMap: texture_2d<f32>;

    fn getClearcoatRoughness() -> f32{
        let clearcoatRoughness = textureSample(clearCoatRoughnessMap, clearCoatRoughnessMapSampler, ORI_VertexVarying.fragUV0.xy).g;
        return clearcoatRoughness;
    }

    fn getClearcoatWeight() -> f32{
        let clearcoatWeight = textureSample(clearCoatRoughnessMap, clearCoatRoughnessMapSampler, ORI_VertexVarying.fragUV0.xy).r;
        return clearcoatWeight;
    }
    #else
    fn getClearcoatRoughness() -> f32{
        return 1.0;
    }
    fn getClearcoatWeight() -> f32{
        return 1.0;
    }
    #endif

    #if USE_CLEARCOAT
    fn ClearCoat_BRDF( baseColor:vec3<f32>, clearCoatColor:vec3<f32> , clearCoatIor:f32 ,N:vec3<f32>, L:vec3<f32> ,  V:vec3<f32> , clearCoatPerceptualRoughness:f32 ,lightColor:vec3f, att:f32) -> vec3<f32> {
        var factor = clamp(clearCoatPerceptualRoughness, 0.0001, 1.0);
        var clearCoatRoughness = factor ;
        let lightDir = -L ;
        let H = normalize( V + lightDir);
        // let LoH = dot(lightDir,H);
        let NoV = max(dot(N,V),0.00001);
        // let NoL = max(dot(N,lightDir),0.00001);
        // let NoH = max(dot(N,H),0.00001);

        // let clearSpeclur = IBLEnv2(fragData.R,clearCoatRoughness);
        // let F0 = IORToF0(clearCoatIor);
        // let Fr = FresnelSchlickRoughness( NoV , vec3<f32>(clearCoatColor) , clearCoatRoughness ) ;
        // var Fd = clearCoatColor ;
        // clear coat BRDF
        // var Dc = D_GGX(NoH,clearCoatRoughness);
        // var Vc = V_Kelemen(LoH) * NoL;
        // var Fc = F_Schlick2( vec3<f32>(F0) , NoV) ;
        // var Frc = (Dc * Vc) * Fc;
        // base layer attenuation for energy compensation
        // let oneMinusFc  = 1.0 - Fc;

        // let brdfSpecular = clearSpeclur * ((Fd + Fr * oneMinusFc) * oneMinusFc + Frc)  * att * lightColor; 
        var iblSpecular = vec3<f32>(0.0);
        // return brdfSpecular ;

        iblSpecular = indirectionSpec_Function(fragData.R,clearCoatRoughness,NoV,1.0,(clearCoatColor * att * vec3f(IORToF0(clearCoatIor))));
        // iblSpecular = IBLEnv2(fragData.R,clearCoatRoughness);
        // return mix(baseColor , brdfSpecular + iblSpecular ,fragData.ClearcoatFactor) ;
        // return vec3f(baseColor + (clearCoatColor * iblSpecular) * fragData.ClearcoatFactor) ;
        return mix(baseColor , (clearCoatColor * iblSpecular) , fragData.ClearcoatFactor) ;
        // return iblSpecular ;
    }
    #endif
`
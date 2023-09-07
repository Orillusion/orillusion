



export let Clearcoat_frag: string = /*wgsl*/ `
    #if USE_CLEARCOAT_ROUGHNESS
    @group(1) @binding(auto)
    var clearCoatRoughnessMapSampler: sampler;
    @group(1) @binding(auto)
    var clearCoatRoughnessMap: texture_2d<f32>;

    fn getClearcoatRoughness() -> f32{
        let clearcoatRoughness = textureSample(clearCoatRoughnessMap, clearCoatRoughnessMapSampler, ORI_VertexVarying.fragUV0.xy).r;
        return clearcoatRoughness;
    }
    #else
    fn getClearcoatRoughness() -> f32{
        return 1.0;
    }
    #endif

    #if USE_CLEARCOAT
    fn ClearCoat_BRDF( baseColor:vec3<f32>, clearCoatColor:vec3<f32> , ior:f32 ,N:vec3<f32>, L:vec3<f32> ,  V:vec3<f32> , clearCoatStrength:f32, clearCoatPerceptualRoughness:f32 , att:f32) -> vec3<f32> {
        var factor = clamp(clearCoatPerceptualRoughness, 0.0001, 1.0);
        var clearCoatRoughness = factor * factor;

        let H = normalize(-V + L);
        let R = 2.0 * dot( -V , N ) * N + V ;
        let LoH = dot(L,H);
        let NoV = max(dot(N,-V),0.0);
        let NoL = max(dot(N,L),0.0);
        let NoH = max(dot(N,H),0.00001);

        let Fr = FresnelSchlickRoughness( NoV , vec3<f32>(0.0) , clearCoatRoughness ) ;
        var Fd = clearCoatColor / 3.1415926 ;
        let F0 = IORToF0(ior) ;
        // clear coat BRDF
        var Dc = D_GGX(NoH,clearCoatRoughness);
        var Vc = V_Kelemen(LoH) * NoL;
        var Fc = F_Schlick( vec3<f32>(F0) , 1.0, NoV) * materialUniform.clearcoatFactor;
        var Frc = (Dc * Vc) * Fc;
        // base layer attenuation for energy compensation
        let oneMinusFc  = 1.0 - Fc;
        let brdfSpecular = ((Fd + Fr * oneMinusFc) * oneMinusFc + Frc)  * att ; 
        var iblSpecular = vec3<f32>(brdfSpecular);
        iblSpecular += approximateSpecularIBL(vec3<f32>(1.0),clearCoatRoughness,R, NoV) * Fc ;
        return vec3<f32>(mix(baseColor,iblSpecular,materialUniform.clearcoatWeight));
    }
    #endif
`
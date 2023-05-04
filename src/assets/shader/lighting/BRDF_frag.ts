export let BRDF_frag: string = /*wgsl*/ `
#include "Clearcoat_frag"
    #include "EnvMap_frag"
    #include "BrdfLut_frag"

    struct FragData {
        Ao: f32,
        Metallic: f32,
        Roughness: f32,

        Albedo: vec4<f32>,
        Emissive: vec3<f32>,

        N: vec3<f32>,
        V: vec3<f32>,
        R: vec3<f32>,

        F0: vec3<f32>,
        F: vec3<f32>,
        KS: vec3<f32>,
        KD: vec3<f32>,
        Shadow: f32,
        Indirect: f32,
        Reflectance: f32,

        NoV: f32,
        FaceDirection:f32,

        DiffuseColor: vec3<f32>,
        SpecularColor: vec3<f32>,
        ClearcoatRoughness:f32,
        EnvColor: vec3<f32>,
        Irradiance: vec3<f32>,
    };

    var<private> fragData: FragData;

    struct BxDFContext
    {
        NoV : f32 ,
        NoL : f32 ,
        VoL : f32 ,
        NoH : f32 ,
        VoH : f32
    };

    fn getContext( N:vec3<f32>, V:vec3<f32>, H:vec3<f32>, L:vec3<f32> ) -> BxDFContext
    {
        var Context:BxDFContext ;
        Context.NoL = saturate(dot(N, L))  ;
        Context.NoV = saturate(dot(N, V))  ;
        Context.VoL = saturate(dot(V, L)) ;
        Context.NoH = saturate(dot(N, H));
        Context.VoH = saturate(dot(V, H));

        // Context.NoL = max(dot(N, L),0.0);
        // Context.NoV = max(dot(N, V),0.0);
        // Context.VoL = max(dot(V, L),0.0) ;
        // Context.NoH = saturate(dot(N, H));
        // Context.VoH = max(dot(V, H),0.0);
        return Context ;
    }

    // convert roughness to mipmapLevel
    fn roughnessToMipmapLevel( roughness: f32 , mipmapCount:i32 ) -> f32{
        let level = roughness * (1.7 - 0.7 * roughness );
        return level * f32(mipmapCount);
    }

    fn Fd90( NoL:f32, roughness:f32) -> f32
    {
        return (2.0 * NoL * roughness) + 0.4;
    }

    fn KDisneyTerm( NoL:f32, NoV:f32 , roughness:f32) -> f32
    {
        return (1.0 + Fd90(NoL, roughness) * pow(1.0 - NoL, 5.0)) * (1.0 + Fd90(NoV, roughness) * pow(1.0 - NoV, 5.0));
    }

    fn FresnelSchlick( NoV:f32,  F0:vec3<f32>) -> vec3<f32>
    {
        return F0 + (1.0 - F0) * pow(1.0 - NoV, 5.0);
    }

    fn FresnelSchlickRoughness( NoV:f32,  F0:vec3<f32>,  roughness:f32) -> vec3<f32>
    {
        return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - NoV, 5.0);
    }

    fn DistributionGGX( NdotH:f32 ,  roughness:f32 ) -> f32
    {
        let alpha = roughness * roughness;
        let alpha2 = roughness * roughness;

        let NdotH2 = NdotH * NdotH;

        let nom   = alpha2;
        var denom = (NdotH2 * (alpha2 - 1.0) + 1.0);
        denom = PI * denom * denom;

        return nom / denom;
    }

    // [Heitz 2014, "Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs"]
    fn Vis_SmithJoint( NoV : f32 ,  NoL : f32 ,  a2 : f32) -> f32
    {
        var Vis_SmithV = NoL * sqrt(NoV * (NoV - NoV * a2) + a2);
        var Vis_SmithL = NoV * sqrt(NoL * (NoL - NoL * a2) + a2);
        return 0.5 * rcp(Vis_SmithV + Vis_SmithL);
    }

    fn GeometrySchlickGGX( NdotV : f32 , roughness : f32 ) -> f32
    {
        //roughness compute ks
        let r = (roughness + 1.0);
        let k = (r*r) / 8.0;

        let nom   = NdotV;
        let denom = NdotV * (1.0 - k) + k;
        
        return nom / denom;
    }
    
    fn GeometrySmith( NdotV:f32 , NdotL:f32 , roughness : f32) -> f32
    {
        // let NdotV = max(dot(N, V), 0.0);
        // let NdotL = max(dot(N, L), 0.0);
        let ggx1 = GeometrySchlickGGX(NdotV, roughness);
        let ggx2 = GeometrySchlickGGX(NdotL, roughness);
        return ggx1 * ggx2;
    }

    fn GeometryAttenuationGGXSmith( NdotL:f32,  NdotV:f32,  roughness:f32) -> f32
    {
        var NdotL2 = NdotL * NdotL;
        var NdotV2 = NdotV * NdotV;
        var kRough2 = roughness * roughness + 0.0001;

        var ggxL = (2.0 * NdotL) / (NdotL + sqrt(NdotL2 + kRough2 * (1.0 - NdotL2)));
        var ggxV = (2.0 * NdotV) / (NdotV + sqrt(NdotV2 + kRough2 * (1.0 - NdotV2)));

        return ggxL * ggxV;
    }

    fn colorLinear( colorVector:vec3<f32> ) -> vec3<f32>
    {
        var linearColor = pow(colorVector.rgb, vec3<f32>(2.2));
        return linearColor;
    }

    fn computeFresnelSchlick( NoV:f32 , F0:vec3<f32>) -> vec3<f32>
    {
        return F0 + (1.0 - F0) * pow(clamp(1.0 - NoV,0.0,1.0), 5.0);
    }

    fn computeFresnelSchlickRoughness(NoV:f32 , F0:vec3<f32>,  roughness:f32) -> vec3<f32>
    {
        return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - fragData.NoV,0.0,1.0), 5.0);
    }

    fn computeDistributionGGX( N:vec3<f32>,  H:vec3<f32>,  roughness:f32) -> f32
    {
        var alpha = roughness * roughness;
        var alpha2 = alpha * alpha; 

        var NdotH = saturate(dot(N, H));
        var NdotH2 = NdotH * NdotH;

        return (alpha2) / (PI * (NdotH2 * (alpha2 - 1.0) + 1.0) * (NdotH2 * (alpha2 - 1.0) + 1.0));
    }

    fn D_GGX( N:vec3<f32>,  H:vec3<f32>,  roughness:f32 ) -> f32
    {
        var NoH = saturate(dot(N, H));
        var d = ( NoH * roughness - NoH ) * NoH + 1.0;	// 2 mad
        return roughness / ( PI*d*d );					// 4 mul, 1 rcp
    }

    fn computeGeometryAttenuationGGXSmith( NdotL:f32 ,  NdotV:f32,  roughness:f32) -> f32
    {
        var NdotL2 = NdotL * NdotL;
        var NdotV2 = NdotV * NdotV;
        var kRough2 = roughness * roughness + 0.0001;

        var ggxL = (2.0 * NdotL) / (NdotL + sqrt(NdotL2 + kRough2 * (1.0 - NdotL2)));
        var ggxV = (2.0 * NdotV) / (NdotV + sqrt(NdotV2 + kRough2 * (1.0 - NdotV2)));

        return ggxL * ggxV;
    }

    fn Vis_Smith(  NoL:f32 ,  NoV:f32,  a2:f32 )-> f32
    {
        var Vis_SmithV = NoV + sqrt( NoV * (NoV - NoV * a2) + a2 );
        var Vis_SmithL = NoL + sqrt( NoL * (NoL - NoL * a2) + a2 );
        return rcp( Vis_SmithV * Vis_SmithL );
    }

    fn simpleBRDF( albedo:vec3<f32>, N:vec3<f32>, V:vec3<f32>,L:vec3<f32>,att:f32,lightColor:vec3<f32>,roughness:f32 )-> vec3<f32>{
        let H = normalize(V + L);
        let Context:BxDFContext = getContext(N,V,H,L);

        let D = DistributionGGX( Context.NoH , roughness);
        let G = GeometrySmith(Context.NoV,Context.NoL, roughness );
        let F = FresnelSchlick(Context.VoH, vec3<f32>(fragData.F0));
        let specular = ( D * G * F ) / (4.0 * Context.NoV * Context.NoL + 0.001);
        let kS = F;
        var kd = 1.0 - kS ;
        kd *= 1.0 - fragData.Metallic ;
        var diffuse = kd * (albedo.rgb / PI ) ;
        let ambient = specular.rgb ;

        fragData.KD += kd;
        fragData.KS += F;

        var col = (diffuse + ambient) * Context.NoL * lightColor * att ;
        // var col = (diffuse + ambient) * Context.NoL * lightColor ;
        return (col.rgb ) ;
    }

    fn getSpecularDominantDir (  N : vec3<f32> , R : vec3<f32> , roughness : f32 ) -> vec3<f32>
    {
        var smoothness = saturate (1.0 - roughness );
        var lerpFactor = smoothness * ( sqrt ( smoothness ) + roughness );
        // The result is not normalized as we fetch in a cubemap
        return mix (N, R, lerpFactor );
    }

    fn approximateSpecularIBL( specularColor:vec3<f32> , roughness:f32 , R:vec3<f32>) -> vec3<f32> {
        let NoV = fragData.NoV ;
        let MAX_REFLECTION_LOD  = i32(textureNumLevels(prefilterMap)) ;
        let mip = roughnessToMipmapLevel(roughness,MAX_REFLECTION_LOD);
        var prefilteredColor: vec3<f32> = (textureSampleLevel(prefilterMap, prefilterMapSampler, getSpecularDominantDir(fragData.N,R,roughness) , mip ).rgb);
        prefilteredColor = globalUniform.skyExposure * LinearToGammaSpace(prefilteredColor);
        var envBRDF = textureSampleLevel(brdflutMap, brdflutMapSampler, vec2<f32>(NoV, roughness) , 0.0 ) ;
        return prefilteredColor * (specularColor.rgb * envBRDF.x + saturate( 50.0 * specularColor.g ) * envBRDF.y) ;
    }

    fn fresnel_coat(n:vec3<f32>,v:vec3<f32>,ior:f32) -> f32 {
        var f0 = (1.0-ior)/(1.0+ior);
        f0 = f0 * f0  ;
        let fr = pow((f0 + (1.0 - f0)*(1.0 - abs( max(dot(n,v),0.0) ))) , 5.0 ) ;  
        return fr ;
    }

    fn reflectEnvMap(n:vec3<f32> , v:vec3<f32> , roughness:f32) -> vec3<f32> {
        let MAX_REFLECTION_LOD  = i32(textureNumLevels(envMap)) ;
        let mip = roughnessToMipmapLevel(roughness,MAX_REFLECTION_LOD);
        let R = 2.0 * dot( v , n ) * n - v ;
        var prefilteredColor: vec3<f32> = globalUniform.skyExposure * (textureSampleLevel(envMap, envMapSampler, R , mip ).rgb);
        prefilteredColor = LinearToGammaSpace(prefilteredColor);
        return prefilteredColor ;
    }

    fn Specular_D_GGX( NoH:f32,  roughness:f32 ) -> f32
    {
        let a2 = roughness * roughness ;
        let f = (NoH * a2 - NoH) * NoH + 1.0;
        return a2 / (PI * f * f) ;
    }

    fn V_Kelemen( LoH : f32 ) -> f32 {
        return 0.25 / (LoH * LoH);
    }

    fn F_Schlick( f0:vec3<f32> ,  f90 : f32 ,  VoH : f32 ) -> vec3<f32> {
        return f0 + (f90 - f0) * pow(1.0 - VoH,5.0);
    }

    //https://google.github.io/filament/Filament.html materialsystem/clearcoatmodel/clearcoatparameterization
    fn CoatSpecular_brdf( f:vec3<f32>, s:vec3<f32>, n:vec3<f32> , v:vec3<f32> , l:vec3<f32> , att:f32 , layer :vec3<f32>) -> vec3<f32> {
        let H = normalize(v + l); 
        let VdotNc = max(dot(v,n),0.0);
        let LdotNc = max(dot(l,n),0.0);
        let NoH = max(dot(n,H),0.0);
        let LoH = clamp(dot(l,H),0.0,1.0);
        let NoL = max(dot(n,l),0.0);

        let Fd = f ; 
        let Fr = s ; 

        let clearcoatRoughnessFactor = clamp(materialUniform.clearcoatRoughnessFactor,0.089,1.0);
        let clearCoatRoughness = clearcoatRoughnessFactor * clearcoatRoughnessFactor ;

        let Dc = Specular_D_GGX( NoH , clearCoatRoughness ) ;
        let Vc = V_Kelemen( LoH ) ;
        let Fc = F_Schlick(vec3<f32>(0.04), clearCoatRoughness , pow(LoH,2.0)); 
        let Frc = (Dc * Vc) * Fc ;
        // return layer * vec3<f32>((Fd + Fr * (1.0 - Fc)) * (1.0 - Fc) + Frc) ;//* NoL;
        return layer * vec3<f32>((Fd + Fr * (1.0 - Fc)) * (1.0 - Fc) + Frc) * ( 0.5 + NoL * 0.5 ) ;
    }

    fn approximate_coating(base:vec3<f32> , clearColor: vec3<f32>, n:vec3<f32> , v:vec3<f32> , light:LightData ) -> vec3<f32> {
        let clearcoatRoughnessFactor = clamp(materialUniform.clearcoatRoughnessFactor,0.084,1.0);
        var clearcoatAlpha = clearcoatRoughnessFactor * clearcoatRoughnessFactor + fragData.ClearcoatRoughness;

        // var lightColor = getHDRColor( lightCC.rgb , light.linear )  ;
        var att = light.intensity ;
        let l = light.direction ;
   
        let NdotV = max(dot(n,v),0.0);
        let MAX_REFLECTION_LOD  = i32(textureNumLevels(prefilterMap)) ;
        let mip = roughnessToMipmapLevel(clearcoatAlpha,MAX_REFLECTION_LOD);
        let R = 2.0 * dot( v , n ) * n - v ;
        var envIBL: vec3<f32> = globalUniform.skyExposure * (textureSampleLevel(prefilterMap, prefilterMapSampler, R ,mip ).rgb) ;
        envIBL = LinearToGammaSpace(envIBL);

        let clearCoat = materialUniform.clearcoatFactor ;
        let f = FresnelSchlickRoughness( max(dot(n,v),0.0) , vec3<f32>(0.0) , clearcoatAlpha ) ;
        let clearcoat_brdf = (f * envIBL) + CoatSpecular_brdf( clearColor , vec3<f32>( clearCoat ) , n , v , -l , att , envIBL ) ;

        // return clearcoat_brdf;+ fragData.ClearcoatRoughness 
        return mix(base,clearcoat_brdf,materialUniform.clearcoatWeight ) ;
    }
`






export let Clearcoat_frag: string = /*wgsl*/ `
    #if USE_CLEARCOAT_ROUGHNESS
    @group(1) @binding(auto)
    var clearCoatRoughnessMapSampler: sampler;
    @group(1) @binding(auto)
    var clearCoatRoughnessMap: texture_2d<f32>;

                fn getClearcoatRoughnees() -> f32{
        let clearcoatRoughness = textureSample(clearCoatRoughnessMap, clearCoatRoughnessMapSampler, ORI_VertexVarying.fragUV0.xy).r;
        return clearcoatRoughness;
    }
    #else
                fn getClearcoatRoughnees() -> f32{
        return 0.0;
    }
    #endif
`
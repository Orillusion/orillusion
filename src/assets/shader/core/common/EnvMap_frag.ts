export let EnvMap_frag: string = /*wgsl*/ `
    @group(1) @binding(auto)
    var prefilterMapSampler: sampler;
    @group(1) @binding(auto)
    var prefilterMap: texture_cube<f32>;
    @group(1) @binding(auto)
    var envMapSampler: sampler;
    @group(1) @binding(auto)
    var envMap: texture_cube<f32>;
`
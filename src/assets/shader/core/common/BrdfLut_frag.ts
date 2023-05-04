export let BrdfLut_frag: string = /*wgsl*/ `
    @group(1) @binding(auto)
    var brdflutMapSampler: sampler;
    @group(1) @binding(auto)
    var brdflutMap: texture_2d<f32>;
`
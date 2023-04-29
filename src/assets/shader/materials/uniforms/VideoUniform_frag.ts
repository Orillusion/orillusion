export let VideoUniform_frag = /* wgsl */`
struct MaterialUniform {
  transformUV1:vec4<f32>,
  transformUV2:vec4<f32>,
  baseColor: vec4<f32>,
  rectClip: vec4<f32>,
  alphaCutoff: f32,
};

@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;
`
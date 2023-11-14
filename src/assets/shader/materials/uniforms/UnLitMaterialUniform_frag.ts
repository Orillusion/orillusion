export let UnLitMaterialUniform_frag = /* wgsl */`


#if USE_CUSTOMUNIFORM
#else
    struct MaterialUniform {
      transformUV1:vec4<f32>,
      transformUV2:vec4<f32>,
      baseColor: vec4<f32>,
      alphaCutoff: f32,
    };
#endif


@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;
`
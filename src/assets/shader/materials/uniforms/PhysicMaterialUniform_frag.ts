export let PhysicMaterialUniform_frag = /* wgsl */`
        struct MaterialUniform {
          transformUV1:vec4<f32>,
          transformUV2:vec4<f32>,

          baseColor: vec4<f32>,
          emissiveColor: vec4<f32>,
          materialF0: vec4<f32>,
          envIntensity: f32,
          normalScale: f32,
          roughness: f32,
          metallic: f32,
          ao: f32,

          roughness_min: f32,
          roughness_max: f32,
          metallic_min: f32,
          metallic_max: f32,
          emissiveIntensity: f32,
          alphaCutoff: f32,
          ior: f32,
          clearcoatColor: vec4<f32>,
          clearcoatWeight: f32,
          clearcoatFactor: f32,
          clearcoatRoughnessFactor: f32,
        };
      
        @group(2) @binding(0)
        var<uniform> materialUniform: MaterialUniform;
      `
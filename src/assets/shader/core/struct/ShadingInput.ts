export let ShadingInput: string = /*wgsl*/ `
    struct ShadingInput{
        BaseColor:vec4<f32>,
        Roughness:f32,
        Metallic:f32,
        Specular:f32,
        EmissiveColor:vec4<f32>,
        SurfaceColor:vec4<f32>,
        Normal:vec3<f32>,
        Tangent:vec4<f32>,
        WorldPositionOffset:vec3<f32>,
        AmbientOcclusion:f32,
        PixelDepthOffset:f32,

        Opacity:f32,
        OpacityMask:f32,

        Refraction:f32,
    }
`

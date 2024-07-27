/**
 * @internal
 */
export let ShadingInput: string = /*wgsl*/ `
    struct ShadingInput{
        BaseColor:vec4<f32>,

        Roughness:f32,
        Metallic:f32,
        Specular:f32,

        EmissiveColor:vec4<f32>,
        SurfaceColor:vec4<f32>,

        Normal:vec3<f32>,
        HairNormal:vec3<f32>,
        Tangent:vec4<f32>,

        WorldPositionOffset:vec3<f32>,
        AmbientOcclusion:f32,

        PixelDepthOffset:f32,

        Opacity:f32,
        OpacityMask:f32,

        Refraction:f32,
        FragDepth:f32,

        SSS:vec3f,

        // color:vec4f ,
        // normal:vec3f,
        // alpha:f32,
        // roughness:f32,
        // metallic:f32,
        // occlusion:f32,
        // specularColor:vec4f ,
        // specularIntensity:vec4f ,
        // emissiveColor:vec4f,
        // emissiveIntensity:f32,
        // shadow:f32,
        // ior:f32,
        // alphaClip:f32,

        // position:vec4f,
        // depth:f32
    }
`

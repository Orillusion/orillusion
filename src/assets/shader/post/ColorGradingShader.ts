/**
 * Display-referred color grading: exposure trim, white balance, contrast,
 * saturation, ASC-CDL slope/offset/power and an optional strip LUT.
 * `ColorGradingUtil` mirrors this file on the CPU.
 * @internal
 */
export let ColorGradingShader: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(auto) o_Target: vec4<f32>
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;
    @group(1) @binding(auto)
    var lutMapSampler: sampler;
    @group(1) @binding(auto)
    var lutMap: texture_2d<f32>;

    struct MaterialUniform {
        // x = exposure multiplier, y = contrast, z = saturation, w = LUT intensity
        gradeParams: vec4<f32>,
        // rgb = white balance gains, a = LUT size (0 = no LUT)
        whiteBalance: vec4<f32>,
        slope: vec4<f32>,
        offset: vec4<f32>,
        power: vec4<f32>,
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    fn gradeSampleSlice(rg: vec2<f32>, slice: f32, size: f32) -> vec3<f32> {
        // Texel centres inside one slice, so bilinear filtering never bleeds into the neighbour.
        let u = (slice * size + rg.x * (size - 1.0) + 0.5) / (size * size);
        let v = (rg.y * (size - 1.0) + 0.5) / size;
        return textureSampleLevel(lutMap, lutMapSampler, vec2<f32>(u, v), 0.0).rgb;
    }

    @fragment
    fn main(@location(auto) fragUV: vec2<f32>) -> FragmentOutput {
        var uv = fragUV;
        uv.y = 1.0 - uv.y;
        let src = textureSample(baseMap, baseMapSampler, uv);

        var c = max(src.rgb * materialUniform.gradeParams.x * materialUniform.whiteBalance.rgb, vec3<f32>(0.0));

        // contrast in gamma space around 0.5
        let g = pow(c, vec3<f32>(1.0 / 2.2));
        c = pow(max((g - vec3<f32>(0.5)) * materialUniform.gradeParams.y + vec3<f32>(0.5), vec3<f32>(0.0)), vec3<f32>(2.2));

        // saturation
        let luma = dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
        c = max(vec3<f32>(luma) + (c - vec3<f32>(luma)) * materialUniform.gradeParams.z, vec3<f32>(0.0));

        // ASC CDL
        c = pow(max(c * materialUniform.slope.rgb + materialUniform.offset.rgb, vec3<f32>(0.0)), materialUniform.power.rgb);

        // strip LUT (sRGB-encoded in and out)
        let size = materialUniform.whiteBalance.a;
        let lutAmount = materialUniform.gradeParams.w;
        if (size > 1.5 && lutAmount > 0.0) {
            let enc = pow(clamp(c, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(1.0 / 2.2));
            let bPos = enc.b * (size - 1.0);
            let b0 = floor(bPos);
            let b1 = min(b0 + 1.0, size - 1.0);
            let graded = mix(gradeSampleSlice(enc.rg, b0, size), gradeSampleSlice(enc.rg, b1, size), bPos - b0);
            c = mix(c, pow(graded, vec3<f32>(2.2)), lutAmount);
        }

        return FragmentOutput(vec4<f32>(c, src.a));
    }
`;

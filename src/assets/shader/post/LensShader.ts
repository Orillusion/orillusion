/**
 * Vignette + chromatic aberration + film grain in one fullscreen pass.
 * `LensUtil` mirrors the vignette / aberration math on the CPU.
 * @internal
 */
export let LensShader: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(auto) o_Target: vec4<f32>
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    struct MaterialUniform {
        vignetteColor: vec4<f32>,
        // x = vignette intensity, y = smoothness, z = roundness, w = aspect (w/h)
        vignetteParams: vec4<f32>,
        // x = chromatic aberration, y = grain intensity, z = grain seed (frame), w = unused
        lensParams: vec4<f32>,
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    // Dave Hoskins hash13 — cheap, no visible pattern at pixel frequency.
    fn lensHash(p3In: vec3<f32>) -> f32 {
        var p3 = fract(p3In * 0.1031);
        p3 = p3 + dot(p3, p3.zyx + 31.32);
        return fract((p3.x + p3.y) * p3.z);
    }

    @fragment
    fn main(@location(auto) fragUV: vec2<f32>, @builtin(position) fragCoord: vec4<f32>) -> FragmentOutput {
        var uv = fragUV;
        uv.y = 1.0 - uv.y;
        let centered = uv - vec2<f32>(0.5);

        // --- chromatic aberration: split R / B along the radius ---
        let ca = materialUniform.lensParams.x;
        let center = textureSample(baseMap, baseMapSampler, uv);
        var rgb = center.rgb;
        if (ca > 0.0) {
            // ×0.1: intensity 1 ≈ a 5 % UV shift at the middle of the left/right edge.
            let offset = centered * dot(centered, centered) * 0.4 * ca;
            rgb.r = textureSample(baseMap, baseMapSampler, uv + offset).r;
            rgb.b = textureSample(baseMap, baseMapSampler, uv - offset).b;
        }

        // --- film grain: multiplicative so it tracks exposure, tiny additive floor for the darks ---
        let grain = materialUniform.lensParams.y;
        if (grain > 0.0) {
            let n = lensHash(vec3<f32>(fragCoord.xy, materialUniform.lensParams.z)) - 0.5;
            rgb = max(rgb * (1.0 + n * 2.0 * grain) + vec3<f32>(n * grain * 0.04), vec3<f32>(0.0));
        }

        // --- vignette ---
        let vi = materialUniform.vignetteParams.x;
        if (vi > 0.0) {
            var d = centered * 2.0 * vi;
            d.x = d.x * mix(1.0, materialUniform.vignetteParams.w, materialUniform.vignetteParams.z);
            let v = pow(clamp(1.0 - dot(d, d), 0.0, 1.0), materialUniform.vignetteParams.y * 5.0 + 0.01);
            rgb = mix(materialUniform.vignetteColor.rgb, rgb, v);
        }

        return FragmentOutput(vec4<f32>(rgb, center.a));
    }
`;

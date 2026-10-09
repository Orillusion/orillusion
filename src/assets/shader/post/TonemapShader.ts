import { ColorUtil } from "../utils/ColorUtil";

/**
 * Final tonemap pass. `mode` selects the curve (see `TonemapUtil.MODE_INDEX`;
 * keep the two in sync): 0 None, 1 ACES, 2 Reinhard, 3 Uncharted2, 4 AgX,
 * 5 Khronos PBR Neutral. `TonemapUtil.apply` is the CPU mirror of this file.
 * @internal
 */
export let TonemapShader: string = /*wgsl*/ `
    ${ColorUtil}

    struct FragmentOutput {
        @location(auto) o_Target: vec4<f32>
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    struct MaterialUniform {
        exposure: f32,
        mode: f32,
        whitePoint: f32,
        tonemapPad: f32,
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    fn tmReinhard(c: vec3<f32>, white: f32) -> vec3<f32> {
        let w2 = white * white;
        return (c * (vec3<f32>(1.0) + c / w2)) / (vec3<f32>(1.0) + c);
    }

    fn tmHable(x: vec3<f32>) -> vec3<f32> {
        let A = 0.15; let B = 0.50; let C = 0.10; let D = 0.20; let E = 0.02; let F = 0.30;
        return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
    }

    fn tmUncharted2(c: vec3<f32>) -> vec3<f32> {
        let white = tmHable(vec3<f32>(11.2));
        return tmHable(c * 2.0) / white;
    }

    // AgX base look — Troy Sobotka's AgX as approximated by Benjamin Wrensch,
    // same constants as three.js AgXToneMapping / Blender 4 "AgX Base".
    fn tmAgxContrast(x: vec3<f32>) -> vec3<f32> {
        let x2 = x * x;
        let x4 = x2 * x2;
        return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
    }

    fn tmAgX(color: vec3<f32>) -> vec3<f32> {
        let srgbToRec2020 = mat3x3<f32>(
            vec3<f32>(0.6274, 0.0691, 0.0164),
            vec3<f32>(0.3293, 0.9195, 0.0880),
            vec3<f32>(0.0433, 0.0113, 0.8956));
        let rec2020ToSrgb = mat3x3<f32>(
            vec3<f32>(1.6605, -0.1246, -0.0182),
            vec3<f32>(-0.5876, 1.1329, -0.1006),
            vec3<f32>(-0.0728, -0.0083, 1.1187));
        let inset = mat3x3<f32>(
            vec3<f32>(0.856627153315983, 0.137318972929847, 0.11189821299995),
            vec3<f32>(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
            vec3<f32>(0.0482516061458583, 0.101439036467562, 0.811302368396859));
        let outset = mat3x3<f32>(
            vec3<f32>(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
            vec3<f32>(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
            vec3<f32>(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
        let minEv = -12.47393;
        let maxEv = 4.026069;

        var c = srgbToRec2020 * color;
        c = inset * c;
        c = max(c, vec3<f32>(1e-10));
        c = log2(c);
        c = (c - vec3<f32>(minEv)) / (maxEv - minEv);
        c = clamp(c, vec3<f32>(0.0), vec3<f32>(1.0));
        c = tmAgxContrast(c);
        c = outset * c;
        c = pow(max(c, vec3<f32>(0.0)), vec3<f32>(2.2));
        c = rec2020ToSrgb * c;
        return clamp(c, vec3<f32>(0.0), vec3<f32>(1.0));
    }

    // Khronos PBR Neutral (https://github.com/KhronosGroup/ToneMapping).
    fn tmNeutral(colorIn: vec3<f32>) -> vec3<f32> {
        let startCompression = 0.8 - 0.04;
        let desaturation = 0.15;
        var color = colorIn;
        let x = min(color.r, min(color.g, color.b));
        var offset = 0.04;
        if (x < 0.08) { offset = x - 6.25 * x * x; }
        color = color - vec3<f32>(offset);
        let peak = max(color.r, max(color.g, color.b));
        if (peak < startCompression) { return color; }
        let d = 1.0 - startCompression;
        let newPeak = 1.0 - d * d / (peak + d - startCompression);
        color = color * (newPeak / peak);
        let g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
        return mix(color, vec3<f32>(newPeak), g);
    }

    @fragment
    fn main(@location(auto) fragUV: vec2<f32>) -> FragmentOutput {
        var uv = fragUV;
        uv.y = 1.0 - uv.y;
        let raw = textureSample(baseMap, baseMapSampler, uv);

        // Negative HDR values (can come out of additive posts) are undefined
        // for every curve below; clamp once here.
        var rgb = max(raw.rgb, vec3<f32>(0.0)) * materialUniform.exposure;
        let mode = i32(materialUniform.mode + 0.5);
        if (mode == 1) {
            rgb = ACESToneMapping(rgb, 1.0);
        } else if (mode == 2) {
            rgb = tmReinhard(rgb, max(materialUniform.whitePoint, 1e-3));
        } else if (mode == 3) {
            rgb = tmUncharted2(rgb);
        } else if (mode == 4) {
            rgb = tmAgX(rgb);
        } else if (mode == 5) {
            rgb = tmNeutral(rgb);
        }
        return FragmentOutput(vec4<f32>(rgb, raw.a));
    }
`;

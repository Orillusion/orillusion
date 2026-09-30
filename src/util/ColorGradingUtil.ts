import { ColorGradingSetting } from '../setting/post/ColorGradingSetting';

type RGB = [number, number, number];

/**
 * CPU mirror of `ColorGradingShader`, plus helpers to author strip LUTs.
 *
 * LUT layout (the common "256×16" strip, generalized): `size` slices side by
 * side, each `size`×`size`. Inside a slice x = red, y = green (top row is
 * green 0); the slice index is blue. Values are sRGB-encoded 8-bit.
 * @group Util
 */
export class ColorGradingUtil {
    /** Settings that leave the image untouched. */
    public static neutral(): ColorGradingSetting {
        return { enable: true, exposure: 0, temperature: 0, tint: 0, contrast: 1, saturation: 1, slope: [1, 1, 1], offset: [0, 0, 0], power: [1, 1, 1], lutIntensity: 1 };
    }

    /** Per-channel multipliers for a temperature / tint pair. */
    public static whiteBalance(temperature: number, tint: number): RGB {
        return [1 + 0.2 * temperature + 0.1 * tint, 1 - 0.2 * tint, 1 - 0.2 * temperature + 0.1 * tint];
    }

    /** Apply the parametric grade (everything except the LUT) to a linear display-referred color. */
    public static apply(rgb: RGB, s: ColorGradingSetting): RGB {
        const wb = ColorGradingUtil.whiteBalance(s.temperature, s.tint);
        const ev = Math.pow(2, s.exposure);
        let c: number[] = [rgb[0] * ev * wb[0], rgb[1] * ev * wb[1], rgb[2] * ev * wb[2]].map(v => Math.max(v, 0));
        // contrast in gamma space around 0.5
        c = c.map(v => Math.pow(Math.max((Math.pow(v, 1 / 2.2) - 0.5) * s.contrast + 0.5, 0), 2.2));
        // saturation around Rec.709 luma
        const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        c = c.map(v => Math.max(l + (v - l) * s.saturation, 0));
        // ASC CDL
        c = c.map((v, i) => Math.pow(Math.max(v * s.slope[i] + s.offset[i], 0), s.power[i]));
        return c as RGB;
    }

    /**
     * Build the RGBA8 pixels of a strip LUT from a function on sRGB-encoded
     * colors in [0,1]. `fn` defaults to identity (a neutral LUT).
     * @returns `{ data, width: size*size, height: size }`
     */
    public static createLUTData(size: number = 16, fn: (r: number, g: number, b: number) => RGB = (r, g, b) => [r, g, b]): { data: Uint8Array; width: number; height: number } {
        const width = size * size, height = size;
        const data = new Uint8Array(width * height * 4);
        for (let b = 0; b < size; b++) {
            for (let g = 0; g < size; g++) {
                for (let r = 0; r < size; r++) {
                    const o = fn(r / (size - 1), g / (size - 1), b / (size - 1));
                    const i = (g * width + b * size + r) * 4;
                    data[i] = Math.round(Math.min(Math.max(o[0], 0), 1) * 255);
                    data[i + 1] = Math.round(Math.min(Math.max(o[1], 0), 1) * 255);
                    data[i + 2] = Math.round(Math.min(Math.max(o[2], 0), 1) * 255);
                    data[i + 3] = 255;
                }
            }
        }
        return { data, width, height };
    }

    /** Trilinear lookup into strip-LUT pixels, sRGB-encoded in and out. Mirrors the shader. */
    public static sampleLUT(lut: { data: Uint8Array; width: number; height: number }, srgb: RGB): RGB {
        const size = lut.height;
        const at = (r: number, g: number, b: number): RGB => {
            const i = (g * lut.width + b * size + r) * 4;
            return [lut.data[i] / 255, lut.data[i + 1] / 255, lut.data[i + 2] / 255];
        };
        const p = srgb.map(v => Math.min(Math.max(v, 0), 1) * (size - 1));
        const i0 = p.map(Math.floor), f = p.map((v, k) => v - i0[k]);
        const i1 = i0.map(v => Math.min(v + 1, size - 1));
        const lerp = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        const slice = (bi: number) => lerp(lerp(at(i0[0], i0[1], bi), at(i1[0], i0[1], bi), f[0]), lerp(at(i0[0], i1[1], bi), at(i1[0], i1[1], bi), f[0]), f[1]);
        return lerp(slice(i0[2]), slice(i1[2]), f[2]);
    }

    /** Full CPU pipeline: parametric grade, then the LUT blended by `lutIntensity`. Linear in, linear out. */
    public static applyWithLUT(rgb: RGB, s: ColorGradingSetting, lut: { data: Uint8Array; width: number; height: number } | null): RGB {
        const c = ColorGradingUtil.apply(rgb, s);
        if (!lut || s.lutIntensity <= 0) return c;
        const enc = c.map(v => Math.pow(Math.min(Math.max(v, 0), 1), 1 / 2.2)) as RGB;
        const out = ColorGradingUtil.sampleLUT(lut, enc).map(v => Math.pow(v, 2.2));
        return c.map((v, i) => v + (out[i] - v) * s.lutIntensity) as RGB;
    }
}

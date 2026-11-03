import { TonemapMode } from '../setting/post/TonemapSetting';

/**
 * CPU reference of the curves in `TonemapShader`, kept line-for-line in sync
 * with the WGSL. Used to map a mode name to the shader's integer selector,
 * and by tooling / tests that need the expected LDR value for an HDR input
 * (color pickers, LUT bakers, GPU-vs-CPU validation).
 * @group Util
 */
export class TonemapUtil {
    /** Shader selector per mode. Order is part of the shader contract. */
    public static readonly MODE_INDEX: Record<TonemapMode, number> = {
        None: 0,
        ACES: 1,
        Reinhard: 2,
        Uncharted2: 3,
        AgX: 4,
        Neutral: 5,
    };

    /** All mode names, in selector order. */
    public static readonly MODES: TonemapMode[] = ['None', 'ACES', 'Reinhard', 'Uncharted2', 'AgX', 'Neutral'];

    /** Selector for a mode name; unknown names fall back to ACES (the engine default). */
    public static modeIndex(mode: string | undefined): number {
        const i = (TonemapUtil.MODE_INDEX as any)[mode as any];
        return i === undefined ? TonemapUtil.MODE_INDEX.ACES : i;
    }

    /**
     * Apply exposure + tone curve to a scene-linear RGB triple.
     * @returns linear display-referred RGB (before the sRGB encode)
     */
    public static apply(mode: TonemapMode, rgb: [number, number, number], exposure: number = 1, whitePoint: number = 4): [number, number, number] {
        const c: [number, number, number] = [rgb[0] * exposure, rgb[1] * exposure, rgb[2] * exposure];
        switch (mode) {
            case 'ACES': return c.map(TonemapUtil._aces) as any;
            case 'Reinhard': { const w2 = whitePoint * whitePoint; return c.map(x => (x * (1 + x / w2)) / (1 + x)) as any; }
            case 'Uncharted2': { const W = TonemapUtil._hable(11.2); return c.map(x => TonemapUtil._hable(x * 2) / W) as any; }
            case 'AgX': return TonemapUtil._agx(c);
            case 'Neutral': return TonemapUtil._neutral(c);
            default: return c;
        }
    }

    private static _aces(x: number): number {
        return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
    }

    private static _hable(x: number): number {
        const A = 0.15, B = 0.50, C = 0.10, D = 0.20, E = 0.02, F = 0.30;
        return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
    }

    // Column-major 3×3 (same layout as the WGSL mat3x3 constructors).
    private static _mul(m: number[], v: number[]): [number, number, number] {
        return [
            m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
            m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
            m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
        ];
    }

    private static readonly SRGB_TO_REC2020 = [0.6274, 0.0691, 0.0164, 0.3293, 0.9195, 0.0880, 0.0433, 0.0113, 0.8956];
    private static readonly REC2020_TO_SRGB = [1.6605, -0.1246, -0.0182, -0.5876, 1.1329, -0.1006, -0.0728, -0.0083, 1.1187];
    private static readonly AGX_INSET = [0.856627153315983, 0.137318972929847, 0.11189821299995, 0.0951212405381588, 0.761241990602591, 0.0767994186031903, 0.0482516061458583, 0.101439036467562, 0.811302368396859];
    private static readonly AGX_OUTSET = [1.1271005818144368, -0.1413297634984383, -0.14132976349843826, -0.11060664309660323, 1.157823702216272, -0.11060664309660294, -0.016493938717834573, -0.016493938717834257, 1.2519364065950405];

    private static _agx(c: number[]): [number, number, number] {
        const minEv = -12.47393, maxEv = 4.026069;
        let v = TonemapUtil._mul(TonemapUtil.SRGB_TO_REC2020, c);
        v = TonemapUtil._mul(TonemapUtil.AGX_INSET, v);
        v = v.map(x => {
            x = Math.log2(Math.max(x, 1e-10));
            x = Math.min(Math.max((x - minEv) / (maxEv - minEv), 0), 1);
            const x2 = x * x, x4 = x2 * x2;
            return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
        }) as any;
        v = TonemapUtil._mul(TonemapUtil.AGX_OUTSET, v);
        v = v.map(x => Math.pow(Math.max(x, 0), 2.2)) as any;
        v = TonemapUtil._mul(TonemapUtil.REC2020_TO_SRGB, v);
        return v.map(x => Math.min(Math.max(x, 0), 1)) as any;
    }

    private static _neutral(c: number[]): [number, number, number] {
        const startCompression = 0.8 - 0.04, desaturation = 0.15;
        const x = Math.min(c[0], c[1], c[2]);
        const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
        let r = c[0] - offset, g = c[1] - offset, b = c[2] - offset;
        const peak = Math.max(r, g, b);
        if (peak < startCompression) return [r, g, b];
        const d = 1 - startCompression;
        const newPeak = 1 - (d * d) / (peak + d - startCompression);
        const s = newPeak / peak;
        r *= s; g *= s; b *= s;
        const t = 1 - 1 / (desaturation * (peak - newPeak) + 1);
        return [r + (newPeak - r) * t, g + (newPeak - g) * t, b + (newPeak - b) * t];
    }
}

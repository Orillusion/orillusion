/**
 * CPU mirror of the vignette / chromatic-aberration math in `LensShader`,
 * for tooling and GPU-vs-CPU validation. Keep in sync with the WGSL.
 * @group Util
 */
export class LensUtil {
    /**
     * Vignette multiplier at a screen UV (0..1, origin irrelevant — symmetric).
     * 1 = untouched, 0 = fully replaced by the vignette color.
     */
    public static vignette(u: number, v: number, aspect: number, intensity: number, smoothness: number, roundness: number): number {
        if (intensity <= 0) return 1;
        let dx = (u - 0.5) * 2 * intensity;
        const dy = (v - 0.5) * 2 * intensity;
        dx *= 1 + (aspect - 1) * roundness;
        const base = Math.min(Math.max(1 - (dx * dx + dy * dy), 0), 1);
        return Math.pow(base, smoothness * 5 + 0.01);
    }

    /** UV offset applied to the red channel (blue gets the negation). */
    public static chromaticOffset(u: number, v: number, intensity: number): [number, number] {
        const cx = u - 0.5, cy = v - 0.5;
        const k = (cx * cx + cy * cy) * 0.4 * intensity;
        return [cx * k, cy * k];
    }
}

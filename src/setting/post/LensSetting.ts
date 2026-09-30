import { Color } from "../../math/Color";

/**
 * Lens Setting — vignette, chromatic aberration and film grain, applied by
 * `LensPost` in scene-linear HDR (before the tonemap).
 * @group Setting
 */
export type LensSetting = {
    /** Master switch (set by attaching / detaching `LensPost`). */
    enable: boolean;
    /** Vignette strength. 0 = off; 0.4 is a gentle darkening of the corners; 1 is heavy. */
    vignetteIntensity: number;
    /** Falloff softness, 0 (hard edge) … 1 (very gradual). */
    vignetteSmoothness: number;
    /** 1 = circular vignette regardless of aspect ratio, 0 = follows the screen rectangle. */
    vignetteRoundness: number;
    /** Color the corners fade to (usually black). */
    vignetteColor: Color;
    /**
     * Chromatic aberration strength: red and blue are sampled along the
     * radius from the screen center, offset by `c·|c|²·0.4·intensity`
     * (c = uv − 0.5), i.e. intensity 1 shifts them by about 5 % of the
     * screen at the left/right edge. 0 = off; 0.1 subtle; 1 obvious fringing.
     */
    chromaticAberration: number;
    /** Film grain strength, 0 = off; 0.1 subtle; 0.5 heavy. Multiplicative, so it scales with exposure. */
    grainIntensity: number;
    /** Freeze the grain pattern (useful for screenshots / tests). */
    grainStatic: boolean;
};

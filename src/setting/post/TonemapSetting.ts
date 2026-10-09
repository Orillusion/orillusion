/**
 * Tone curve applied by `TonemapPost`.
 *
 * - `'None'`       passthrough (exposure still applies); output is clamped by the swapchain.
 * - `'ACES'`       Narkowicz ACES Filmic fit — punchy, saturated highlights drift toward white. Engine default.
 * - `'Reinhard'`   Extended Reinhard with a white point: `c·(1 + c/w²)/(1 + c)`. Soft, low contrast.
 * - `'Uncharted2'` Hable filmic (Uncharted 2) with W = 11.2, exposure bias 2.
 * - `'AgX'`        Blender 4 / three.js AgX (base look). Desaturates bright saturated colors instead of clipping hues.
 * - `'Neutral'`    Khronos PBR Neutral — leaves colors below ~0.76 untouched; meant for product / e-commerce rendering where base colors must match the authored sRGB values.
 *
 * @group Setting
 */
export type TonemapMode = 'None' | 'ACES' | 'Reinhard' | 'Uncharted2' | 'AgX' | 'Neutral';

/**
 * Tonemap Setting — final HDR→LDR curve applied after every other
 * post-effect, just before the swapchain receives the frame. Defaults
 * to ACES Filmic, paired with an sRGB output color space — the standard
 * HDR-to-display pairing.
 *
 * @group Setting
 */
export type TonemapSetting = {
    /** Master switch. When false, the post is still attached but
     *  acts as a straight passthrough — useful for A/B comparisons. */
    enable: boolean;
    /** Linear scale multiplied onto the HDR color before the curve.
     *  1.0 is the neutral default (no exposure compensation). */
    exposure: number;
    /** Curve selector, see {@link TonemapMode}. */
    mode: TonemapMode;
    /** Scene-linear value that maps to pure white in `'Reinhard'` mode.
     *  Ignored by the other curves. Default 4. */
    whitePoint?: number;
};

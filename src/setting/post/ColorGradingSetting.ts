/**
 * Color Grading Setting — applied by `ColorGradingPost` AFTER the tonemap,
 * on display-referred linear color in [0,1].
 * @group Setting
 */
export type ColorGradingSetting = {
    /** Master switch (set by attaching / detaching `ColorGradingPost`). */
    enable: boolean;
    /** Exposure trim in stops (EV). 0 = unchanged, +1 doubles, −1 halves. */
    exposure: number;
    /** White balance, −1 (cool / blue) … +1 (warm / orange). */
    temperature: number;
    /** Green–magenta balance, −1 (green) … +1 (magenta). */
    tint: number;
    /** Contrast around mid-grey, measured in gamma space. 1 = unchanged. */
    contrast: number;
    /** 0 = greyscale, 1 = unchanged, >1 = more saturated. */
    saturation: number;
    /** ASC-CDL slope (gain) per channel. [1,1,1] = unchanged. */
    slope: [number, number, number];
    /** ASC-CDL offset (lift) per channel. [0,0,0] = unchanged. */
    offset: [number, number, number];
    /** ASC-CDL power (gamma) per channel. [1,1,1] = unchanged. */
    power: [number, number, number];
    /** Blend between the graded color (0) and the LUT result (1). Ignored without a LUT. */
    lutIntensity: number;
};

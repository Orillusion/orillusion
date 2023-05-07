
/**
 * Bloom
 * @group Setting
 */
export type BloomSetting = {
    /**
     * enable
     */
    enable: boolean;
    /**
     * Screen horizontal blur radius
     */
    blurX: number;
    /**
     * Screen vertical blur radius
     */
    blurY: number;
    /**
     * Strength setting
     */
    strength: number;
    /**
     * Radius setting
     */
    radius: number;
    /**
     * Luminosity threshold
     */
    luminosityThreshold: number;
    /**
     * use debug or not
     */
    debug: boolean;
};
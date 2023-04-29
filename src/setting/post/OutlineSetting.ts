/**
 * Outline Setting
 * @group Setting
 */
export type OutlineSetting = {
    enable: boolean;
    /**
     * Group settings can be set up to 8 groups: through functions opened by OutlineManager,
     * Pass in different Object 3D lists and color parameters to obtain grouped stroke effects.
     */
    groupCount: number;
    /**
     * Pixel width of stroke hard edges
     */
    outlinePixel: number;
    /**
     * Stroke Fade Pixel Width
     */
    fadeOutlinePixel: number;
    /**
     * Stroke strength
     */
    strength: number;
    /**
     * Blend mode: true Use overlay mode, false Use default alpha blend
     */
    useAddMode: boolean;
    /**
     * 
     */
    debug: boolean;
};
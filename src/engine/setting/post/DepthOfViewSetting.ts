

/**
 * dpeth of view effect
 * @group Setting
 */
export type DepthOfViewSetting = {
    enable: boolean;
    /**
     * Blur Effect Iterations
     */
    iterationCount: number;
    /**
     * the distance of Blur effect pixel diffusion
     */
    pixelOffset: number; // = 1.0;
    /**
     * the pixel below this distance to camera will not be blurred
     */
    near: number; // = 150;
    /**
     * the pixel above this distance will experience maximum blurring,
     * [near,far]: the pixel between near and far will be blurred with linear interpolation coefficients between [0,1]
     */
    far: number; // = 300;
};
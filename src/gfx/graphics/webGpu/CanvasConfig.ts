
/**
 * config data for canvas
 * @group engine3D
 */
export type CanvasConfig = {
    /**
     * reference of canvas
     */
    canvas?: HTMLCanvasElement;
    /**
     * wheter use transparent background
     * To set a transparent background, the SkyRenderer{@link SkyRenderer} component should be disabled
     * skyRender.enable = false
     */
    alpha?: boolean;
    /**
     * canvas styler zIndex
     */
    zIndex?: number;
    /**
     * canvas pixel ratio
     * use window.devicePixelRatio is not provided
     */
    devicePixelRatio?: number;
    /**
     * canvas background image
     * a canvas background when skybox is hide/disabled and CanvasConfig.alpha is true
     */
    backgroundImage?: string;
};

import { Scene3D } from '../../../core/Scene3D';

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
     * Pay attention to settings when using 3D transparent backgrounds{@link SkyRenderer} The enable of the sky rendering component is false
     * skyRender.enable = false
     */
    alpha?: boolean;
    /**
     * canvas styler zIndex
     */
    zIndex?: number;
    /**
     * canvas pixel ratio
     */
    devicePixelRatio?: number;
    /**
     * canvas background image
     * need call scene.hideSky() and set CanvasConfig.alpha is true
     */
    backgroundImage?: string;
    /**
     * canvas width
     */
    width?: number;
    /**
     * canvas width
     */
    height?: number,

};

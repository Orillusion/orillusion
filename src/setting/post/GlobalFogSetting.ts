import { Color } from "../../math/Color";

/**
 * Global fog effect setting
 * @group Setting
 */
export type GlobalFogSetting = {
    debug: any;
    /**
     * enable
     */
    enable: boolean;
    /**
     * type of fog:
     * 0: linear exponent 2: squar exponent
     */
    fogType: number;
    /**
     * Setting the Influence of Height on Fog
     */
    fogHeightScale: number;
    /**
     * If the distance between the object and the camera is set as distance, the fog concentration will be linear interpolation between start and end
     */
    start: number;
    /**
     * If the distance between the object and the camera is set as distance, the fog concentration will be linear interpolation between start and end
     */
    end: number;
    /**
     * When the type is exponential square fog, the fog concentration coefficient is added
     */
    density: number;
    /**
     * The effect of setting height on fog (working together with height)
     */
    ins: number;
    /**
     * mix fog color with sky color
     */
    skyFactor: number;
    /**
     * use mipmap level
     */
    skyRoughness: number,
    /**
     * factor effect the sky
     */
    overrideSkyFactor: number,
    /**
     * fog color
     */
    fogColor: Color,

    falloff: number,
    rayLength: number,
    scatteringExponent: number,
    dirHeightLine: number
};
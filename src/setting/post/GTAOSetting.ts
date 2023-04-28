
/**
 * Setting of GTAO
 * @group Setting
 */
export type GTAOSetting = {
    enable: boolean;
    /**
     * Set the maximum distance to search around 3D space during ao sampling
     */
    maxDistance: number;
    /**
     * Set the maximum distance when searching for surrounding pixels during ao sampling
     */
    maxPixel: number;
    /**
     * Set the coefficient of ao value to participate in outputting to the screen, 1: output all, 0: not output
     */
    darkFactor: number;
    /**
     * Set the number of steps for AO sampling. A larger value will result in better quality AO effects while consuming more performance
     */
    rayMarchSegment: number;
    /**
     * Simulate color rebound or not
     */
    multiBounce: boolean;
    /**
     * true: Calculate the position value of GBuffer using f32 to obtain more accurate values (water and other effects may not be supported)
     * false: We will use the position value of GBuffer in f16 for operations, with a wider coverage
     */
    usePosFloat32: boolean;
    /**
     * True: will be mixed with the mainColor of GBuffer; False: will only output the colors of ao
     */
    blendColor: boolean;
    /**
     * 
     */
    debug: boolean;
};
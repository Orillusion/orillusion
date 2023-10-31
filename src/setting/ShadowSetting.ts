
/**
 * Shadow setting
 * @group Setting
 */
export type ShadowSetting = {
    debug: any,
    /**
     * enable
     */
    enable: boolean;
    /**
     *
     */
    needUpdate: boolean;
    /**
     * update shadown automatic
     */
    autoUpdate: boolean;

    /**
     * frequency for shadows update
     */
    updateFrameRate: number;

    /**
     * Percentage-Closer Filtering(PCF)is a simple, often seen technique for removing shadow edges.
     * Soft shadow, is a soft and blurred shadow that is farther away from the object when the light is shot down.
     * Hard shadow, is a sharper shadow, at the exchange (connection) with the object or the place where the light hits and close to the object, 
     or the occluded place where the sunlight cannot reach.
     */
    type: `PCF` | `HARD` | `SOFT`;
    /**
    * Offset of point light shadow
    */
    pointShadowBias: number;
    // /**
    //  * Shadow quality
    //  */
    // shadowQuality: number;
    /**
     * shadow boundary
     */
    shadowBound?: number;
    /**
     * shadow mapping Size
     */
    shadowSize: number;
    /**
     * shadow depth offset bias 
     */
    shadowBias: number;
    /**
     * Shadow softness
     */
    shadowSoft: number;
    /**
     * Point shadow mapping size
     */
    pointShadowSize: number;
    /**
     * Blend Shadow(0-1)
     */
    csmMargin: number;
    /**
     * scattering csm Area Exponent for each level
     */
    csmScatteringExp: number;
    /**
     * scale csm Area of all level
     */
    csmAreaScale: number;
    // /**
    //  * Shadow near section
    //  */
    // shadowNear: number;
    // /**
    //  * Shadow Far Section
    //  */
    // shadowFar: number;
};
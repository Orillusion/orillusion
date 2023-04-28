
/**
 * Shadow setting
 * @group Setting
 */
export type ShadowSetting = {
    debug: any;
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
     * Shadow offset
     */
    shadowBias: number;
    /**
    * Offset of point light shadow
    */
    pointShadowBias: number;
    /**
     * Shadow quality
     */
    shadowQuality: number;
    /**
     * shadow boundary
     */
    shadowBound: number;
    /**
     * shadow mapping Size
     */
    shadowSize: number;
    /**
     * Shadow softness
     */
    shadowSoft: number;
    /**
     * Point shadow mapping size
     */
    pointShadowSize: number;
    /**
     * Shadow near section
     */
    shadowNear: number;
    /**
     * Shadow Far Section
     */
    shadowFar: number;
};

/**
 * Screen Space Reflection Setting
 * @group Setting
 */
export type SSRSetting = {
    debug: any;
    /**
     * enable
     */
    enable: boolean;
    /**
     * pixel ratio, Smaller pixel ratios can achieve better performance, but the visual effect will decrease
     */
    pixelRatio: number;
    /**
     * fade out when pixel is closed to edge 
     */
    fadeEdgeRatio: number; //fade alpha from edge
    /**
     * fade alpha from ray trace step count
     */
    rayMarchRatio: number;
    /**
     * fade alpha by distance from camera to hit point (min)
     */
    fadeDistanceMin: number;
    /**
     * fade alpha by distance from camera to hit point (max)
     */
    fadeDistanceMax: number;
    /**
     * threshold of roughness, determine effect refrection
     */
    roughnessThreshold: number;
    /**
     * Pow parameter of normal and reflection dot product
     */
    powDotRN: number;
    /**
     * SSR color mixing parameter: If the position difference between the current frame and the previous frame exceeds the mixThreshold at a certain pixel position, the current frame will be quickly retained to have more.
     */
    mixThreshold: number;
};
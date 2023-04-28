import { HDRTextureCube } from "../textures/HDRTextureCube";

/**
 * Sky setting
 * @group Setting
 */
export type SkySetting = {
    /**
     * sky texture type
     */
    type: `HDRSKY` | `ShaderSky`;
    /**
     * HDRTextureCube
     */
    sky: HDRTextureCube;
    /**
     * exposure
     */
    skyExposure: number;
    /**
     * default far
     */
    defaultFar: number;
    /**
     * default near
     */
    defaultNear: number;
};
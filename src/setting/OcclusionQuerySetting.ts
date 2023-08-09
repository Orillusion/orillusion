
/**
 * Occlusion query settings
 * @internal
 * @group Setting
 */
export type OcclusionQuerySetting = {
    enable: boolean,
    debug: boolean,
    octree?:
    {
        width: number,
        height: number,
        depth: number,
        x: number,
        y: number,
        z: number
    }
};
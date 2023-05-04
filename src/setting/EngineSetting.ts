import { GlobalIlluminationSetting } from "./GlobalIlluminationSetting";
import { LightSetting } from "./LightSetting";
import { MaterialSetting } from "./MaterialSetting";
import { OcclusionQuerySetting } from "./OcclusionQuerySetting";
import { PickSetting } from "./PickSetting";
import { RenderSetting } from "./RenderSetting";
import { ShadowSetting } from "./ShadowSetting";
import { SkySetting } from "./SkySetting";

export type EngineSetting = {

    /**
     * @internal
     */
    occlusionQuery: OcclusionQuerySetting;

    /**
     * pick mode setting
     */
    pick: PickSetting;

    /**
     * render setting
     */
    render: RenderSetting;

    /**
     * sky setting
     */
    sky: SkySetting;

    /**
     * shadow setting
     */
    shadow: ShadowSetting;

    /**
     * light setting
     */
    light: LightSetting;

    /**
     * @internal
     */
    material: MaterialSetting;
}
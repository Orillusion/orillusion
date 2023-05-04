import { BloomSetting } from "./post/BloomSetting";
import { DepthOfViewSetting } from "./post/DepthOfViewSetting";
import { GlobalFogSetting } from "./post/GlobalFogSetting";
import { GTAOSetting } from "./post/GTAOSetting";
import { OutlineSetting } from "./post/OutlineSetting";
import { SSRSetting } from "./post/SSRSetting";
import { TAASetting } from "./post/TAASetting";

export type RenderSetting = {
    debug: boolean;
    renderPassState: number;
    renderState_left: number;
    renderState_right: number;
    renderState_split: number;
    quadScale: number;
    hdrExposure: number;
    debugQuad: number;
    maxPointLight: number;
    maxDirectLight: number;
    maxSportLight: number;
    drawOpMin: number;
    drawOpMax: number;
    drawTrMin: number;
    drawTrMax: number;
    zPrePass: boolean;
    gi: boolean;
    /**
     * post effect
     */
    postProcessing: {
        enable?: boolean;
        bloom?: BloomSetting;
        ssao?: {
            debug: any;
            enable: boolean;
            radius: number;
            bias: number;
            aoPower: number;
        };
        ssr?: SSRSetting;
        taa?: TAASetting;
        gtao?: GTAOSetting;
        outline?: OutlineSetting;
        globalFog?: GlobalFogSetting;
        fxaa?: {
            enable: boolean;
        };
        depthOfView?: DepthOfViewSetting;
    };
}
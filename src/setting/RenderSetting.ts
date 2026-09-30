import { DepthOfViewSetting } from "./post/DepthOfViewSetting";
import { GlobalFogSetting } from "./post/GlobalFogSetting";
import { GTAOSetting } from "./post/GTAOSetting";
import { OutlineSetting } from "./post/OutlineSetting";
import { SkylineSetting } from "./post/SkylineSetting";
import { LensSetting } from "./post/LensSetting";
import { SSRSetting } from "./post/SSRSetting";
import { TAASetting } from "./post/TAASetting";
import { BloomSetting } from "./post/BloomSetting";
import { GodRaySetting } from "./post/GodRaySetting";
import { TonemapSetting } from "./post/TonemapSetting";
import { VolumetricFogSetting } from "./post/VolumetricFogSetting";

export type RenderSetting = {
    debug: boolean;
    renderPassState: number;
    renderState_left: number;
    renderState_right: number;
    renderState_split: number;
    quadScale: number;
    hdrExposure: number;
    drawOpMin: number;
    drawOpMax: number;
    drawTrMin: number;
    drawTrMax: number;
    zPrePass: boolean;
    useLogDepth: boolean;
    useCompressGBuffer: boolean;
    /** GPU-driven culling — when true, frustum + (when paired with
     *  Hi-Z) occlusion tests run on the GPU per mesh instance and
     *  produce a `drawIndexedIndirect` arg buffer. The compute pass
     *  is fully implemented in `GPUCullPass` / `GPUFrustumCull_cs`;
     *  what's still skeleton is the `drawNodes` consumer
     *  (`_transparentDraw.ts`, driven by `ColorPass`) that actually
     *  issues the indirect call (the existing per-node iteration
     *  coexists). Flip this on AND open the integration in `drawNodes`
     *  to get the 5-20× perf win. */
    gpuCull?: boolean;
    /** Per-instance MSAA sample count for the main color pass.
     *  0 disables MSAA (default). Valid non-zero values: 2 | 4 | 8
     *  depending on device support. Enabling MSAA unlocks
     *  alpha-to-coverage (set LitMaterial.alphaMode = 'MASK'). */
    msaa: 0 | 2 | 4 | 8;
    /** Opt-in order-independent transparency (Weighted Blended OIT).
     *  When true, materials with `oitMode === 'weighted'` are routed
     *  through the OIT accum/resolve features instead of the sorted
     *  transparent path. Default false — matches legacy behavior. */
    useOIT: boolean;
    /** Opt-in projected decals. When true, ForwardRendererJob inserts
     *  `DecalShadowVolumePass` between the opaque/transmission half and
     *  the sorted transparent half — every active `DecalComponent`
     *  projects its texture onto the opaque scene via stencil shadow
     *  volumes. Default false. */
    decals?: boolean;
    /** Opt-in 8-bit stencil buffer on the main color pass.
     *  When true, `GBufferFrame` allocates its depth attachment as
     *  `depth24plus-stencil8` instead of the default `depth32float`,
     *  so material-level stencil state (`Material.stencilFront/Back/
     *  ReadMask/WriteMask/Ref`) is actually validated and bound at
     *  pipeline build time. Off by default — adding stencil makes the
     *  depth attachment incompatible with depth-only sampling paths
     *  (SSR/SSGI/Outline read `_MainDepthTexture` as `sampleType: depth`),
     *  so opt in only when the project actually needs stencil and the
     *  z-prepass is disabled (`zPrePass: false`) — the prepass path
     *  routes the color pass through a separate `depth32float`
     *  `zPreTexture` and the stencil attachment is silently dropped. */
    useStencil?: boolean;
    /**
     * Final HDR→LDR tonemap. Runs after every other post (Bloom,
     * FXAA, GodRay, etc.) so the ACES curve sees the composited HDR
     * signal. Setting `enable=false` reverts to a passthrough pass —
     * lighting and bloom shaders no longer apply inline ACES, so the
     * frame will be raw HDR clamped at swapchain encode time.
     */
    tonemap: TonemapSetting;
    /**
     * post effect
     */
    postProcessing: {
        enable?: boolean;
        bloom?: BloomSetting,
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
        ssgi?: GTAOSetting;
        outline?: OutlineSetting;
        globalFog?: GlobalFogSetting;
	skyline?: SkylineSetting;
        lens?: LensSetting;
        godRay?: GodRaySetting;
        fxaa?: {
            enable: boolean;
        };
        depthOfView?: DepthOfViewSetting;
        volumetricFog?: VolumetricFogSetting;
    };
}

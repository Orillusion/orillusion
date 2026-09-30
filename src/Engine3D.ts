import { CanvasConfig } from './gfx/graphics/webGpu/CanvasConfig';
import { Color } from './math/Color';
import { EngineSetting } from './setting/EngineSetting';
import { Time } from './util/Time';
import { InputSystem } from './io/InputSystem';
import { View3D } from './core/View3D';
import { version } from '../package.json';

import { Context3D, _registerDefaultCtxResolver } from './gfx/graphics/webGpu/Context3D';

import { GlobalBindGroup } from './gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { Interpolator } from './math/TimeInterpolator';
import { ForwardRendererJob } from './gfx/renderJob/jobs/ForwardRendererJob';
import { RendererJob } from './gfx/renderJob/jobs/RendererJob';
import { Res } from './assets/Res';
import { ShaderLib } from './assets/shader/ShaderLib';
import { ShaderUtil } from './gfx/graphics/webGpu/shader/util/ShaderUtil';
import { ComponentCollect } from './gfx/renderJob/collect/ComponentCollect';
import { ShadowLightsCollect } from './gfx/renderJob/collect/ShadowLightsCollect';
import { EntityCollect } from './gfx/renderJob/collect/EntityCollect';
import { ProfilerUtil } from './util/ProfilerUtil';
import { WasmMatrix } from './components/matrix/WasmMatrix';
import { Matrix4 } from './math/Matrix4';
import { FXAAPost } from './gfx/renderJob/post/FXAAPost';
import { PostProcessingComponent } from './components/post/PostProcessingComponent';
import { GBufferFrame } from './gfx/renderJob/frame/GBufferFrame';
import { Camera3D } from './core/Camera3D';

/** Recursive partial — allows passing any subset of EngineSetting to
 *  `Engine3D.init({ setting: ... })`. Functions and class instances
 *  (Color, HDRTextureCube, ...) are passed through as-is. */
export type EngineSettingInit = DeepPartial<EngineSetting>;

type DeepPartial<T> = T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends Function
    ? T
    : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

/** Plain-object test: only `{}` literals recurse during deepMerge. Class
 *  instances (Color), arrays, null, primitives all bypass the recursion
 *  and get assigned whole. */
function _isPlainObject(v: any): boolean {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
}

function _deepMerge<T extends object>(target: T, source: any): T {
    if (!source) return target;
    for (const key of Object.keys(source)) {
        const sv = source[key];
        if (sv === undefined) continue;
        const tv = (target as any)[key];
        if (_isPlainObject(sv) && _isPlainObject(tv)) {
            _deepMerge(tv, sv);
        } else {
            (target as any)[key] = sv;
        }
    }
    return target;
}

/**
 * Orillusion 3D Engine.
 *
 * Call `await Engine3D.init({ canvasConfig, setting })` to obtain an
 * engine instance. Each instance owns its canvas, input system, views,
 * render jobs, and configuration (`engine.setting`). Instances share a
 * single WebGPU device pool and a shared RAF render loop.
 *
 * @group Engine3D
 */
export class Engine3D {

    /** Factory for the baseline EngineSetting. Returns a fresh deep copy
     *  so per-instance mutations never bleed into sibling engines. Class
     *  instances (Color) are constructed fresh too. */
    private static _defaultSetting(): EngineSetting {
        return {
            useRTE: false,
            RTEScale: 1.0,
            doublePrecision: false,
            occlusionQuery: { enable: true, debug: false },
            pick: { enable: true, mode: `bound`, detail: `mesh` },
            render: {
                debug: false,
                renderPassState: 4,
                renderState_left: 5,
                renderState_right: 5,
                renderState_split: 0.5,
                quadScale: 1,
                // 1.0 = physically neutral linear-HDR multiplier on
                // env IBL paths (BxDF_frag indirectionDiffuse +
                // indirectionSpec). The legacy 1.5 was a magic
                // boost from the era when intermediate sample paths
                // were soft-compressed to LDR; in the linear-HDR
                // pipeline (post-bb408b8) IBL stays full HDR all the
                // way to TonemapPost, so 1.0 is the correct default.
                hdrExposure: 1.0,
                drawOpMin: 0,
                drawOpMax: Number.MAX_SAFE_INTEGER,
                drawTrMin: 0,
                drawTrMax: Number.MAX_SAFE_INTEGER,
                // Z-prepass on by default. PassGenerate.createDepthPass
                // + RenderShaderPass gate at line ~864 make the
                // infrastructure load-bearing — every opaque fragment
                // that would have run a heavy PBR shader then lost the
                // depth test now gets rejected by hardware early-Z.
                // Negligible cost on sparse scenes; 1.5-2× win on
                // dense ones. Set false explicitly only if a scene
                // relies on color writes that ignore depth.
                zPrePass: true,
                useLogDepth: false,
                useCompressGBuffer: false,
                msaa: 0,
                useOIT: false,
                decals: false,
                useStencil: false,
                gpuCull: false,
                tonemap: {
                    enable: true,
                    // ACES Filmic at exposure 1.0 — the standard
                    // HDR-to-display tonemap, matching Filament's
                    // neutral default. Acts on the composited linear
                    // HDR scene right before the sRGB-view swapchain
                    // encode.
                    exposure: 1.0,
                    mode: 'ACES',
                    whitePoint: 4.0,
                },
                postProcessing: {
                    bloom: {
                        downSampleStep: 3,
                        downSampleBlurSize: 9,
                        downSampleBlurSigma: 1.0,
                        upSampleBlurSize: 9,
                        upSampleBlurSigma: 1.0,
                        luminanceThreshole: 1.0,
                        bloomIntensity: 1.0,
                        hdr: 1.0
                    },
                    globalFog: {
                        debug: false,
                        enable: false,
                        fogType: 0.0,
                        fogHeightScale: 0.1,
                        start: 400,
                        end: 10,
                        density: 0.02,
                        ins: 0.5,
                        skyFactor: 0.5,
                        skyRoughness: 0.4,
                        overrideSkyFactor: 0.8,
                        fogColor: new Color(96 / 255, 117 / 255, 133 / 255, 1),
                        falloff: 0.7,
                        rayLength: 200.0,
                        scatteringExponent: 2.7,
                        dirHeightLine: 10.0,
                    },
                    godRay: {
                        blendColor: true,
                        rayMarchCount: 16,
                        scatteringExponent: 5,
                        intensity: 0.5
                    },
                    ssao: { enable: false, radius: 0.15, bias: -0.1, aoPower: 2.0, debug: true },
                    outline: { enable: false, strength: 1, groupCount: 4, outlinePixel: 2, fadeOutlinePixel: 4, textureScale: 1, useAddMode: false, debug: true },
                    taa: { enable: false, jitterSeedCount: 8, blendFactor: 0.1, sharpFactor: 0.6, sharpPreBlurFactor: 0.5, temporalJitterScale: 0.13, debug: true },
                    gtao: { enable: false, darkFactor: 1.0, maxDistance: 5.0, maxPixel: 50.0, rayMarchSegment: 6, multiBounce: false, usePosFloat32: true, blendColor: true, debug: true },
                    ssr: { enable: false, pixelRatio: 1, fadeEdgeRatio: 0.2, rayMarchRatio: 0.5, fadeDistanceMin: 600, fadeDistanceMax: 2000, roughnessThreshold: 0.5, powDotRN: 0.2, mixThreshold: 0.1, debug: true },
                    fxaa: { enable: false },
                    lens: { enable: false, vignetteIntensity: 0.4, vignetteSmoothness: 0.4, vignetteRoundness: 1.0, vignetteColor: new Color(0, 0, 0, 1), chromaticAberration: 0.0, grainIntensity: 0.0, grainStatic: false },
                    skyline: {
	                    enable: false,
	                    lineColor: new Color(1, 0, 0, 1),
	                    lineWidth: 2,
	                    depthThreshold: 0.001,
	                    strength: 1.0,
                    },
                    depthOfView: { enable: false, iterationCount: 3, pixelOffset: 1.0, near: 150, far: 300 },
                    volumetricFog: {
                        enable: false,
                        density: 0.05,
                        scatteringIntensity: 1.0,
                        anisotropy: 0.6,
                        maxDistance: 100.0,
                        stepCount: 32,
                        ambient: { r: 0.02, g: 0.02, b: 0.04 },
                    },
                },
            },
            shadow: {
                enable: true, type: 'HARD', shadowSize: 2048, pointShadowSize: 1024,
                shadowSoft: 0.005, pcfKernelScale: 1.0, needUpdate: true, autoUpdate: true,
                updateFrameRate: 1, csmMargin: 0.1, csmScatteringExp: 0.7, csmAreaScale: 0.4,
                maxCascades: 4, maxShadowMapNum: 8, maxShadowMapWidth: 2048, maxShadowMapHeight: 2048, shadowBound: 256,
                debug: false,
                contactShadow: {
                    enable: false,
                    maxStepCount: 16,
                    maxDistance: 0.5,
                    thickness: 0.05,
                    bias: 0.01,
                    intensity: 1.0,
                },
            },
            gi: {
                enable: false, offsetX: 0, offsetY: 0, offsetZ: 0, probeSpace: 64, probeXCount: 4, probeYCount: 2,
                probeZCount: 4, probeSize: 32, probeSourceTextureSize: 2048, octRTMaxSize: 2048, octRTSideSize: 16,
                maxDistance: 64 * 1.73, normalBias: 0.25, depthSharpness: 1, hysteresis: 0.98, lerpHysteresis: 0.01,
                irradianceChebyshevBias: 0.01, rayNumber: 144, irradianceDistanceBias: 32, indirectIntensity: 1.0,
                ddgiGamma: 2.2, bounceIntensity: 0.025, probeRoughness: 1, realTimeGI: false, debug: false, autoRenderProbe: false,
            },
            sky: { type: 'HDRSKY', sky: null, skyExposure: 1.0, defaultFar: 65536, defaultNear: 1 },
            light: { maxLight: 4096 },
            material: { materialChannelDebug: false, materialDebug: false },
            loader: { numConcurrent: 20 },
            reflectionSetting: { reflectionProbeMaxCount: 8, reflectionProbeSize: 256, width: 256 * 6, height: 8 * 256, enable: true }
        };
    }

    /**
     * Per-Context3D Res accessor. Pass the owning engine's `context3D`
     * explicitly to target a specific device.
     *
     * When `ctx` is omitted AND exactly one Engine3D has been created,
     * falls back to that engine's context — keeps the single-engine path
     * (`new LitMaterial()`, etc.) ergonomic. For multi-engine apps the
     * caller MUST pass `ctx`; otherwise this throws because picking one
     * arbitrarily would silently bind resources to the wrong device.
     *
     * The `Res` instance is cached before `initDefault()` runs because
     * `initDefault()` creates a `LitMaterial` whose default shader reads
     * `engine.res` recursively — the re-entrant call must see the same
     * (partially-initialized) instance instead of looping the factory.
     */
    public static resFor(ctx?: Context3D): Res {
        const useCtx = ctx ?? Engine3D._defaultContext();
        const r = useCtx.cache(Engine3D, () => new Res(useCtx));
        if (!(r as any)._didInitDefault) {
            (r as any)._didInitDefault = true;
            r.initDefault(useCtx);
        }
        return r;
    }

    /**
     * Return a Context3D when the caller didn't thread one. Used for
     * single-engine ergonomics (built-in material ctors with no arg).
     * Throws when 0 or 2+ engines exist.
     */
    public static _defaultContext(): Context3D {
        if (Engine3D._instances.size === 1) {
            return Engine3D._instances.values().next().value!.context3D;
        }
        if (Engine3D._instances.size === 0) {
            throw new Error(`Engine3D.resFor: no engine created yet — call Engine3D.init() first.`);
        }
        throw new Error(
            `Engine3D.resFor: ${Engine3D._instances.size} engines exist — pass ctx explicitly so resources bind to the intended device.`
        );
    }

    /** @internal Non-throwing variant of `_defaultContext` — the sole
     *  engine's ctx, or null when zero / multiple engines exist. Fed to
     *  Context3D's default-ctx resolver for gfx-layer fallbacks. */
    public static _soleContext(): Context3D | null {
        return Engine3D._instances.size === 1
            ? Engine3D._instances.values().next().value!.context3D
            : null;
    }

    /** All registered engine instances (for the shared render loop). */
    private static _instances: Set<Engine3D> = new Set();

    private static _sharedInit: boolean = false;

    private static _rafId: number = 0;
    private static _time: number = 0;

    // -------- instance fields --------
    public readonly context3D: Context3D;
    public readonly id: number;
    /**
     * Per-engine configuration tree. Defaults live in `Engine3D._defaultSetting()`;
     * overrides come from `descriptor.setting` at `Engine3D.init()` time and
     * are deep-merged on top. Mutating at runtime (`engine.setting.shadow.enable = false`)
     * takes effect on the next frame for values read each frame; values baked
     * into GPU resources at `create()` time (shadow map dimensions, reflection
     * probe size, etc.) need re-creation.
     */
    public readonly setting: EngineSetting;
    public views: View3D[] = [];
    public renderJobs: Map<View3D, RendererJob> = new Map();
    public inputSystem: InputSystem;
    public running: boolean = false;

    /** Per-instance pause flag. When true the shared render loop skips this
     *  engine's frame while other engines keep rendering. Toggled by the
     *  instance `pause()` / `resume()` methods (and, for all instances at
     *  once, the static `pause()` / `resume()`). */
    private _paused: boolean = false;

    /**
     * Per-engine resource manager. All GPU resources created through
     * `engine.res` (shaders, textures, loaders) bind to this engine's
     * Context3D.
     */
    public get res(): Res {
        return Engine3D.resFor(this.context3D);
    }

    private _frameRateValue: number = 0;
    private _frameRate: number = 360;
    private _beforeRender: Function | null = null;
    private _renderLoop: Function | null = null;
    private _lateRender: Function | null = null;
    /** Number of frames this instance has rendered since start. */
    public frameCount: number = 0;

    private static _nextId: number = 0;

    constructor(settingOverride?: EngineSettingInit) {
        this.id = ++Engine3D._nextId;
        this.setting = _deepMerge(Engine3D._defaultSetting(), settingOverride);
        // Derive reflection attachment dimensions from probe size / count.
        // Done per-instance so each engine sizes its reflection GBuffer to
        // its own settings.
        this.setting.reflectionSetting.width = this.setting.reflectionSetting.reflectionProbeSize * 6;
        this.setting.reflectionSetting.height = this.setting.reflectionSetting.reflectionProbeSize * this.setting.reflectionSetting.reflectionProbeMaxCount;
        this.context3D = new Context3D();
        this.context3D.engine = this;
    }

    /** Multi-instance factory. Each returned engine owns its own canvas, render
     *  loop, and `setting` tree. Pass any subset of EngineSetting via
     *  `descriptor.setting` — it is deep-merged onto the defaults. */
    public static async init(descriptor: {
        canvasConfig?: CanvasConfig;
        beforeRender?: Function;
        renderLoop?: Function;
        lateRender?: Function;
        setting?: EngineSettingInit;
    } = {}): Promise<Engine3D> {
        let inst = new Engine3D(descriptor.setting);
        await Engine3D._initSharedSubsystems(inst.setting);
        await inst._initInstance(descriptor);
        return inst;
    }

    /** One-time process-wide init (shader text templates, wasm matrix pool).
     *  Runs exactly once, seeded from the first engine's setting — subsequent
     *  engines inherit those process-wide choices (doublePrecision, shader
     *  templates) regardless of their own setting. */
    private static async _initSharedSubsystems(seedSetting: EngineSetting) {
        if (this._sharedInit) return;
        console.log('Engine Version', version);
        if (!window.isSecureContext) {
            console.warn('WebGPU is only supported in secure contexts (HTTPS or localhost)');
        }
        await WasmMatrix.init(Matrix4.allocCount, seedSetting.doublePrecision);
        ShaderLib.init(seedSetting);
        ShadowLightsCollect.init();
        this._sharedInit = true;
    }

    // -------- instance methods --------

    private async _initInstance(descriptor: { canvasConfig?: CanvasConfig; beforeRender?: Function; renderLoop?: Function; lateRender?: Function }) {
        await this.context3D.init(descriptor.canvasConfig);

        // Device-scoped subsystem init.
        ShaderUtil.init(this.context3D);
        GlobalBindGroup.init(this.context3D);

        // Eagerly create this device's default textures / BRDF LUT /sky cube.
        void Engine3D.resFor(this.context3D);

        // Pre-compute reflection GBuffer (scoped to this engine's context).
        GBufferFrame.getGBufferFrame(
            GBufferFrame.reflections_GBuffer,
            this.context3D,
            this.setting.reflectionSetting.width,
            this.setting.reflectionSetting.height,
            false
        );

        this._beforeRender = descriptor.beforeRender ?? null;
        this._renderLoop = descriptor.renderLoop ?? null;
        this._lateRender = descriptor.lateRender ?? null;
        this.inputSystem = new InputSystem();
        this.inputSystem.initCanvas(this.context3D.canvas);

        Engine3D._instances.add(this);
    }

    public get frameRate(): number { return this._frameRate; }
    public set frameRate(value: number) {
        this._frameRate = value;
        this._frameRateValue = 1000 / value;
        if (value >= 360) this._frameRateValue = 0;
    }

    public get size(): number[] { return this.context3D.presentationSize; }
    public get aspect(): number { return this.context3D.aspect; }
    public get width(): number { return this.context3D.windowWidth; }
    public get height(): number { return this.context3D.windowHeight; }

    /**
     * Release this engine's GPU device, DOM canvas, ResizeObserver and
     * input listeners. Required for long-running apps that create/drop
     * engines (tests, editor previews, modal viewers) — without it, the
     * browser's per-origin GPU adapter pool is exhausted after a handful
     * of iterations. Safe to call more than once.
     */
    public dispose() {
        Engine3D._instances.delete(this);
        // Each View3D/Scene3D/Camera3D owned by this engine lives on as a
        // key in a handful of static per-view and per-scene maps. If we
        // don't evict them here every reinit would leak: a full Scene3D
        // subtree, each view's GlobalUniformGroup, profiler counters,
        // light/shadow bookkeeping, etc. Evict them all.
        for (const view of this.views) {
            ComponentCollect.removeView(view);
            ProfilerUtil.removeView(view);
            EntityCollect.instance.removeView(view);
            if (view.scene) {
                EntityCollect.instance.removeScene(view.scene);
                ShadowLightsCollect.removeScene(view.scene);
                GlobalBindGroup.removeScene(view.scene);
            }
            // Clear the global `Camera3D.mainCamera` if it points at this
            // engine's camera — otherwise the static field pins the
            // camera, its Context3D (via _boundCtx) and its entire scene
            // graph, defeating GC for the whole engine on reinit.
            if (view.camera && Camera3D.mainCamera === view.camera) {
                Camera3D.mainCamera = null;
            }
        }
        GlobalBindGroup.removeContext(this.context3D);
        // Tear down renderer-owned orphan Object3Ds (cube cameras, view
        // quads, post effects) before the context dies — a CubeCamera
        // alone holds 7 Object3Ds = 49 Matrix4 slots per engine.
        for (const job of this.renderJobs.values()) job.destroy?.();
        // Orphan components (their transform.view3D is null) are filed under
        // a shared `view=null` key in ComponentCollect's per-view maps and
        // can't be reached by removeView(). Purge the ones bound to this ctx.
        ComponentCollect.removeNullViewEntriesForCtx(this.context3D);
        this.views = [];
        this.renderJobs.clear();
        this.inputSystem?.dispose();
        this.context3D.dispose();
    }

    // -------- render view setup --------

    private _startRenderJob(view: View3D, JobCtor: new (view: View3D) => RendererJob = ForwardRendererJob): RendererJob {
        view.engine3D = this;
        // Bind camera to this engine's context so render-time lookups
        // (`GlobalBindGroup._ctxFromCamera`, `CameraUtil` math helpers)
        // don't have to walk the transform→view3D chain.
        if (view.camera) {
            (view.camera as any)._boundCtx ||= this.context3D;
            // Setting `_boundCtx` directly (above) is enough for render-time
            // lookups but bypasses Camera3D._bindToCtx — the only place the
            // CResizeEvent.RESIZE listener is registered. updateProjection()
            // lazily attaches that listener and syncs `aspect` to the current
            // backbuffer; without it the projection aspect never tracks canvas
            // resizes and the rendered scene stretches after a window resize.
            view.camera.updateProjection();
            // Propagate to CSM shadow cameras (created when enableCSM is set
            // before startRenderView, so they miss the _bindToCtx path).
            const csm = (view.camera as any).csm;
            if (csm?.children) {
                for (const child of csm.children) {
                    (child.shadowCamera as any)._boundCtx ||= this.context3D;
                }
            }
        }
        const renderJob: RendererJob = new JobCtor(view);
        this.renderJobs.set(view, renderJob);

        if (this.setting.pick.mode == `pixel`) {
            let postProcessing = view.scene.getOrAddComponent(PostProcessingComponent);
            postProcessing.addPost(FXAAPost);
        }
        if (this.setting.pick.mode == `pixel` || this.setting.pick.mode == `bound`) {
            view.enablePick = true;
        }
        return renderJob;
    }

    public startRenderView(view: View3D, JobCtor?: new (view: View3D) => RendererJob): RendererJob {
        this.views = [view];
        let job = this._startRenderJob(view, JobCtor);
        // Drive the render-job lifecycle synchronously here: previously
        // `start()` ran on the first RAF tick from the shared render
        // loop, which meant any synchronous user code between
        // `startRenderView()` and the first frame (i.e., a typical
        // `await initScene()`) saw a pre-`start()` engine. That tripped
        // up Frame Graph features whose registration eagerly allocates
        // shared resources — most visibly SceneColorPyramidFeature
        // (its `_SceneColorPyramid` texture wasn't in the pool, so
        // glass materials with `transmissionFactor > 0` bound the
        // white-texture placeholder forever and the refraction never
        // sampled the actual scene).
        if (!job.renderState) job.start();
        Engine3D._ensureLoop();
        return job;
    }

    public startRenderViews(views: View3D[], JobCtor?: new (view: View3D) => RendererJob) {
        this.views = views;
        for (let v of views) {
            const job = this._startRenderJob(v, JobCtor);
            if (!job.renderState) job.start();
        }
        Engine3D._ensureLoop();
    }

    public getRenderJob(view: View3D): RendererJob {
        return this.renderJobs.get(view);
    }

    /** Pause every engine instance. The shared render loop keeps ticking
     *  until the current frame finishes, then stops on its own once every
     *  instance is paused (see `_tick`). Resume any instance to restart it. */
    public static pause() {
        for (const inst of Engine3D._instances) inst._paused = true;
    }

    /** Resume every engine instance and restart the shared render loop. */
    public static resume() {
        for (const inst of Engine3D._instances) inst._paused = false;
        Engine3D._ensureLoop();
    }

    /** Pause only this engine instance. Other instances keep rendering. */
    public pause() {
        this._paused = true;
    }

    /** Resume only this engine instance, restarting the shared render loop
     *  if it stopped while every instance was paused. */
    public resume() {
        this._paused = false;
        Engine3D._ensureLoop();
    }

    // -------- shared render loop --------

    private static _ensureLoop() {
        if (this._rafId === 0) {
            this._rafId = requestAnimationFrame((t) => this._tick(t));
        }
    }

    private static async _tick(time: number) {
        // Gate on the smallest desired frame interval across active instances.
        let minGate = 0;
        for (let inst of this._instances) {
            if (inst._paused) continue;
            if (inst._frameRateValue > 0 && (minGate === 0 || inst._frameRateValue < minGate)) {
                minGate = inst._frameRateValue;
            }
        }
        if (minGate > 0) {
            let delta = time - this._time;
            if (delta < minGate) {
                let t = performance.now();
                await new Promise(res => setTimeout(() => {
                    time += (performance.now() - t);
                    res(true);
                }, minGate - delta));
            }
            this._time = time;
        }

        // Advance global time once per composite frame.
        Time.delta = time - Time.time;
        Time.time = time;
        Time.frame += 1;
        Interpolator.tick(Time.delta);

        let anyActive = false;
        for (let inst of this._instances) {
            if (inst._paused) continue;
            anyActive = true;
            await inst._renderOnce(time);
        }

        this._rafId = 0;
        // Keep the shared loop alive only while at least one instance is
        // active; when every instance is paused it stops here and a later
        // resume() restarts it via _ensureLoop().
        if (anyActive) this._ensureLoop();
    }

    private async _renderOnce(_time: number) {
        // If this engine's GPU device has been lost (driver reset, tab
        // suspended, explicit destroy), skip the frame entirely. Any
        // command-encoder / queue.submit call would throw. Other engines
        // in `_instances` keep rendering unaffected.
        if (this.context3D.lost) return;

        this.frameCount++;

        let views = this.views;
        let ctxSize = this.context3D.presentationSize;
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            view.scene.waitUpdate();
            view.camera.viewPort.setTo(0, 0, ctxSize[0], ctxSize[1]);
        }

        if (this._beforeRender) await this._beforeRender();

        // Per-view component updates (filter by the views owned by this engine).
        const viewSet = new Set(views);
        const runViewMap = (src: Map<View3D, Map<any, Function>> | undefined) => {
            if (!src) return;
            for (const [k, v] of src) {
                if (!viewSet.has(k)) continue;
                for (const [comp, cb] of v) {
                    if (comp.enable) cb(k);
                }
            }
        };

        runViewMap(ComponentCollect.componentsBeforeUpdateList);

        let command = this.context3D.device.createCommandEncoder();
        if (ComponentCollect.componentsComputeList) {
            for (const [k, v] of ComponentCollect.componentsComputeList) {
                if (!viewSet.has(k)) continue;
                for (const [comp, cb] of v) {
                    if (comp.enable) cb(k, command);
                }
            }
        }
        this.context3D.device.queue.submit([command.finish()]);

        runViewMap(ComponentCollect.componentsUpdateList);

        if (ComponentCollect.graphicComponent) {
            for (const [k, v] of ComponentCollect.graphicComponent) {
                if (!viewSet.has(k)) continue;
                for (const [comp, cb] of v) {
                    if (k && comp.enable) cb(k);
                }
            }
        }

        if (this._renderLoop) await this._renderLoop();

        WasmMatrix.updateAllContinueTransform(0, Matrix4.useCount, Time.delta, this.setting.useRTE ? this.setting.RTEScale : 0.0);
        let globalMatrixBindGroup = GlobalBindGroup.getModelMatrixBindGroup(this.context3D);
        globalMatrixBindGroup.writeBuffer(Matrix4.useCount * 16);

        this.renderJobs.forEach((v) => {
            if (!v.renderState) v.start();
            v.renderFrame();
        });

        runViewMap(ComponentCollect.componentsLateUpdateList);

        if (this._lateRender) await this._lateRender();
    }
}

// Installed at module load so gfx-layer code (Texture._ensureBound) can
// fall back to the single-engine default ctx without importing Engine3D.
_registerDefaultCtxResolver(Engine3D._soleContext);

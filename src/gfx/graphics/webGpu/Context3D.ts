import { CEvent } from '../../../event/CEvent';
import { CEventDispatcher } from '../../../event/CEventDispatcher';
import { CResizeEvent } from '../../../event/CResizeEvent';
import { CanvasConfig } from './CanvasConfig';
import { Texture } from './core/texture/Texture';

/**
 * Per-instance WebGPU device/context. Each Engine3D instance owns its
 * own Context3D with a dedicated GPUAdapter, GPUDevice, canvas and
 * GPUCanvasContext. Devices are fully isolated — no GPU resource
 * (texture, buffer, pipeline, layout) can be shared across contexts.
 *
 * Every GPU-bearing object in the scene graph (Texture, Material,
 * Geometry, GPUBuffer, RenderShaderPass, ComputeShader, ...) binds to
 * exactly one Context3D on first render and holds it in `_boundCtx`.
 * Attempting to render the same object under a different Context3D
 * throws — users must `.clone()` CPU data to share across engines.
 *
 * @group GFX
 */
export class Context3D extends CEventDispatcher {
    /** Canvas aspect ratio (`windowWidth / windowHeight`), recomputed on resize. */
    public aspect: number;
    /** Drawable surface size in physical pixels as `[width, height]`. */
    public presentationSize: number[] = [0, 0];
    /** The HTML canvas element this context renders into. */
    public canvas: HTMLCanvasElement;
    /** The WebGPU canvas context obtained from `canvas.getContext('webgpu')`. */
    public context: GPUCanvasContext;
    /** Canvas backing-store width in physical pixels (clientWidth * pixelRatio). */
    public windowWidth: number;
    /** Canvas backing-store height in physical pixels (clientHeight * pixelRatio). */
    public windowHeight: number;
    /** The canvas/configuration options supplied to `init()`. */
    public canvasConfig: CanvasConfig;
    private _pixelRatio: number = 1.0;
    private _resizeEvent: CEvent;
    private _resizeObserver: ResizeObserver | null = null;
    private _ownsCanvas: boolean = false;

    /** The GPUAdapter this context requested during `init()`. */
    public adapter: GPUAdapter;
    /** The GPUDevice owned by this context; the root handle for all GPU work. */
    public device: GPUDevice;
    /** The format pipelines target — the sRGB view variant, so the
     *  GPU does the linear→sRGB encode at write time. Must match the
     *  view created in `GPUContext.beginRenderPass`. */
    public presentationFormat: GPUTextureFormat;
    /** The non-sRGB swapchain configure format. Chromium rejects
     *  sRGB variants in `GPUCanvasContext.configure`, so the canvas
     *  is configured non-sRGB and an sRGB view is created on top. */
    private _swapchainConfigureFormat: GPUTextureFormat;

    /** Back-reference to the owning Engine3D. Populated by `new Engine3D()`
     *  immediately after constructing this Context3D. Used by per-context
     *  subsystems (GlobalUniformGroup, RenderShaderPass, ...) to read the
     *  engine's instance `setting` without needing a view/camera handle. */
    public engine: import('../../../Engine3D').Engine3D | null = null;

    /** Set to true when the underlying GPUDevice has been lost (driver reset,
     *  device unplug, tab/iframe suspended, explicit `device.destroy()`...).
     *  Once lost, the device is permanently unusable — all `_boundCtx`
     *  resources on this Context3D are stale. The owning Engine3D stops
     *  scheduling render frames. App code should listen for
     *  `Context3D.DEVICE_LOST` and call `Engine3D.init()` again to recover. */
    public lost: boolean = false;
    /** The `GPUDeviceLostInfo` captured when the device was lost, else null. */
    public lostInfo: GPUDeviceLostInfo | null = null;

    /** Event type dispatched on this Context3D when `device.lost` fires.
     *  `event.data` is the `GPUDeviceLostInfo` (reason + message). */
    public static readonly DEVICE_LOST: string = 'deviceLost';

    /** Per-Context3D GPU command/pipeline state (lazy).
     *  Factory is installed by GPUContext.ts at its module load to avoid a
     *  circular ESM import at Context3D load time. */
    private _gpuContext: import('../../renderJob/GPUContext').GPUContextInstance | null = null;
    /**
     * The per-Context3D GPU command/pipeline state, created lazily on first
     * access. Requires GPUContext.ts to have been imported so its factory is
     * registered; throws otherwise.
     *
     * @returns the GPUContextInstance bound to this Context3D.
     */
    public get gpuContext(): import('../../renderJob/GPUContext').GPUContextInstance {
        if (!this._gpuContext) {
            if (!_gpuContextFactory) throw new Error('gpuContext factory not registered — import GPUContext before using gpuContext.');
            this._gpuContext = _gpuContextFactory(this);
        }
        return this._gpuContext;
    }

    /** Device pixel ratio used to scale the canvas backing store (clamped to 2.0). */
    public get pixelRatio() { return this._pixelRatio; }

    /**
     * Initialize the WebGPU adapter, device, canvas and swapchain for this
     * context, wire up uncaptured-error and device-lost handlers, and start
     * observing the canvas for resize.
     *
     * @param canvasConfig optional canvas/configuration; when omitted (or
     *        without a `canvas`), a full-screen canvas is created and owned
     *        by this context.
     * @returns a promise resolving to true once initialization completes.
     */
    async init(canvasConfig?: CanvasConfig): Promise<boolean> {
        if (navigator.gpu === undefined) throw new Error('Your browser does not support WebGPU!');
        this.adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (!this.adapter) throw new Error('Your browser does not support WebGPU!');
        // Cross-platform shadow debugging: dump adapter backend + features so
        // Mac (Metal) vs Windows (D3D12/Vulkan) behavior can be triaged from
        // a single screenshot of the devtools console. `info` is only defined
        // on recent Chrome; falls back to a stub with an empty backend name.
        const ainfo: any = (this.adapter as any).info;
        if (ainfo) {
            const f = (k: string) => (ainfo[k] !== undefined && ainfo[k] !== '') ? ainfo[k] : '<empty>';
            // if (import.meta.env.DEV) console.log(
            //     `[Context3D] adapter.info backend=${f('backend')} vendor=${f('vendor')} ` +
            //     `architecture=${f('architecture')} device=${f('device')} description=${f('description')}`
            // );
        } else {
            // Older Chrome / Electron didn't expose adapter.info synchronously.
            // Try the deprecated async requestAdapterInfo() as a fallback.
            try {
                const infoAsync = await (this.adapter as any).requestAdapterInfo?.();
                if (infoAsync) {
                    // if (import.meta.env.DEV) console.log(
                    //     `[Context3D] requestAdapterInfo() vendor=${infoAsync.vendor ?? '?'} ` +
                    //     `architecture=${infoAsync.architecture ?? '?'} device=${infoAsync.device ?? '?'}`
                    // );
                } else {
                    if (import.meta.env.DEV) console.log('[Context3D] adapter.info not exposed by this Chrome/Electron build');
                }
            } catch (e: any) {
                console.log('[Context3D] adapter.info probe failed:', e?.message ?? e);
            }
        }
        const avail = Array.from((this.adapter.features as any) || []);
        // if (import.meta.env.DEV) console.log('[Context3D] adapter.features =', avail.join(', '));
        this.device = await this.adapter.requestDevice({
            requiredFeatures: [
                'bgra8unorm-storage',
                'depth-clip-control',
                'depth32float-stencil8',
                'indirect-first-instance',
                'rg11b10ufloat-renderable',
            ],
            requiredLimits: {
                minUniformBufferOffsetAlignment: 256,
                maxStorageBufferBindingSize: this.adapter.limits.maxStorageBufferBindingSize,
                // A PBR material with its base maps plus the KHR extension
                // maps (sheen / iridescence / specular / anisotropy) binds
                // more than the 16 sampled textures the default limit allows
                // per stage. Ask for what the adapter offers, capped at 32.
                // Samplers are NOT raised: Metal caps them at 16, so the
                // extension maps share baseMapSampler instead.
                maxSampledTexturesPerShaderStage: Math.min(this.adapter.limits.maxSampledTexturesPerShaderStage, 32),
            }
        });
        if (!this.device) throw new Error('Your browser does not support WebGPU!');
        this.device.label = `device-${Context3D._nextLabel++}`;
        // Configure swapchain with the preferred non-sRGB format
        // (Chromium rejects `*-srgb` as a canvas configure format),
        // but expose the sRGB view variant via `viewFormats` so
        // pipelines and per-frame `getCurrentTexture().createView()`
        // can request hardware linear→sRGB encode at write time.
        // The pipeline target format we publish (presentationFormat)
        // is the sRGB *view* format — that's what fragment shaders
        // are validated against, and what GPUContext.ts uses when
        // it builds the colorAttachment view.
        const preferred = navigator.gpu.getPreferredCanvasFormat();
        if (preferred === 'bgra8unorm') {
            this.presentationFormat = 'bgra8unorm-srgb' as GPUTextureFormat;
            this._swapchainConfigureFormat = 'bgra8unorm';
        } else if (preferred === 'rgba8unorm') {
            this.presentationFormat = 'rgba8unorm-srgb' as GPUTextureFormat;
            this._swapchainConfigureFormat = 'rgba8unorm';
        } else {
            this.presentationFormat = preferred;
            this._swapchainConfigureFormat = preferred;
        }
        // if (import.meta.env.DEV) console.log(`[Context3D] presentationFormat = ${this.presentationFormat} (preferred=${preferred})`);
        // Catch *every* validation / out-of-memory error from the device so
        // silent D3D12 failures (e.g. shadow pipeline creation, depth texture
        // copy) surface in the console instead of just "no shadows".
        this.device.addEventListener('uncapturederror', (event: any) => {
            const e = event.error;
            console.error('[WebGPU uncaptured]', e?.constructor?.name ?? 'Error', e?.message ?? e);
        });

        // Subscribe to device-lost once. Fires on driver reset, tab suspend,
        // explicit `device.destroy()`, or GPU process crash. We don't attempt
        // auto-recovery — the device is irrecoverable — but we flag the
        // context and dispatch an event so the engine stops rendering and
        // apps can dispose + recreate.
        this.device.lost.then((info) => {
            this.lost = true;
            this.lostInfo = info;
            this.dispatchEvent(new CEvent(Context3D.DEVICE_LOST, info));
        });

        this.canvasConfig = canvasConfig;
        if (canvasConfig && canvasConfig.canvas) {
            this.canvas = canvasConfig.canvas;
            if (this.canvas === null) throw new Error('no Canvas');
            if (!this.canvas.style.width) this.canvas.style.width = this.canvas.width + 'px';
            if (!this.canvas.style.height) this.canvas.style.height = this.canvas.height + 'px';
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = `absolute`;
            this.canvas.style.top = '0px';
            this.canvas.style.left = '0px';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = canvasConfig?.zIndex ? canvasConfig.zIndex.toString() : '0';
            document.body.appendChild(this.canvas);
            this._ownsCanvas = true;
        }

        if (canvasConfig && canvasConfig.backgroundImage) {
            this.canvas.style.background = `url(${canvasConfig.backgroundImage})`;
            this.canvas.style['background-size'] = 'cover';
            this.canvas.style['background-position'] = 'center';
        } else {
            this.canvas.style.background = 'transparent';
        }

        this.canvas.style['touch-action'] = 'none';
        this.canvas.style['object-fit'] = 'cover';

        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: this._swapchainConfigureFormat,
            viewFormats: this._swapchainConfigureFormat !== this.presentationFormat
                ? [this.presentationFormat]
                : undefined,
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: 'premultiplied',
            colorSpace: `srgb`
        });

        this._resizeEvent = new CResizeEvent(CResizeEvent.RESIZE, { width: this.windowWidth, height: this.windowHeight });
        this._resizeObserver = new ResizeObserver(async () => {
            this.updateSize();
            // Don't destroy the old GPU textures inline — `updateSize`
            // synchronously fires the RESIZE event, which makes every
            // RenderTexture allocate a new GPU texture and queue the old
            // one in the delay-destroy list. But the current frame's
            // command buffer was already submitted referencing the OLD
            // texture; if we destroy now (synchronously, before the GPU
            // has finished the in-flight submit), the GPU dequeues the
            // submit AFTER the destroy and reports
            //   "Destroyed texture [...rgba32float] used in a submit".
            // `queue.onSubmittedWorkDone()` resolves only after every
            // command buffer submitted up to this point has fully
            // executed on the GPU — by then no live submit can still
            // reference the old textures, so destroying is safe.
            try {
                if (this.device && !this.lost) {
                    await this.device.queue.onSubmittedWorkDone();
                }
            } catch {
                // device might have been lost between the await and the
                // resolve; the destroy below is a no-op in that case.
            }
            Texture.destroyTexture(this);
        });

        this._resizeObserver.observe(this.canvas);
        this.updateSize();
        return true;
    }

    /**
     * Release everything this context owns: the ResizeObserver, the
     * GPUCanvasContext configuration, the GPUDevice (frees the adapter
     * slot so the next Engine3D.init() can succeed without exhausting
     * the browser's per-origin device limit), and any canvas we created
     * ourselves. Safe to call more than once; idempotent after first run.
     *
     * After dispose(), `this.lost` flips to true via the device.lost
     * promise resolver installed in init(); the shared render loop
     * already skips lost contexts.
     */
    public dispose() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this.context) {
            try { this.context.unconfigure(); } catch { /* already gone */ }
        }
        if (this.device && !this.lost) {
            try { this.device.destroy(); } catch { /* already gone */ }
        }
        if (this._ownsCanvas && this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this._caches.clear();
        this._gpuContext = null;
        // Every RenderTexture / ComputeShader / ViewQuad / PostBase / Camera3D
        // attached to this context subscribes to CResizeEvent.RESIZE with
        // `this` as the listener's thisObject. The ctx's dispatcher then keeps
        // a strong ref to every such instance, which back-ref this ctx via
        // `_boundCtx` — the cycle alone is collectable, but the instances are
        // usually also pinned externally (scene graph, pipeline caches),
        // transitively stranding this whole device after dispose. Purge here.
        this.removeAllEventListener();
    }

    /**
     * Recompute the pixel ratio and canvas backing-store size from the
     * current client size. When the size changes, updates `windowWidth`,
     * `windowHeight`, `presentationSize`, `aspect` and dispatches a RESIZE event.
     */
    public updateSize() {
        this._pixelRatio = this.canvasConfig?.devicePixelRatio || window.devicePixelRatio || 1;
        this._pixelRatio = Math.min(this._pixelRatio, 2.0);
        let w = Math.floor(this.canvas.clientWidth * this._pixelRatio);
        let h = Math.floor(this.canvas.clientHeight * this._pixelRatio);
        if (w != this.windowWidth || h != this.windowHeight) {
            this.canvas.width = this.windowWidth = w;
            this.canvas.height = this.windowHeight = h;
            this.presentationSize[0] = this.windowWidth;
            this.presentationSize[1] = this.windowHeight;
            this.aspect = this.windowWidth / this.windowHeight;
            this._resizeEvent.data.width = this.windowWidth;
            this._resizeEvent.data.height = this.windowHeight;
            this.dispatchEvent(this._resizeEvent);
        }
    }

    private static _nextLabel: number = 0;

    /**
     * Per-Context3D lazy cache. Stores one value per `key` (typically the
     * owning class) so GPU objects can be memoized against a specific device
     * without leaking across Context3Ds.
     *
     * Usage: `ctx.cache(MyClass, () => new ExpensiveThing(ctx))`.
     */
    private _caches: Map<unknown, unknown> = new Map();
    public cache<T>(key: unknown, factory: () => T): T {
        let v = this._caches.get(key) as T | undefined;
        if (v === undefined) {
            v = factory();
            this._caches.set(key, v);
        }
        return v;
    }
}

/** @internal Resolver slot for single-engine ergonomics. Engine3D
 *  registers a function returning the sole live engine's Context3D
 *  (or null when zero / multiple engines exist) at its module load,
 *  so gfx-layer code can fall back to the unambiguous default without
 *  importing Engine3D (circular ESM import otherwise). */
let _defaultCtxResolver: (() => Context3D | null) | null = null;
export function _registerDefaultCtxResolver(f: () => Context3D | null): void {
    _defaultCtxResolver = f;
}
/** @internal The sole live engine's Context3D, or null when the choice
 *  would be ambiguous (no engine yet, or 2+ engines). */
export function resolveDefaultCtx(): Context3D | null {
    return _defaultCtxResolver ? _defaultCtxResolver() : null;
}

/** @internal Factory slot so GPUContext.ts can register its instance creator
 *  without Context3D.ts statically importing it (would be a circular ESM
 *  import otherwise). */
let _gpuContextFactory: ((ctx: Context3D) => import('../../renderJob/GPUContext').GPUContextInstance) | null = null;
export function _registerGpuContextFactory(f: (ctx: Context3D) => import('../../renderJob/GPUContext').GPUContextInstance): void {
    _gpuContextFactory = f;
}

/**
 * Bind a GPU-bearing object to a Context3D on first use. Idempotent for
 * the same ctx; throws if called with a different ctx than the one this
 * object was first bound to.
 *
 * Plan-B contract: each GPU-bearing resource (Texture / Material /
 * Geometry / GPUBuffer / Shader / Pass) may only be used by a single
 * Engine3D. To share across engines, users must clone CPU data.
 *
 * @internal
 */
export function bindCtx(owner: { _boundCtx: Context3D | null }, ctx: Context3D): Context3D {
    if (owner._boundCtx === ctx) return ctx;
    if (owner._boundCtx && owner._boundCtx !== ctx) {
        throw new Error(
            `GPU resource already bound to a different Engine3D. ` +
            `Each GPU-bearing resource may only be used by one engine. ` +
            `Clone the CPU data to share across engines.`
        );
    }
    owner._boundCtx = ctx;
    return ctx;
}


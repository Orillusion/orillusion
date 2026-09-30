import { ViewQuad } from '../../../core/ViewQuad';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { UniformNode } from '../../graphics/webGpu/core/uniforms/UniformNode';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { RTFrame } from '../frame/RTFrame';
import { RTResourceMap } from '../frame/RTResourceMap';
import { ComputeShader } from '../../../gfx/graphics/webGpu/shader/ComputeShader';
import { RTResourceConfig } from '../config/RTResourceConfig';
import { PostPass } from '../graph/passes/PostPass';
import { View3D } from '../../../core/View3D';
import { Reference } from '../../../util/Reference';
import { CResizeEvent } from '../../../event/CResizeEvent';
import { bindCtx, Context3D, resolveDefaultCtx } from '../../graphics/webGpu/Context3D';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { EngineSetting } from '../../../setting/EngineSetting';
/**
 * @internal
 * Base class for post-processing effects
 * @group Post Effects
 */
export class PostBase {
    public enable: boolean = true;
    /** When true, PostPass iterates this post AFTER every regular
     *  post regardless of attach order — used by TonemapPost so the
     *  ACES curve always lands on the fully-composited HDR signal. */
    public isFinalPass: boolean = false;
    public postRenderer: PostPass;
    public rendererPassState: RendererPassState;
    public _boundCtx: Context3D | null = null;
    private _resourceCreated: boolean = false;
    protected rtViewQuad: Map<string, ViewQuad>;
    protected virtualTexture: Map<string, VirtualTexture>;

    constructor() {
        this.rtViewQuad = new Map<string, ViewQuad>();
        this.virtualTexture = new Map<string, VirtualTexture>();
    }

    protected bindView(view: View3D) {
        let ctx = view.engine3D.context3D;
        bindCtx(this, ctx);
        ctx.addEventListener(CResizeEvent.RESIZE, this.onResize, this);
        this._resizeListenerCtx = ctx;
        if (!this._resourceCreated) {
            this._resourceCreated = true;
            this.createResource(view);
        }
    }

    /** Per-engine setting tree. Safe to use from any Post method body and
     *  from sample code after `addPost(...)` — `_boundCtx` is set before
     *  any `onAttach` / `render` / getter access by user code. */
    protected get setting(): EngineSetting {
        // A post created through `PostProcessingComponent.addPost` before
        // `startRenderView()` is not bound to a context yet. With a single
        // engine its settings are unambiguous, so fall back to that one;
        // with several engines the caller has to wait for the view to start.
        const ctx = this._boundCtx ?? resolveDefaultCtx();
        if (!ctx?.engine) {
            throw new Error(`${this.constructor.name}: not attached to a view yet and there is no single default engine to read settings from — configure the effect after startRenderView().`);
        }
        return ctx.engine.setting;
    }

    private _resizeListenerCtx: Context3D | null = null;

    protected createResource(view: View3D) { }

    protected createRTTexture(name: string, rtWidth: number, rtHeight: number, format: GPUTextureFormat, useMipmap: boolean = false, sampleCount: number = 0) {
        let rt = RTResourceMap.createRTTexture(this._boundCtx!, name, rtWidth, rtHeight, format, useMipmap, sampleCount);
        rt.name = name;
        this.virtualTexture.set(name, rt);
        Reference.getInstance().attached(rt, this);
        return rt;
    }

    protected createViewQuad(name: string, shaderName: string, outRtTexture: VirtualTexture, msaa: number = 0) {
        let rtFrame = new RTFrame([outRtTexture], [new RTDescriptor()]);
        let viewQuad = new ViewQuad(this._boundCtx!, 'Quad_vert_wgsl', shaderName, rtFrame, msaa);
        this.rtViewQuad.set(name, viewQuad);
        return viewQuad;
    }

    protected getLastRenderTexture(): Texture {
        let colorTexture: Texture;
        let renderTargets = this._boundCtx!.gpuContext.lastRenderPassState.renderTargets;
        if (renderTargets.length > 0) {
            colorTexture = renderTargets[0];
        } else {
            colorTexture = RTResourceMap.getTexture(this._boundCtx!, RTResourceConfig.colorBufferTex_NAME);
        }
        return colorTexture;
    }

    /**
     * Per-compute upstream texture tracker. Keyed by ComputeShader + binding
     * name; remembers the last upstream texture each binding was wired to so
     * we can detect when the chain changed and rebind cheaply.
     *
     * Lives on PostBase rather than the ComputeShader because the notion of
     * "upstream" is a post-chain concept (resolved via getLastRenderTexture),
     * not a property of the compute shader itself.
     */
    private _upstreamBindings: WeakMap<ComputeShader, Map<string, Texture>> = new WeakMap();

    /**
     * Bind `binding` on `compute` to whatever `getLastRenderTexture()`
     * resolves this frame, and invalidate the compute's group-0 bind group
     * if the upstream texture identity changed since last frame.
     *
     * The framework's enable-toggle contract (PostPass.execute skips
     * disabled posts so the next enabled post sees their predecessor's
     * `lastRenderPassState`) only works if downstream posts re-read the
     * upstream every frame. Lazy-init latching (the historical pattern,
     * `setSamplerTexture('inTex', this.getLastRenderTexture())` once during
     * resource creation) bakes the *initial* upstream into the bind group
     * and never updates it — toggling an upstream post off then leaves the
     * downstream sampler pointing at a no-longer-updated texture and the
     * screen freezes.
     *
     * Call this once per binding per render(). Cost is two map lookups + a
     * reference compare when nothing changed; bind group rebuild only fires
     * when the upstream texture object actually flipped.
     */
    protected bindUpstream(compute: ComputeShader, binding: string): Texture {
        const upstream = this.getLastRenderTexture();
        let map = this._upstreamBindings.get(compute);
        if (!map) { map = new Map(); this._upstreamBindings.set(compute, map); }
        if (map.get(binding) !== upstream) {
            compute.setSamplerTexture(binding, upstream);
            // Invalidate group 0 so genGroups rebuilds on the next dispatch.
            // The new binding refs are already in `_sampleTextureDic`, so
            // the rebuild picks them up automatically.
            compute.bindGroups[0] = null as any;
            map.set(binding, upstream);
        }
        return upstream;
    }

    public compute(view: View3D) { }

    public onAttach(view: View3D) { }

    public onDetach(view: View3D) { }

    public onResize() {}

    public render(view: View3D, command: GPUCommandEncoder) {}

    public destroy(force?: boolean) {
        this.postRenderer = null;
        // Drop the RESIZE listener registered on the Context3D in bindView.
        // Without this, the ctx's dispatcher keeps a strong ref to `this`,
        // and `this._boundCtx` keeps a strong ref back to the ctx — the
        // cycle alone is fine, but the ctx is usually also anchored by
        // some static field, so the whole thing (including the post's
        // RenderTextures) outlives Engine3D.dispose().
        if (this._resizeListenerCtx) {
            this._resizeListenerCtx.removeEventListener(CResizeEvent.RESIZE, this.onResize, this);
            this._resizeListenerCtx = null;
        }
        // Map.values is a FUNCTION, not an indexable collection — the old
        // `map.values[i]` always read `undefined` and threw on `.destroy`.
        // Iterate the Map itself.
        if (this.rtViewQuad) {
            for (const quad of this.rtViewQuad.values()) {
                quad.destroy(force);
            }
            this.rtViewQuad.clear();
            this.rtViewQuad = null;
        }

        if (this.virtualTexture) {
            for (const tex of this.virtualTexture.values()) {
                Reference.getInstance().detached(tex, this);
                tex.destroy(force);
            }
            this.virtualTexture.clear();
            this.virtualTexture = null;
        }
    }
}

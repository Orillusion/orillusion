import { ShaderLib } from '../../../../assets/shader/ShaderLib';
import { FullQuad_vert_wgsl } from '../../../../assets/shader/quad/Quad_shader';
import { View3D } from '../../../../core/View3D';
import { Context3D } from '../../../graphics/webGpu/Context3D';
import { Texture } from '../../../graphics/webGpu/core/texture/Texture';
import { WebGPUDescriptorCreator } from '../../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { FXAAPost } from '../../post/FXAAPost';
import { PostBase } from '../../post/PostBase';
import { TonemapPost } from '../../post/TonemapPost';
import { RendererPassState } from '../../passRenderer/state/RendererPassState';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';
import { COLOR_BUFFER } from './ColorPass';
import { MOTION_VECTOR } from './MotionVectorPass';

/**
 * Published handle name for the final post-chain output. Resolves to
 * whatever texture the last enabled post wrote — tone-mapped color
 * when the full chain runs, FXAA-sharpened color when only FXAA is
 * enabled, or the colorPass GBuffer texture when no post effects are
 * enabled at all. {@link GUIPass} reads this handle to decide what
 * texture to draw to the canvas.
 *
 * @group Graph
 */
export const FINAL_COLOR = '_FinalColor';

/**
 * Post-effect chain runner. Owns the attached `PostBase` list, runs
 * compute → non-final render → final render in attach order each
 * frame, and exposes the chain end via the `_FinalColor` graph handle.
 *
 * The internal sub-pass ordering (each `*Post.ts` reads
 * `gpu.lastRenderPassState` from the previous one) is stateful and
 * intentionally lives inside the chain rather than as N graph nodes:
 * splitting per-post would force every post to read/write a named
 * graph handle, a per-`*Post.ts` migration that's plan-deferred.
 *
 * @group Graph
 */
export class PostPass extends RenderGraphPass {
    public readonly name = 'PostPass';

    public readonly postList: Map<string, PostBase> = new Map();
    public debugTextures: any[] = [];

    protected _ctx!: Context3D;
    protected _rendererPassState!: RendererPassState;

    public setup(b: RenderGraphBuilder): void {
        const view = b.view;
        const ctx = b.context3D;
        this._ctx = ctx;

        ShaderLib.register('FullQuad_vert_wgsl', FullQuad_vert_wgsl);

        // Wire a renderer-pass state against the colorPass GBuffer so
        // posts that read the GBuffer attachments via the legacy
        // `rendererPassState` field continue to find them.
        const gbufferFrame = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer, ctx);
        this._rendererPassState = WebGPUDescriptorCreator.createRendererPassState(ctx, gbufferFrame);

        // Default chain: FXAAPost is always attached. Tonemap is
        // attached unless explicitly disabled via
        // `setting.render.tonemap.enable === false`. Both are
        // routed through `attachPost` so they participate in the
        // same pre-init / view-binding flow as user posts.
        this.attachPost(view, new FXAAPost());
        if (view.engine3D.setting.render.tonemap?.enable !== false) {
            this.attachPost(view, new TonemapPost());
        }

        b.read(COLOR_BUFFER);
        // Posts (MotionBlurPost) may sample this frame's motion vectors.
        b.read(MOTION_VECTOR);
        // _FinalColor: a dynamic getter that resolves to whatever
        // texture the post chain ended with. Falls back to the color
        // buffer when no posts are enabled.
        b.write<Texture>(FINAL_COLOR, () => {
            const gpu = this._ctx.gpuContext;
            if (gpu.lastRenderPassState) {
                return gpu.lastRenderPassState.getLastRenderTexture(this._ctx);
            }
            return GBufferFrame
                .getGBufferFrame(GBufferFrame.colorPass_GBuffer, this._ctx)
                .getColorTexture();
        });
    }

    public attachPost(view: View3D, post: PostBase): void {
        post.postRenderer = this as any;
        const clsName = post.constructor.name;
        if (!this.postList.has(clsName)) {
            this.postList.set(clsName, post);
            (post as any).bindView(view);
            post.onAttach(view);
        }
    }

    public detachPost(view: View3D, post: PostBase): boolean {
        const clsName = post.constructor.name;
        const had = this.postList.has(clsName);
        if (had) {
            this.postList.delete(clsName);
            post.onDetach(view);
            post.postRenderer = null;
        }
        return had;
    }

    /** Legacy compat — some posts call into this pass state from
     *  `bindView`. The colorPass GBuffer is a stable input shared
     *  across the whole chain. */
    public get rendererPassState(): RendererPassState {
        return this._rendererPassState;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const view = ctx.view;
        const gpu = view.engine3D.context3D.gpuContext;

        // Reset to the ColorPass GBuffer state at the start of every frame.
        // Without this, if a post was enabled last frame and is disabled
        // this frame, gpu.lastRenderPassState would still point at that
        // post's rtFrame from the previous frame — and downstream posts
        // sampling via getLastRenderTexture() would bind a stale, no-longer
        // updated texture. The ColorPass output is the canonical "no post
        // ran yet" upstream and is what the first enabled non-final post
        // should see.
        gpu.lastRenderPassState = this._rendererPassState;

        this.postList.forEach((v) => {
            if (v.enable) v.compute(view);
        });

        const command = gpu.beginCommandEncoder();
        // Non-final posts (Bloom, FXAA, GodRay, ...) drain in attach
        // order — each samples the previous via `lastRenderPassState`,
        // so order matters.
        this.postList.forEach((v) => {
            if (v.enable && !v.isFinalPass) {
                v.render(view, command);
                if (v.rendererPassState) {
                    gpu.lastRenderPassState = v.rendererPassState;
                }
            }
        });
        // Final passes (TonemapPost) always run last regardless of
        // attach order so the curve lands on the fully-composited
        // HDR signal.
        this.postList.forEach((v) => {
            if (v.enable && v.isFinalPass) {
                v.render(view, command);
                if (v.rendererPassState) {
                    gpu.lastRenderPassState = v.rendererPassState;
                }
            }
        });
        gpu.endCommandEncoder(command);
    }

    /** Tears down every attached PostBase instance. Called via the
     *  graph's destroy() walk. */
    public destroy(): void {
        for (const post of this.postList.values()) {
            post.destroy?.();
        }
        this.postList.clear();
    }
}

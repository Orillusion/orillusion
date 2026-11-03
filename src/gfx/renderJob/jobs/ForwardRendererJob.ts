import { View3D } from '../../../core/View3D';
import { ClusterLightingPass } from '../graph/passes/ClusterLightingPass';
import { ColorPass } from '../graph/passes/ColorPass';
import { DecalShadowVolumePass } from '../graph/passes/DecalShadowVolumePass';
import { FluidPass } from '../graph/passes/FluidPass';
import { GBufferResourcePass } from '../graph/passes/GBufferResourcePass';
import { GIPass } from '../graph/passes/GIPass';
import { GPUCullPass } from '../graph/passes/GPUCullPass';
import { GUIPass } from '../graph/passes/GUIPass';
import { HiZPass } from '../graph/passes/HiZPass';
import { MotionVectorPass } from '../graph/passes/MotionVectorPass';
import { PointShadowPass } from '../graph/passes/PointShadowPass';
import { PostPass } from '../graph/passes/PostPass';
import { PreDepthPass } from '../graph/passes/PreDepthPass';
import { ReflectionPass } from '../graph/passes/ReflectionPass';
import { SceneCapturePass } from '../graph/passes/SceneCapturePass';
import { SceneColorPyramidPass } from '../graph/passes/SceneColorPyramidPass';
import { ShadowPass } from '../graph/passes/ShadowPass';
import { SkyPass } from '../graph/passes/SkyPass';
import { SortedTransparentPass } from '../graph/passes/SortedTransparentPass';
import { TransmissionOpaquePass } from '../graph/passes/TransmissionOpaquePass';
import { TransparentDualDepthPeelingPass } from '../graph/passes/TransparentDualDepthPeelingPass';
import { TransparentDualDepthPeelingResolvePass } from '../graph/passes/TransparentDualDepthPeelingResolvePass';
import { TransparentOITPass } from '../graph/passes/TransparentOITPass';
import { TransparentResolvePass } from '../graph/passes/TransparentResolvePass';
import { RendererJob } from './RendererJob';

/**
 * Forward+ rendering job — the engine's default. Composes the
 * standard pass set on construction:
 *
 *   ClusterLighting → [PreDepth] → HiZ → MotionVector → [GPUCull]
 *     → Shadow → PointShadow → Reflection → [GI] → Color
 *     → SceneColorPyramid → TransmissionOpaque → [Decal] → [Fluid]
 *     → SortedTransparent (+ optional WBOIT / DDP transparent path)
 *     → Post → GUI(present)
 *
 * Bracketed passes are gated on engine settings (`zPrePass`,
 * `gpuCull`, `gi.enable`, `decals`, `fluid`, `useOIT`).
 *
 * @group GFX
 */
export class ForwardRendererJob extends RendererJob {
    constructor(view: View3D) {
        super(view);
        const setting = view.engine3D.setting;
        const giEnabled = !!setting.gi.enable;
        const useOIT = !!(setting.render as any).useOIT;
        const useGPUCull = !!(setting.render as any).gpuCull;
        const useDecals = !!(setting.render as any).decals;
        const useFluid = !!setting.render.fluid;

        // Cluster lighting — runs first so downstream passes can
        // sample _ClusterLightingBuffer.
        this.graph.add(ClusterLightingPass);

        // Z-prepass: gated on `setting.render.zPrePass`. When on,
        // ColorPass hooks its pipeline depth-load-op to the prepass
        // depth so opaque overdraw is skipped.
        if (setting.render.zPrePass) {
            this.graph.add(PreDepthPass);
        }

        // Hi-Z depth pyramid for SSR / GPU-cull occlusion / Volumetric
        // Fog visibility. Always allocated; sample at runtime.
        this.graph.add(HiZPass);

        // Motion Vector for TAA / motion blur / temporal denoisers.
        this.graph.add(MotionVectorPass);

        if (useGPUCull) {
            this.graph.add(GPUCullPass);
        }

        // Shadow maps. Both passes register unconditionally; per-light
        // shadow on/off is decided inside execute via `setting.shadow`.
        this.graph.add(ShadowPass);
        this.graph.add(PointShadowPass);

        // Reflection probe pre-filter.
        this.graph.add(ReflectionPass);

        // GI (DDGI). Gated; depends on shadow inputs which are
        // already added above so its setup() can b.read them
        // and pull the textures from the pool.
        if (giEnabled) {
            this.graph.add(GIPass);
        }

        // Off-screen scene capture (mirrors / monitors / portals).
        // Reads shadow handles to force ordering after ShadowPass /
        // PointShadowPass; consumer materials sample the per-component
        // RT directly via SceneCaptureCameraComponent. ColorPass declares
        // an explicit `b.dependsOn('SceneCapturePass')` so the captured
        // RTs are ready before main-pass materials sample them.
        // No-op when no SceneCaptureCameraComponents are registered.
        this.graph.add(SceneCapturePass);

        // GBuffer resource provider. Owns the colorPass_GBuffer
        // singleton + RendererPassStates + RenderContext, and publishes
        // _ColorBuffer / _NormalBuffer / _TransparentDrawContext. Lives
        // as its own pass so multiple ColorPass instances can share the
        // same g-buffer without any of them being the resource creator.
        this.graph.add(GBufferResourcePass);

        // Main color pass. Reads cluster + shadow + reflection inputs +
        // the shared GBuffer published by GBufferResourcePass. Pure
        // opaque draw — sky lives in its own pass below.
        this.graph.add(ColorPass, { giEnabled });

        // Sky. Continuation render pass on the shared color attachment,
        // gated by the depth written above. Mutator-write on
        // COLOR_BUFFER + insertion-order positioning keeps it slotted
        // after the primary opaque pass and before any downstream
        // reader (pyramid, post). Omit this `add` for a sky-less
        // pipeline; the rest of the graph keeps working.
        this.graph.add(SkyPass);

        // Scene color pyramid snapshot for transmission / refraction.
        this.graph.add(SceneColorPyramidPass);

        // Transmission split: opaque-with-transmission deferred to
        // after the pyramid so refraction samples the world behind.
        this.graph.add(TransmissionOpaquePass);

        // Projected decals — opt-in via `setting.render.decals`.
        // Placed between the opaque half and the transparent half.
        // Per-mesh decal occlusion (e.g. buildings that shouldn't get
        // painted) is composed by the application: exclude those meshes
        // from `ColorPass.layerMask` and draw them in a user pass
        // anchored after `DecalShadowVolumePass`.
        if (useDecals) {
            this.graph.add(DecalShadowVolumePass);
        }

        // Screen-space fluid — opt-in via `setting.render.fluid`. Clipped
        // by opaque depth; transparents draw over it.
        if (useFluid) {
            this.graph.add(FluidPass);
        }

        // Transparent half. With useOIT, sorted gets the 'sorted'
        // filter (skips weighted-OIT materials); without it, sorted
        // renders every transparent node.
        this.graph.add(SortedTransparentPass, useOIT ? 'sorted' : 'all');
        if (useOIT) {
            this.graph.add(TransparentOITPass);
            this.graph.add(TransparentDualDepthPeelingPass);
            this.graph.add(TransparentResolvePass);
            this.graph.add(TransparentDualDepthPeelingResolvePass);
        }

        // Post chain (FXAA + Tonemap default; user adds more via
        // PostProcessingComponent → RendererJob.addPost).
        this.graph.add(PostPass);

        // Present-to-canvas terminal.
        this.graph.add(GUIPass);
    }
}

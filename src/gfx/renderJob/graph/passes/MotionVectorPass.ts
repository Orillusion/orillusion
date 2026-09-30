import { MotionVector_cs } from '../../../../assets/shader/compute/MotionVector_cs';
import { ShaderLib } from '../../../../assets/shader/ShaderLib';
import { Matrix4 } from '../../../../math/Matrix4';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { Context3D } from '../../../graphics/webGpu/Context3D';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { UniformGPUBuffer } from '../../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';
import { TextureHandle } from '../transient/ResourceHandle';
import { TextureIdentityWatcher } from '../transient/TextureIdentityWatcher';
import { RTDescriptor } from '../../../graphics/webGpu/descriptor/RTDescriptor';
import { WebGPUDescriptorCreator } from '../../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { RTFrame } from '../../frame/RTFrame';
import { RTResourceMap } from '../../frame/RTResourceMap';
import { PassType } from '../../passRenderer/state/PassType';
import { RendererPassState } from '../../passRenderer/state/RendererPassState';
import { VelocityMaterialPass } from '../../../../materials/multiPass/VelocityMaterialPass';
import { COLOR_BUFFER } from './ColorPass';
import { preInitPassPipelines } from './_helpers';

export const MOTION_VECTOR = '_MotionVector';

/**
 * Per-pixel screen-space motion vector pass. Reverse-reprojects each
 * fragment's world position with the previous frame's viewProj matrix
 * to produce `(currUv - prevUv)` in rg16float storage.
 *
 * Consumed by TAA, motion blur, temporal denoisers.
 *
 * Camera-driven motion for every pixel. With
 * `engine.setting.render.objectMotionVectors` the pass then draws each
 * opaque mesh through its VELOCITY sub-pass (VelocityPass_shader) on top,
 * so moving objects carry their own velocity; the blue channel is 1 where
 * an object wrote the pixel.
 *
 * Phase 1 migration target — first pass to consume the transient
 * resource subsystem: declares its output through
 * `b.declareTexture` + `b.write(h, 'storage')` and resolves the
 * actual {@link RenderTexture} through `ctx.getTexture(handle)`
 * each frame. The pool may alias this output with any other
 * `rgba16float` screen-sized scratch texture whose lifetime ends
 * before MotionVectorPass runs.
 *
 * @group Graph
 */
export class MotionVectorPass extends RenderGraphPass {
    public readonly name = 'MotionVectorPass';

    protected _ctx!: Context3D;
    protected _mvHandle!: TextureHandle;
    protected _compute: ComputeShader | null = null;
    protected _mvData: UniformGPUBuffer | null = null;
    protected readonly _prevViewProj: Matrix4 = new Matrix4().identity();
    protected readonly _currViewProj: Matrix4 = new Matrix4().identity();
    protected readonly _scratch: Matrix4 = new Matrix4().identity();
    /** Detects pool-driven texture identity swaps (resize, re-alias)
     *  so we know when to invalidate the cached compute shader. */
    protected readonly _watcher: TextureIdentityWatcher = new TextureIdentityWatcher();
    /** Last presentationSize seen by `_ensureCompute`; mismatch triggers
     *  a workgroup count refresh (the texture is also refreshed via
     *  the watcher, but workgroup math depends on logical size, not
     *  identity). */
    protected _lastWorkerW: number = 0;
    protected _lastWorkerH: number = 0;
    protected _objectMotion: boolean = false;
    protected _velocityPassState: RendererPassState | null = null;
    protected _velocityDepth: RenderTexture | null = null;

    public setup(b: RenderGraphBuilder): void {
        this._ctx = b.context3D;
        // Declare a screen-sized rgba16float storage texture. rgba16float
        // (not rg16float) because the latter is not in WebGPU's default
        // storage-texture format set — would require an extension on
        // some adapters. The two extra channels waste bandwidth but
        // keep the pass portable.
        //
        // usage:'auto' lets the analyzer union STORAGE_BINDING (from
        // our own b.write hint below) with TEXTURE_BINDING (from any
        // downstream pass that does b.read(handle, 'sample') — TAA
        // for example, once it migrates). Default COPY_SRC/COPY_DST
        // bits are also added by the analyzer for dev-time debug
        // copies.
        this._objectMotion = !!b.view.engine3D.setting.render.objectMotionVectors;
        this._mvHandle = b.declareTexture(MOTION_VECTOR, {
            format: GPUTextureFormat.rgba16float,
            width: 'screen',
            height: 'screen',
            label: MOTION_VECTOR,
            // Object velocities are rasterised on top of the compute fill,
            // and MotionBlurPost keeps a bind group on the texture: give it
            // every usage up front and pin its identity.
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
            aliasable: false,
            publishToLegacyMap: true,
        });
        b.write(this._mvHandle, 'storage');
        b.write(this._mvHandle, 'attachment');
        // The compute reads this frame's G-buffer depth: run after ColorPass.
        b.read(COLOR_BUFFER);
    }

    protected _ensureCompute(ctx: RenderGraphPassContext, mv: RenderTexture): void {
        const [w, h] = this._ctx.presentationSize;
        const sizeChanged = w !== this._lastWorkerW || h !== this._lastWorkerH;
        if (this._compute && !sizeChanged) return;
        if (!this._compute) {
            ShaderLib.register('MotionVector_cs', MotionVector_cs);
            this._compute = new ComputeShader(MotionVector_cs);

            // mat4x4<f32> = 16 floats
            this._mvData = new UniformGPUBuffer(16);
            this._compute.setUniformBuffer('mvData', this._mvData);

            const cameraGroup = GlobalBindGroup.getCameraGroup(ctx.view.camera);
            this._compute.setUniformBuffer('globalUniform', cameraGroup.uniformGPUBuffer);

            const rtFrame = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer, this._ctx);
            this._compute.setSamplerTexture('gBufferTexture', rtFrame.getCompressGBufferTexture());
            this._compute.setSamplerTexture('inTex', rtFrame.getColorTexture());
            this._compute.setStorageTexture('outTex', mv);
        } else {
            // Identity-change path: keep the compiled shader, just
            // re-bind to the new storage texture (resize / pool re-alias).
            this._compute.setStorageTexture('outTex', mv);
        }
        this._compute.workerSizeX = Math.ceil(w / 8);
        this._compute.workerSizeY = Math.ceil(h / 8);
        this._compute.workerSizeZ = 1;
        this._lastWorkerW = w;
        this._lastWorkerH = h;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const mv = ctx.getTexture(this._mvHandle);
        // Pool may have handed us a different RenderTexture wrapper
        // (canvas resize → compile re-ran → new bucket entry) or the
        // wrapper's GPUTexture may have been recreated under us. Watch
        // for the identity flip and force re-bind when it happens.
        const dirty = this._watcher.update([{ key: 'mv', tex: mv }]);
        if (dirty) this._compute = null;
        this._ensureCompute(ctx, mv);

        // Capture current viewProj BEFORE updating prev so the first
        // frame uploads the (identity) prev → motion vectors land at 0
        // and there's no first-frame ghosting.
        const camera = ctx.view.camera;
        this._scratch.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);

        // Upload PREV (the prior frame's viewProj).
        this._mvData!.setMatrix('prevViewProj', this._prevViewProj);
        this._mvData!.apply();

        const gpu = this._ctx.gpuContext;
        const command = gpu.beginCommandEncoder();
        gpu.computeCommand(command, [this._compute!]);
        gpu.endCommandEncoder(command);

        if (this._objectMotion) this._drawObjectVelocity(ctx, mv, dirty);

        // Roll: this frame's viewProj becomes next frame's prev.
        this._prevViewProj.copy(this._scratch);
        this._currViewProj.copy(this._scratch);
    }

    /** Rasterise every opaque node's VELOCITY sub-pass into `mv` (load) with its own depth. */
    protected _drawObjectVelocity(ctx: RenderGraphPassContext, mv: RenderTexture, rebuild: boolean): void {
        const view = ctx.view;
        const camera = view.camera;
        const [w, h] = this._ctx.presentationSize;
        if (!this._velocityDepth || this._velocityDepth.width !== w || this._velocityDepth.height !== h) {
            this._velocityDepth = RTResourceMap.createRTTexture(this._ctx, '_MotionVectorDepth', w, h, GPUTextureFormat.depth32float, false);
            rebuild = true;
        }
        if (rebuild || !this._velocityPassState) {
            const desc = new RTDescriptor();
            desc.loadOp = 'load';
            const frame = new RTFrame([mv], [desc], this._velocityDepth, undefined, true);
            frame.label = 'ObjectVelocity';
            this._velocityPassState = WebGPUDescriptorCreator.createRendererPassState(this._ctx, frame);
            this._velocityPassState.label = 'ObjectVelocity';
            this._velocityPassState.outColor = 0;
        }
        // Same previous view-projection the compute used, for the vertex path.
        const uniform = VelocityMaterialPass.velocityUniform(this._ctx);
        uniform.setMatrix('prevViewProj', this._prevViewProj);
        uniform.apply();

        const passState = this._velocityPassState;
        passState.camera3D = camera;
        const gpu = this._ctx.gpuContext;
        const saved = gpu.lastRenderPassState;
        const command = gpu.beginCommandEncoder();
        const encoder = gpu.beginRenderPass(command, passState);
        gpu.bindCamera(encoder, camera);
        preInitPassPipelines(view, PassType.VELOCITY, passState);
        const nodes = this.collectLayered(view).opaque;
        for (const node of nodes) {
            if (!node.enable || !node.transform.enable || node.isDestroyed) continue;
            if (!node.preInit(PassType.VELOCITY)) node.nodeUpdate(view, PassType.VELOCITY, passState, null);
            node.renderPass2(view, PassType.VELOCITY, passState, null, encoder);
        }
        gpu.endPass(encoder);
        gpu.endCommandEncoder(command);
        gpu.lastRenderPassState = saved;
    }
}

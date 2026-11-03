import { MotionBlur_cs } from '../../../assets/shader/compute/MotionBlur_cs';
import { View3D } from '../../../core/View3D';
import { Matrix4 } from '../../../math/Matrix4';
import { Vector4 } from '../../../math/Vector4';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { MotionBlurUtil } from '../../../util/MotionBlurUtil';
import { Time } from '../../../util/Time';
import { GlobalBindGroup } from '../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { UniformGPUBuffer } from '../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { WebGPUDescriptorCreator } from '../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RTFrame } from '../frame/RTFrame';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { PostBase } from './PostBase';

/**
 * Camera motion blur. Each pixel is averaged along the screen-space path it
 * travelled since the previous frame (reconstructed from depth and the
 * previous view-projection), so panning, orbiting and dollying the camera
 * streak the image the way a real shutter does.
 *
 * Limitation: only camera motion is blurred — objects that move on their own
 * stay sharp, because the G-buffer carries no per-object velocity.
 *
 * ```ts
 * const post = scene.addComponent(PostProcessingComponent);
 * const blur = post.addPost(MotionBlurPost);
 * blur.intensity = 0.5;      // 180° shutter
 * ```
 * @group Post Effects
 */
export class MotionBlurPost extends PostBase {
    /** @internal */
    public outTexture: VirtualTexture;
    private _compute: ComputeShader;
    private _data: UniformGPUBuffer;
    private _rtFrame: RTFrame;
    private _prevViewProj: Matrix4 = new Matrix4().identity();
    private _currViewProj: Matrix4 = new Matrix4().identity();
    private _hasPrev: boolean = false;
    private _params: Vector4 = new Vector4();

    /** @internal */
    public onAttach(view: View3D) {
        this.setting.render.postProcessing.motionBlur.enable = true;
        this._hasPrev = false;
    }

    /** @internal */
    public onDetach(view: View3D) {
        this.setting.render.postProcessing.motionBlur.enable = false;
    }

    private get _s() {
        return this.setting.render.postProcessing.motionBlur;
    }

    /** Shutter scale, 0 = off, 0.5 = 180° shutter, 1 = full frame. */
    public get intensity(): number { return this._s.intensity; }
    public set intensity(v: number) { this._s.intensity = Math.max(0, v); }

    /** Samples along the blur vector (2…32). */
    public get samples(): number { return this._s.samples; }
    public set samples(v: number) { this._s.samples = Math.min(Math.max(Math.round(v), 2), 32); }

    /** Maximum blur length in pixels. */
    public get maxBlurPixels(): number { return this._s.maxBlurPixels; }
    public set maxBlurPixels(v: number) { this._s.maxBlurPixels = Math.max(0, v); }

    /** Keep the blur length independent of the frame rate. */
    public get frameRateIndependent(): boolean { return this._s.frameRateIndependent; }
    public set frameRateIndependent(v: boolean) { this._s.frameRateIndependent = v; }

    /**
     * Forget the previous camera pose, so the next frame is not blurred.
     * Call after a camera cut / teleport.
     */
    public resetHistory(): void {
        this._hasPrev = false;
    }

    /** The view-projection used as "previous" on the last rendered frame. */
    public get prevViewProj(): Matrix4 { return this._prevViewProj; }
    /** The view-projection of the last rendered frame. */
    public get currViewProj(): Matrix4 { return this._currViewProj; }

    private _create(view: View3D) {
        const ctx = this._boundCtx!;
        const [w, h] = ctx.presentationSize;
        this.outTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING, 1, 0, 1, ctx);
        this.outTexture.name = 'motionBlurTex';
        const desc = new RTDescriptor();
        desc.loadOp = 'load';
        this._rtFrame = new RTFrame([this.outTexture], [desc]);

        this._compute = new ComputeShader(MotionBlur_cs);
        // mat4 (16 floats) + vec4 (4 floats)
        this._data = new UniformGPUBuffer(16 + 4);
        this._compute.setUniformBuffer('motionBlurData', this._data);
        this._compute.setUniformBuffer('globalUniform', GlobalBindGroup.getCameraGroup(view.camera).uniformGPUBuffer);
        const gbuffer = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer, ctx);
        this._compute.setSamplerTexture('gBufferTexture', gbuffer.getCompressGBufferTexture());
        this._compute.setSamplerTexture('inTex', this.getLastRenderTexture());
        this._compute.setStorageTexture('outTex', this.outTexture);

        this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(ctx, this._rtFrame, null);
        this.rendererPassState.label = 'MotionBlur';
        this._updateWorkerSize();
    }

    private _updateWorkerSize() {
        this._compute.workerSizeX = Math.ceil(this.outTexture.width / 8);
        this._compute.workerSizeY = Math.ceil(this.outTexture.height / 8);
        this._compute.workerSizeZ = 1;
    }

    /** @internal */
    public render(view: View3D, command: GPUCommandEncoder) {
        if (!this._compute) this._create(view);
        this.bindUpstream(this._compute, 'inTex');

        const camera = view.camera;
        this._currViewProj.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);
        // First frame (or after resetHistory): previous == current → zero velocity.
        if (!this._hasPrev) {
            this._prevViewProj.copy(this._currViewProj);
            this._hasPrev = true;
        }

        const s = this._s;
        const scale = MotionBlurUtil.shutterScale(s.intensity, Time.delta, s.frameRateIndependent);
        this._params.set(scale, s.samples, s.maxBlurPixels, 0);
        this._data.setMatrix('prevViewProj', this._prevViewProj);
        this._data.setVector4('params', this._params);
        this._data.apply();

        this._boundCtx!.gpuContext.computeCommand(command, [this._compute]);
        this._boundCtx!.gpuContext.lastRenderPassState = this.rendererPassState;

        this._prevViewProj.copy(this._currViewProj);
    }

    public onResize() {
        if (!this.outTexture) return;
        const [w, h] = this._boundCtx!.presentationSize;
        this.outTexture.resize(w, h);
        this._updateWorkerSize();
        this._hasPrev = false;
    }
}

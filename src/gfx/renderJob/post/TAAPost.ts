import { VirtualTexture } from '../../../textures/VirtualTexture';
import { GlobalBindGroup } from '../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { StorageGPUBuffer } from '../../graphics/webGpu/core/buffer/StorageGPUBuffer';
import { UniformGPUBuffer } from '../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { WebGPUDescriptorCreator } from '../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { GPUContext } from '../GPUContext';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { PostBase } from './PostBase';
import { Engine3D } from '../../../Engine3D';
import { Matrix4 } from '../../../math/Matrix4';
import { clamp } from '../../../math/MathUtil';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { RTFrame } from '../frame/RTFrame';
import { GBufferFrame } from '../frame/GBufferFrame';
import { View3D } from '../../../core/View3D';
import { TAA_cs } from '../../../assets/shader/compute/TAA_cs';
import { TAACopyTex_cs } from '../../../assets/shader/compute/TAACopyTex_cs';
import { TAASharpTex_cs } from '../../../assets/shader/compute/TAASharpTex_cs';

/**
 * Temporal AA
 * ```
 *       //setting
 *       let cfg = {@link Engine3D.setting.render.postProcessing.taa};
 *         let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        
 *       
 *       Engine3D.startRender(renderJob);
 *```
 * @group Post Effects
 */
export class TAAPost extends PostBase {
    /**
     * @internal
     */
    taaTexture: VirtualTexture;
    outTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    taaCompute: ComputeShader;
    copyTexCompute: ComputeShader;
    sharpCompute: ComputeShader;
    /**
     * @internal
     */
    taaSetting: StorageGPUBuffer;

    /**
     * @internal
     */
    preColorBuffer: StorageGPUBuffer;
    preColorTex: VirtualTexture;

    /**
     * @internal
     */
    preProjMatrix: Matrix4;
    preViewMatrix: Matrix4;
    rtFrame: RTFrame;

    constructor() {
        super();
    }
    /**
     * @internal
     */
    onAttach(view: View3D) {
        Engine3D.setting.render.postProcessing.taa.enable = true;
        view.camera.enableJitterProjection(true);

        this.createGUI();
    }
    /**
     * @internal
     */
    onDetach(view: View3D) {
        Engine3D.setting.render.postProcessing.taa.enable = false;
        view.camera.enableJitterProjection(false);
    }

    public get jitterSeedCount() {
        let setting = Engine3D.setting.render.postProcessing.taa;
        return setting.jitterSeedCount;
    }

    public set jitterSeedCount(value: number) {
        value = clamp(value, 2, 8);
        value = Math.round(value);
        let setting = Engine3D.setting.render.postProcessing.taa;
        setting.jitterSeedCount = value;
    }

    public get blendFactor() {
        let setting = Engine3D.setting.render.postProcessing.taa;
        return setting.blendFactor;
    }

    public set blendFactor(value: number) {
        value = clamp(value, 0, 1);
        let setting = Engine3D.setting.render.postProcessing.taa;
        setting.blendFactor = value;
    }

    public get sharpFactor() {
        let setting = Engine3D.setting.render.postProcessing.taa;
        return setting.sharpFactor;
    }

    public set sharpFactor(value: number) {
        value = clamp(value, 0.1, 0.9);
        let setting = Engine3D.setting.render.postProcessing.taa;
        setting.sharpFactor = value;
    }

    public get sharpPreBlurFactor() {
        let setting = Engine3D.setting.render.postProcessing.taa;
        return setting.sharpPreBlurFactor;
    }

    public set sharpPreBlurFactor(value: number) {
        value = clamp(value, 0.1, 0.9);
        let setting = Engine3D.setting.render.postProcessing.taa;
        setting.sharpPreBlurFactor = value;
    }

    public get temporalJitterScale() {
        let setting = Engine3D.setting.render.postProcessing.taa;
        return setting.temporalJitterScale;
    }

    public set temporalJitterScale(value: number) {
        value = clamp(value, 0, 1);
        let setting = Engine3D.setting.render.postProcessing.taa;
        setting.temporalJitterScale = value;
    }

    private createGUI() {
    }

    private createCompute(view: View3D) {
        let computeShader = new ComputeShader(TAA_cs);
        let cfg = Engine3D.setting.render.postProcessing.taa;

        let taaSetting: UniformGPUBuffer = new UniformGPUBuffer(16 * 2 + 4 * 3); //matrix + 3 * vector4

        let standUniform = GlobalBindGroup.getCameraGroup(view.camera);
        computeShader.setUniformBuffer('standUniform', standUniform.uniformGPUBuffer);
        computeShader.setUniformBuffer('taaData', taaSetting);
        computeShader.setStorageBuffer(`preColorBuffer`, this.preColorBuffer);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        computeShader.setSamplerTexture(`preColorTex`, this.preColorTex);
        computeShader.setSamplerTexture(`posTex`, rtFrame.getPositionMap());
        this.autoSetColorTexture('inTex', computeShader);
        computeShader.setStorageTexture(`outTex`, this.taaTexture);

        computeShader.workerSizeX = Math.ceil(this.taaTexture.width / 8);
        computeShader.workerSizeY = Math.ceil(this.taaTexture.height / 8);
        computeShader.workerSizeZ = 1;

        this.taaCompute = computeShader;
        this.taaSetting = taaSetting;

        //copy
        this.copyTexCompute = new ComputeShader(TAACopyTex_cs);
        this.copyTexCompute.setStorageBuffer(`preColor`, this.preColorBuffer);
        this.copyTexCompute.setStorageTexture(`preColorTex`, this.preColorTex);
        this.copyTexCompute.workerSizeX = Math.ceil(this.taaTexture.width / 8);
        this.copyTexCompute.workerSizeY = Math.ceil(this.taaTexture.height / 8);
        this.copyTexCompute.workerSizeZ = 1;

        //sharp
        this.sharpCompute = new ComputeShader(TAASharpTex_cs);
        this.sharpCompute.setUniformBuffer('taaData', taaSetting);
        this.sharpCompute.setSamplerTexture(`inTex`, this.taaTexture);
        this.sharpCompute.setStorageTexture(`outTex`, this.outTexture);
        this.sharpCompute.workerSizeX = Math.ceil(this.outTexture.width / 8);
        this.sharpCompute.workerSizeY = Math.ceil(this.outTexture.height / 8);
        this.sharpCompute.workerSizeZ = 1;
    }

    private createResource() {
        this.preProjMatrix = new Matrix4().identity();
        this.preViewMatrix = new Matrix4().identity();

        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];

        this.preColorBuffer = new StorageGPUBuffer(w * h * 4, GPUBufferUsage.COPY_SRC);

        this.preColorTex = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.preColorTex.name = 'taaTex';
        let preColorDec = new RTDescriptor();
        preColorDec.clearValue = [0, 0, 0, 1];
        preColorDec.loadOp = `clear`;

        this.taaTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.taaTexture.name = 'taaTex';
        let taaDec = new RTDescriptor();
        taaDec.clearValue = [0, 0, 0, 1];
        taaDec.loadOp = `clear`;

        this.outTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.outTexture.name = 'sharpTaaTex';
        let outDec = new RTDescriptor();
        outDec.clearValue = [0, 0, 0, 1];
        outDec.loadOp = `clear`;

        this.rtFrame = new RTFrame([
            this.preColorTex,
            this.taaTexture,
            this.outTexture
        ], [
            preColorDec,
            taaDec,
            outDec
        ]);
    }
    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.taaCompute) {
            this.createResource();
            this.createCompute(view);
            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
        }

        let cfg = Engine3D.setting.render.postProcessing.taa;
        this.taaSetting.setMatrix('preProjMatrix', this.preProjMatrix);
        this.taaSetting.setMatrix('preViewMatrix', this.preViewMatrix);
        this.taaSetting.setFloat('jitterFrameIndex', view.camera.jitterFrameIndex);
        this.taaSetting.setFloat('blendFactor', cfg.blendFactor);
        this.taaSetting.setFloat('sharpFactor', cfg.sharpFactor);
        this.taaSetting.setFloat('sharpPreBlurFactor', cfg.sharpPreBlurFactor);
        this.taaSetting.setFloat('jitterX', view.camera.jitterX);
        this.taaSetting.setFloat('jitterY', view.camera.jitterY);
        this.taaSetting.apply();

        GPUContext.computeCommand(command, [this.copyTexCompute, this.taaCompute, this.sharpCompute]);

        GPUContext.lastRenderPassState = this.rendererPassState;

        this.preProjMatrix.copyFrom(view.camera.projectionMatrix);
        this.preViewMatrix.copyFrom(view.camera.viewMatrix);

        // view.camera.getViewMatrix(this.preViewMatrix);
    }
}

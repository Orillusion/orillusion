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
import { Time } from '../../../util/Time';
import { clamp } from '../../../math/MathUtil';
import { View3D } from '../../../core/View3D';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RTFrame } from '../frame/RTFrame';
import { GTAO_cs } from '../../../assets/shader/compute/GTAO_cs';
import { CResizeEvent } from '../../../event/CResizeEvent';
import { TextureScaleCompute } from '../../generate/convert/TextureScaleCompute';
import { RenderTexture } from '../../../textures/RenderTexture';
import { SSGI2_cs } from '../../../assets/shader/compute/SSGI2_cs';
import { Denoising_cs } from '../../../assets/shader/compute/utils/Denoising_cs';
import { Combine_cs, Vector3, mergeFunctions } from '../../..';

/**
 * Ground base Ambient Occlusion
 * Let the intersection of the object and the object imitate the effect of the light being cross-occluded
 * ```
 * gtao setting
 * let cfg = {@link Engine3D.setting.render.postProcessing.gtao};
 *```
 * @group Post Effects
 */
export class SSGIPost extends PostBase {
    /**
     * @internal
     */
    outTexture: VirtualTexture;
    newTexture: VirtualTexture;
    oldTexture: VirtualTexture;
    combineTexture: VirtualTexture;

    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    ssgiCompute: ComputeShader;
    delayCompute: ComputeShader;
    combineCompute: ComputeShader;

    rtFrame: RTFrame;
    textureScaleSmallCompute: TextureScaleCompute;
    textureScaleBigCompute: TextureScaleCompute;
    view: View3D;
    colorTexture: RenderTexture;
    posTexture: RenderTexture;
    normalTexture: RenderTexture;
    gBufferTexture: RenderTexture;
    lastPosTexture: RenderTexture;
    public downSampleCofe: number = 1.0;
    // public downSampleCofe: number = 0.5;
    debugChanal: string = "0";

    public updateBuffer: StorageGPUBuffer;
    constructor() {
        super();

        this.updateBuffer = new StorageGPUBuffer(8 * 4);
        this.updateBuffer.setFloat("frameCount", 10);
        this.updateBuffer.setFloat("indirectIns", 1.5);
        this.updateBuffer.setFloat("delay", 0.02);
        this.updateBuffer.setFloat("colorIns", 1.0);
        this.updateBuffer.setFloat("d1", 0.03);
        this.updateBuffer.apply();
    }

    /**
     * @internal
     */
    onAttach(view: View3D,) {
        this.view = view;
        // Engine3D.setting.render.useCompressGBuffer = true;


        view.camera.transform.onPositionChange = view.camera.transform.onPositionChange ?
            mergeFunctions(view.camera.transform.onPositionChange, (a, b) => this.onCameraChange(a, b)) : (a, b) => this.onCameraChange(a, b);
    }

    onCameraChange(oldPos: Vector3, newPos: Vector3) {
        console.log("a",);
        let p = Vector3.distance(oldPos, newPos);
        p = Math.min(0.45, p) + 0.01;
        this.updateBuffer.setFloat("delay", p);
    }
    /**
     * @internal
     */Render
    onDetach(view: View3D,) {
        // Engine3D.setting.render.useCompressGBuffer = false;
    }

    set ins(v: number) {
        this.updateBuffer.setFloat("indirectIns", v);
        this.updateBuffer.apply();
    }

    get ins(): number {
        return this.updateBuffer.getFloat("indirectIns");
    }

    set delay(v: number) {
        this.updateBuffer.setFloat("delay", v);
        this.updateBuffer.apply();
    }

    get delay(): number {
        return this.updateBuffer.getFloat("delay");
    }


    set colorIns(v: number) {
        this.updateBuffer.setFloat("colorIns", v);
        this.updateBuffer.apply();
    }

    get colorIns(): number {
        return this.updateBuffer.getFloat("colorIns");
    }

    set frameCount(v: number) {
        this.updateBuffer.setFloat("frameCount", v);
        this.updateBuffer.apply();
    }

    get frameCount(): number {
        return this.updateBuffer.getFloat("frameCount");
    }

    set d1(v: number) {
        this.updateBuffer.setFloat("d1", v);
        this.updateBuffer.apply();
    }

    get d1(): number {
        return this.updateBuffer.getFloat("d1");
    }


    private createResource() {
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        this.gBufferTexture = rtFrame.getCompressGBufferTexture();

        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];

        this.lastPosTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.lastPosTexture.name = 'lastPosTexture';

        this.outTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.outTexture.name = 'outTexture';

        let inW = Math.floor(w * this.downSampleCofe);
        let inH = Math.floor(h * this.downSampleCofe);

        this.newTexture = new VirtualTexture(inW, inH, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.newTexture.name = 'newTexture';

        this.oldTexture = new VirtualTexture(inW, inH, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.oldTexture.name = 'oldTexture';

        this.combineTexture = new VirtualTexture(inW, inH, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.combineTexture.name = 'combineTexture';

        let ssgiDec = new RTDescriptor();
        // gtaoDec.clearValue = [1, 1, 1, 1];
        ssgiDec.loadOp = `load`;
        this.rtFrame = new RTFrame([
            this.outTexture
        ], [
            ssgiDec
        ]);
    }


    private createCompute() {
        this.ssgiCompute = new ComputeShader(SSGI2_cs);
        this.delayCompute = new ComputeShader(Denoising_cs);
        this.combineCompute = new ComputeShader(Combine_cs);

        let globalUniform = GlobalBindGroup.getCameraGroup(this.view.camera);
        {
            this.ssgiCompute.setSamplerTexture(`gBufferTexture`, this.gBufferTexture);
            this.ssgiCompute.setSamplerTexture(`combineTexture`, this.combineTexture);
            this.ssgiCompute.setSamplerTexture(`oldTexture`, this.oldTexture);
            this.ssgiCompute.setStorageTexture(`newTexture`, this.newTexture);
            this.ssgiCompute.setUniformBuffer('globalUniform', globalUniform.uniformGPUBuffer);
            this.ssgiCompute.setStorageBuffer('updateBuffer', this.updateBuffer);
            this.autoSetColorTexture('inTex', this.ssgiCompute);
        }

        {
            this.delayCompute.setSamplerTexture(`newTexture`, this.newTexture);
            this.delayCompute.setSamplerTexture(`oldTexture`, this.oldTexture);
            this.delayCompute.setStorageTexture(`combineTexture`, this.combineTexture);
            this.delayCompute.setStorageBuffer('updateBuffer', this.updateBuffer);
        }

        {
            this.combineCompute.setSamplerTexture(`inputBTexture`, this.combineTexture);
            this.combineCompute.setSamplerTexture(`gBufferTexture`, this.gBufferTexture);
            this.combineCompute.setUniformBuffer('globalUniform', globalUniform.uniformGPUBuffer);
            this.combineCompute.setStorageTexture(`outTexture`, this.outTexture);
            this.combineCompute.setStorageBuffer(`updateBuffer`, this.updateBuffer);
        }

        {
            this.textureScaleBigCompute = new TextureScaleCompute();
            this.textureScaleBigCompute.setInputes(
                null,
                // this.colorTexture,
                [this.combineTexture],
                [this.outTexture]);
        }

    }

    public render(view: View3D, command: GPUCommandEncoder): void {

    }

    private frame: number = 0;

    public compute(view: View3D): void {
        if (!this.ssgiCompute) {
            this.createResource();
            this.createCompute();
            this.onResize();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "SSGI";
        }

        this.frameCount = this.frame;
        this.frame++;

        let command = GPUContext.beginCommandEncoder();
        // GPUContext.copyTexture(command, this.albedoTexture, this.outTexture);
        switch (parseInt(this.debugChanal)) {
            case 0:
                // GPUContext.copyTexture(command, this.oldTexture, this.combineTexture);
                GPUContext.copyTexture(command, this.combineTexture, this.oldTexture);
                // GPUContext.computeCommand(command, [this.ssgiCompute, this.delayCompute, this.textureScaleBigCompute.computeShader]);
                GPUContext.computeCommand(command, [this.ssgiCompute, this.delayCompute, this.combineCompute]);
                // GPUContext.copyTexture(command, this.posTexture, this.lastPosTexture);
                break;
            case 1:
                GPUContext.copyTexture(command, this.posTexture, this.lastPosTexture);
                GPUContext.copyTexture(command, this.lastPosTexture, this.outTexture);
                break;
            case 2:
                GPUContext.copyTexture(command, this.normalTexture, this.outTexture);
                break;
            case 3:
                GPUContext.copyTexture(command, this.posTexture, this.outTexture);
                break;
            case 4:
                GPUContext.copyTexture(command, this.colorTexture, this.outTexture);
                break;
            case 5:
                GPUContext.copyTexture(command, this.gBufferTexture, this.outTexture);
                break;
            default:
                break;
        }

        GPUContext.lastRenderPassState = this.rendererPassState;

        this.updateBuffer.setFloat("delay", 0.01);
    }

    public onResize() {
        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];
        this.outTexture.resize(w, h);

        this.ssgiCompute.workerSizeX = Math.ceil(this.newTexture.width / 16);
        this.ssgiCompute.workerSizeY = Math.ceil(this.newTexture.height / 16);
        this.ssgiCompute.workerSizeZ = 1;

        this.delayCompute.workerSizeX = Math.ceil(this.combineTexture.width / 16);
        this.delayCompute.workerSizeY = Math.ceil(this.combineTexture.height / 16);
        this.delayCompute.workerSizeZ = 1;

        this.combineCompute.workerSizeX = Math.ceil(this.outTexture.width / 16);
        this.combineCompute.workerSizeY = Math.ceil(this.outTexture.height / 16);
        this.combineCompute.workerSizeZ = 1;
    }
}
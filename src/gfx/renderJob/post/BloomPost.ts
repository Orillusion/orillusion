import { VirtualTexture } from '../../../textures/VirtualTexture';
import { UniformGPUBuffer } from '../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { WebGPUDescriptorCreator } from '../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { GPUContext } from '../GPUContext';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { PostBase } from './PostBase';
import { Engine3D } from '../../../Engine3D';
import { View3D } from '../../../core/View3D';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { RTFrame } from '../frame/RTFrame';
import { downSample, post, threshold, upSample } from '../../../assets/shader/compute/BloomEffect_cs';

/**
 * Bloom Effects
 * ```
 * bloom setting
 * let cfg = {@link Engine3D.setting.render.postProcessing.bloomCfg};
 *```
 * @group Post Effects
 */
export class BloomPost extends PostBase {
    /**
     * @internal
     */
    RT_BloomUp: VirtualTexture[];
    RT_BloomDown: VirtualTexture[];
    RT_threshold: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    thresholdCompute: ComputeShader;
    downSampleComputes: ComputeShader[];
    upSampleComputes: ComputeShader[];
    postCompute: ComputeShader;
    /**
     * @internal
     */
    bloomSetting: UniformGPUBuffer;
    /**
     * @internal
     */
    rtFrame: RTFrame;

    constructor() {
        super();
    }

    /**
     * @internal
     */
    onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.bloomPost.enable = true;
        this.createGUI();
    }
    /**
     * @internal
     */Render
    onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.bloomPost.enable = false;
        this.removeGUI();
    }

    private createGUI() {
    }

    private removeGUI() {
    }

    public get downSampleBlurSize(): number {
        return Engine3D.setting.render.postProcessing.bloomPost.downSampleBlurSize;
    }
    public set downSampleBlurSize(value: number) {
        Engine3D.setting.render.postProcessing.bloomPost.downSampleBlurSize = value;
    }


    public get downSampleBlurSigma(): number {
        return Engine3D.setting.render.postProcessing.bloomPost.downSampleBlurSigma;
    }
    public set downSampleBlurSigma(value: number) {
        Engine3D.setting.render.postProcessing.bloomPost.downSampleBlurSigma = value;
    }

    public get upSampleBlurSize(): number {
        return Engine3D.setting.render.postProcessing.bloomPost.upSampleBlurSize;
    }
    public set upSampleBlurSize(value: number) {
        Engine3D.setting.render.postProcessing.bloomPost.upSampleBlurSize = value;
    }

    public get upSampleBlurSigma(): number {
        return Engine3D.setting.render.postProcessing.bloomPost.upSampleBlurSigma;
    }
    public set upSampleBlurSigma(value: number) {
        Engine3D.setting.render.postProcessing.bloomPost.upSampleBlurSigma = value;
    }

    public get luminanceThreshole(): number {
        return Engine3D.setting.render.postProcessing.bloomPost.luminanceThreshole;
    }
    public set luminanceThreshole(value: number) {
        Engine3D.setting.render.postProcessing.bloomPost.luminanceThreshole = value;
    }

    public get bloomIntensity(): number {
        return Engine3D.setting.render.postProcessing.bloomPost.bloomIntensity;
    }
    public set bloomIntensity(value: number) {
        Engine3D.setting.render.postProcessing.bloomPost.bloomIntensity = value;
    }

    private createThreshouldCompute() {
        this.thresholdCompute = new ComputeShader(threshold);

        this.autoSetColorTexture('inTex', this.thresholdCompute);
        this.thresholdCompute.setStorageTexture(`outTex`, this.RT_threshold);
        this.thresholdCompute.setUniformBuffer('bloomCfg', this.bloomSetting);
        this.thresholdCompute.workerSizeX = Math.ceil(this.RT_threshold.width / 8);
        this.thresholdCompute.workerSizeY = Math.ceil(this.RT_threshold.height / 8);
        this.thresholdCompute.workerSizeZ = 1;
    }

    private createDownSampleComputes() {
        let setting = Engine3D.setting.render.postProcessing.bloomPost;
        const N = setting.downSampleStep;  // 下采样次数
        this.downSampleComputes = [];

        for (let i = 0; i < N; i++) {
            let compute = new ComputeShader(downSample);
            let dstTexture = this.RT_BloomDown[i];
            let srcTexture = i == 0 ? this.RT_threshold : this.RT_BloomDown[i - 1];
            compute.setSamplerTexture(`inTex`, srcTexture);
            compute.setStorageTexture(`outTex`, dstTexture);
            compute.setUniformBuffer('bloomCfg', this.bloomSetting);
            compute.workerSizeX = Math.ceil(dstTexture.width / 8);
            compute.workerSizeY = Math.ceil(dstTexture.height / 8);
            compute.workerSizeZ = 1;

            this.downSampleComputes.push(compute);

            // Graphics.Blit(RT_BloomDown[i - 1], RT_BloomDown[i], new Material(Shader.Find("Shaders/downSample")));
        }
    }

    private createUpSampleComputes() {
        let setting = Engine3D.setting.render.postProcessing.bloomPost;
        const N = setting.downSampleStep;  // 下采样次数
        this.upSampleComputes = [];
        {
            let compute = new ComputeShader(upSample);
            let dstTexture = this.RT_BloomUp[0];
            let srcTexture = this.RT_BloomDown[N - 2];
            compute.setSamplerTexture(`_MainTex`, srcTexture);
            compute.setSamplerTexture(`_PrevMip`, this.RT_BloomDown[N - 1]);
            compute.setStorageTexture(`outTex`, dstTexture);
            compute.setUniformBuffer('bloomCfg', this.bloomSetting);
            compute.workerSizeX = Math.ceil(dstTexture.width / 8);
            compute.workerSizeY = Math.ceil(dstTexture.height / 8);
            compute.workerSizeZ = 1;

            this.upSampleComputes.push(compute);
        }
        for (let i = 1; i < N - 1; i++) {
            let compute = new ComputeShader(upSample);
            let dstTexture = this.RT_BloomUp[i];
            let srcTexture = this.RT_BloomDown[N - 2 - i];
            compute.setSamplerTexture(`_MainTex`, srcTexture);
            compute.setSamplerTexture(`_PrevMip`, this.RT_BloomUp[i - 1]);
            compute.setStorageTexture(`outTex`, dstTexture);
            compute.setUniformBuffer('bloomCfg', this.bloomSetting);
            compute.workerSizeX = Math.ceil(dstTexture.width / 8);
            compute.workerSizeY = Math.ceil(dstTexture.height / 8);
            compute.workerSizeZ = 1;

            this.upSampleComputes.push(compute);

            // Graphics.Blit(RT_BloomDown[i - 1], RT_BloomDown[i], new Material(Shader.Find("Shaders/downSample")));
        }
    }

    private createPostCompute() {
        let setting = Engine3D.setting.render.postProcessing.bloomPost;
        const N = setting.downSampleStep;  // 融合结果

        this.postCompute = new ComputeShader(post);

        this.autoSetColorTexture('_MainTex', this.postCompute);
        this.postCompute.setSamplerTexture(`_BloomTex`, this.RT_BloomUp[N - 2]);
        this.postCompute.setStorageTexture(`outTex`, this.RT_threshold);
        this.postCompute.setUniformBuffer('bloomCfg', this.bloomSetting);

        this.postCompute.workerSizeX = Math.ceil(this.RT_threshold.width / 8);
        this.postCompute.workerSizeY = Math.ceil(this.RT_threshold.height / 8);
        this.postCompute.workerSizeZ = 1;
    }


    private createResource() {
        let setting = Engine3D.setting.render.postProcessing.bloomPost;

        this.bloomSetting = new UniformGPUBuffer(4 * 2); //vector4 * 2

        let presentationSize = webGPUContext.presentationSize;
        let screenWidth = presentationSize[0];
        let screenHeight = presentationSize[1];

        this.RT_threshold = new VirtualTexture(screenWidth, screenHeight, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);

        const N = setting.downSampleStep;  // 下采样次数
        {
            let downSize = 2;
            this.RT_BloomDown = [];

            // 创建下纹理
            for (let i = 0; i < N; i++) {
                let w = Math.ceil(screenWidth / downSize);
                let h = Math.ceil(screenHeight / downSize);
                this.RT_BloomDown[i] = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
                downSize *= 2;
            }
        }

        {
            // 创建上采样纹理
            this.RT_BloomUp = [];
            for (let i = 0; i < N - 1; i++) {
                let w = this.RT_BloomDown[N - 2 - i].width;
                let h = this.RT_BloomDown[N - 2 - i].height;
                this.RT_BloomUp[i] = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
            }
        }

        let bloomDesc = new RTDescriptor();
        bloomDesc.loadOp = `load`;

        // this.rtFrame = new RTFrame([this.RT_threshold], [bloomDesc]);
        // this.rtFrame = new RTFrame([this.RT_BloomDown[4]], [bloomDesc]);
        // this.rtFrame = new RTFrame([this.RT_BloomUp[5]], [bloomDesc]);
        this.rtFrame = new RTFrame([this.RT_threshold], [bloomDesc]);
    }

    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.thresholdCompute) {
            this.createResource();
            this.createThreshouldCompute();

            this.createDownSampleComputes();
            this.createUpSampleComputes();
            this.createPostCompute();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "Bloom";
        }
        let cfg = Engine3D.setting.render.postProcessing.bloomPost;

        this.bloomSetting.setFloat('downSampleStep', cfg.downSampleStep);
        this.bloomSetting.setFloat('downSampleBlurSize', cfg.downSampleBlurSize);
        this.bloomSetting.setFloat('downSampleBlurSigma', cfg.downSampleBlurSigma);
        this.bloomSetting.setFloat('upSampleBlurSize', cfg.upSampleBlurSize);
        this.bloomSetting.setFloat('upSampleBlurSigma', cfg.upSampleBlurSigma);
        this.bloomSetting.setFloat('luminanceThreshole', cfg.luminanceThreshole);
        this.bloomSetting.setFloat('bloomIntensity', cfg.bloomIntensity);

        this.bloomSetting.apply();

        GPUContext.computeCommand(command, [this.thresholdCompute, ...this.downSampleComputes, ...this.upSampleComputes, this.postCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

}

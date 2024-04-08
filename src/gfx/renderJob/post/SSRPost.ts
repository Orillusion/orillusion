import { Engine3D } from '../../../Engine3D';
import { Vector3 } from '../../../math/Vector3';
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
import { clamp } from '../../../math/MathUtil';
import { EntityCollect } from '../collect/EntityCollect';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { RTFrame } from '../frame/RTFrame';
import { GBufferFrame } from '../frame/GBufferFrame';
import { SSRSetting } from '../../../setting/post/SSRSetting';
import { View3D } from '../../../core/View3D';
import { SkyRenderer } from '../../../components/renderer/SkyRenderer';
import { SSR_RayTrace_cs } from '../../../assets/shader/compute/SSR_RayTrace_cs';
import { SSR_IS_cs } from '../../../assets/shader/compute/SSR_IS_cs';
import { SSR_BlendColor_cs } from '../../../assets/shader/compute/SSR_BlendColor_cs';
/**
 * Screen space reflection
 * ```
 *       //setting
 *       let cfg = {@link Engine3D.setting.render.postProcessing.ssr};
 *         let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        
 *       
 *       Engine3D.startRender(renderJob);
 *```
 * @group Post Effects
 */
export class SSRPost extends PostBase {
    private SSR_RayTraceCompute: ComputeShader;
    private SSR_IS_Compute: ComputeShader;
    private SSR_Blend_Compute: ComputeShader;
    /**
     * @internal
     */
    isRetTexture: VirtualTexture;
    /**
     * @internal
     */
    finalTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    ssrUniformBuffer: UniformGPUBuffer;
    /**
     * @internal
     */
    rayTraceData: StorageGPUBuffer;
    /**
     * @internal
     */
    ssrColorData: StorageGPUBuffer;
    /**
     * @internal
     */
    rtFrame: RTFrame;
    historyPosition: StorageGPUBuffer;
    view: View3D;

    /**
     * @internal
     */
    public onAttach(view: View3D,) {
        this.view = view;
        Engine3D.setting.render.postProcessing.ssr.enable = true;
    }
    /**
     * @internal
     */
    public onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.ssr.enable = false;
    }

    private reflectionRatio: number = 0.5;//sqrt

    public get fadeEdgeRatio() {
        let setting = Engine3D.setting.render.postProcessing.ssr;
        return setting.fadeEdgeRatio;
    }

    public set fadeEdgeRatio(value: number) {
        value = clamp(value, 0, 1);
        let setting = Engine3D.setting.render.postProcessing.ssr;
        setting.fadeEdgeRatio = value;
    }

    public get rayMarchRatio() {
        let setting = Engine3D.setting.render.postProcessing.ssr;
        return setting.rayMarchRatio;
    }

    public set rayMarchRatio(value: number) {
        value = clamp(value, 0, 1);
        let setting = Engine3D.setting.render.postProcessing.ssr;
        setting.rayMarchRatio = value;
    }

    public get roughnessThreshold() {
        let setting = Engine3D.setting.render.postProcessing.ssr;
        return setting.roughnessThreshold;
    }

    public set roughnessThreshold(value: number) {
        value = clamp(value, 0, 1);
        let setting = Engine3D.setting.render.postProcessing.ssr;
        setting.roughnessThreshold = value;
    }

    public get fadeDistanceMin() {
        let setting = Engine3D.setting.render.postProcessing.ssr;
        return setting.fadeDistanceMin;
    }

    public set fadeDistanceMin(value: number) {
        value = clamp(value, 0, 10000);
        let setting = Engine3D.setting.render.postProcessing.ssr;
        setting.fadeDistanceMin = value;
    }

    public get fadeDistanceMax() {
        let setting = Engine3D.setting.render.postProcessing.ssr;
        return setting.fadeDistanceMax;
    }

    public set fadeDistanceMax(value: number) {
        value = clamp(value, 0, 10000);
        let setting = Engine3D.setting.render.postProcessing.ssr;
        setting.fadeDistanceMax = value;
    }

    public get powDotRN() {
        let setting = Engine3D.setting.render.postProcessing.ssr;
        return setting.powDotRN;
    }

    public set powDotRN(value: number) {
        value = clamp(value, 0, 1);
        let setting = Engine3D.setting.render.postProcessing.ssr;
        setting.powDotRN = value;
    }

    private createRayTraceShader() {
        let globalUniform = GlobalBindGroup.getCameraGroup(this.view.camera);

        this.SSR_RayTraceCompute = new ComputeShader(SSR_RayTrace_cs);
        this.SSR_RayTraceCompute.setUniformBuffer('globalUniform', globalUniform.uniformGPUBuffer);
        this.SSR_RayTraceCompute.setUniformBuffer('ssrUniform', this.ssrUniformBuffer);
        this.SSR_RayTraceCompute.setStorageBuffer(`rayTraceBuffer`, this.rayTraceData);
        this.SSR_RayTraceCompute.setStorageBuffer(`historyPosition`, this.historyPosition);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        let gBufferTexture = rtFrame.getCompressGBufferTexture();

        this.SSR_RayTraceCompute.setSamplerTexture("gBufferTexture", gBufferTexture);

        if (EntityCollect.instance.sky instanceof SkyRenderer)
            this.SSR_RayTraceCompute.setSamplerTexture(`prefilterMap`, EntityCollect.instance.sky.map);

        this.SSR_RayTraceCompute.workerSizeX = Math.ceil(this.isRetTexture.width / 8);
        this.SSR_RayTraceCompute.workerSizeY = Math.ceil(this.isRetTexture.height / 8);
        this.SSR_RayTraceCompute.workerSizeZ = 1;
    }

    private createISShader() {
        this.SSR_IS_Compute = new ComputeShader(SSR_IS_cs);

        this.SSR_IS_Compute.setStorageBuffer('ssrUniform', this.ssrUniformBuffer);
        this.SSR_IS_Compute.setStorageBuffer(`rayTraceBuffer`, this.rayTraceData);
        this.SSR_IS_Compute.setStorageBuffer(`ssrColorData`, this.ssrColorData);
        this.SSR_IS_Compute.setStorageBuffer(`historyPosition`, this.historyPosition);
        this.SSR_IS_Compute.setSamplerTexture(`colorMap`, this.getOutTexture());

        this.SSR_IS_Compute.setStorageTexture(`outTex`, this.isRetTexture);

        this.SSR_IS_Compute.workerSizeX = Math.ceil(this.isRetTexture.width / 8);
        this.SSR_IS_Compute.workerSizeY = Math.ceil(this.isRetTexture.height / 8);
        this.SSR_IS_Compute.workerSizeZ = 1;
    }

    private createBlendShader(input: VirtualTexture): void {
        let globalUniform = GlobalBindGroup.getCameraGroup(this.view.camera);
        this.SSR_Blend_Compute = new ComputeShader(SSR_BlendColor_cs);

        this.SSR_Blend_Compute.setStorageBuffer(`rayTraceBuffer`, this.rayTraceData);
        this.SSR_Blend_Compute.setUniformBuffer('globalUniform', globalUniform.uniformGPUBuffer);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        let gBufferTexture = rtFrame.getCompressGBufferTexture();

        this.SSR_Blend_Compute.setSamplerTexture("gBufferTexture", gBufferTexture);
        this.SSR_Blend_Compute.setSamplerTexture("colorMap", this.getOutTexture());
        this.SSR_Blend_Compute.setSamplerTexture(`ssrMap`, input);
        this.SSR_Blend_Compute.setStorageTexture(`outTex`, this.finalTexture);

        this.SSR_Blend_Compute.workerSizeX = Math.ceil(this.finalTexture.width / 8);
        this.SSR_Blend_Compute.workerSizeY = Math.ceil(this.finalTexture.height / 8);
        this.SSR_Blend_Compute.workerSizeZ = 1;
    }

    private createResource() {
        let [w, h] = webGPUContext.presentationSize;

        this.finalTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);
        this.finalTexture.name = 'ssrOutTex';
        let rtDec = new RTDescriptor();
        rtDec.clearValue = [0, 0, 0, 0];
        rtDec.loadOp = `clear`;

        let ssrWidth = Math.ceil(w * Engine3D.setting.render.postProcessing.ssr.pixelRatio);
        let ssrHeight = Math.ceil(h * Engine3D.setting.render.postProcessing.ssr.pixelRatio);

        this.isRetTexture = new VirtualTexture(ssrWidth, ssrHeight, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);
        this.isRetTexture.name = 'ssrTextureIn';
        let isRetDec = new RTDescriptor();
        isRetDec.clearValue = [0, 0, 0, 0];
        isRetDec.loadOp = `clear`;

        this.rtFrame = new RTFrame([
            this.finalTexture,
            this.isRetTexture
        ], [
            rtDec,
            isRetDec
        ]);

        this.rayTraceData = new StorageGPUBuffer(ssrWidth * ssrHeight * 8, GPUBufferUsage.COPY_SRC);
        this.ssrColorData = new StorageGPUBuffer(ssrWidth * ssrHeight * 4, GPUBufferUsage.COPY_SRC);
        this.historyPosition = new StorageGPUBuffer(ssrWidth * ssrHeight * 4, GPUBufferUsage.COPY_SRC);

        //ssr uniform
        this.ssrUniformBuffer = new UniformGPUBuffer(4 * 8);
        this.ssrUniformBuffer.setFloat('ssrBufferSizeX', this.isRetTexture.width);
        this.ssrUniformBuffer.setFloat('ssrBufferSizeY', this.isRetTexture.height);
        this.ssrUniformBuffer.setFloat('colorMapSizeX', this.finalTexture.width);
        this.ssrUniformBuffer.setFloat('colorMapSizeY', this.finalTexture.height);

        this.ssrUniformBuffer.apply();
    }
    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.SSR_RayTraceCompute) {
            this.createResource();
            this.createISShader();
            this.createRayTraceShader();
            this.createBlendShader(this.isRetTexture);
            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);

            let standUniform = GlobalBindGroup.getCameraGroup(view.camera);
            this.SSR_RayTraceCompute.setUniformBuffer('standUniform', standUniform.uniformGPUBuffer);
        }

        let setting: SSRSetting = Engine3D.setting.render.postProcessing.ssr;
        this.ssrUniformBuffer.setFloat('fadeEdgeRatio', setting.fadeEdgeRatio);
        this.ssrUniformBuffer.setFloat('rayMarchRatio', setting.rayMarchRatio);
        this.ssrUniformBuffer.setFloat('fadeDistanceMin', setting.fadeDistanceMin);
        this.ssrUniformBuffer.setFloat('fadeDistanceMax', setting.fadeDistanceMax);

        this.ssrUniformBuffer.setFloat('mixThreshold', setting.mixThreshold);
        this.ssrUniformBuffer.setFloat('roughnessThreshold', setting.roughnessThreshold);
        this.ssrUniformBuffer.setFloat('reflectionRatio', this.reflectionRatio);
        this.ssrUniformBuffer.setFloat('powDotRN', setting.powDotRN);

        this.ssrUniformBuffer.setFloat('randomSeedX', Math.random());
        this.ssrUniformBuffer.setFloat('randomSeedY', Math.random());

        this.ssrUniformBuffer.apply();

        let computes = [this.SSR_RayTraceCompute, this.SSR_IS_Compute, this.SSR_Blend_Compute];
        GPUContext.computeCommand(command, computes);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

    public onResize(): void {
        let [w, h] = webGPUContext.presentationSize;

        let ssrWidth = Math.ceil(w * Engine3D.setting.render.postProcessing.ssr.pixelRatio);
        let ssrHeight = Math.ceil(h * Engine3D.setting.render.postProcessing.ssr.pixelRatio);

        this.finalTexture.resize(w, h);
        this.isRetTexture.resize(ssrWidth, ssrHeight);

        this.rayTraceData.resizeBuffer(ssrWidth * ssrHeight * 8);
        this.ssrColorData.resizeBuffer(ssrWidth * ssrHeight * 4);
        this.historyPosition.resizeBuffer(ssrWidth * ssrHeight * 4);

        this.ssrUniformBuffer.setFloat('ssrBufferSizeX', this.isRetTexture.width);
        this.ssrUniformBuffer.setFloat('ssrBufferSizeY', this.isRetTexture.height);
        this.ssrUniformBuffer.setFloat('colorMapSizeX', this.finalTexture.width);
        this.ssrUniformBuffer.setFloat('colorMapSizeY', this.finalTexture.height);

        this.SSR_RayTraceCompute.workerSizeX = Math.ceil(this.isRetTexture.width / 8);
        this.SSR_RayTraceCompute.workerSizeY = Math.ceil(this.isRetTexture.height / 8);
        this.SSR_RayTraceCompute.workerSizeZ = 1;

        this.SSR_IS_Compute.workerSizeX = Math.ceil(this.isRetTexture.width / 8);
        this.SSR_IS_Compute.workerSizeY = Math.ceil(this.isRetTexture.height / 8);
        this.SSR_IS_Compute.workerSizeZ = 1;

        this.SSR_Blend_Compute.workerSizeX = Math.ceil(this.finalTexture.width / 8);
        this.SSR_Blend_Compute.workerSizeY = Math.ceil(this.finalTexture.height / 8);
        this.SSR_Blend_Compute.workerSizeZ = 1;
    }
}

/**
 * @internal
 * @group Post Effects
 */
export class SSR_IS_Kernel {
    public static createSeeds(): Vector3[] {
        let scaler = 20;
        let count = 32;
        let list = [new Vector3(0, 0, scaler)];
        let angle = 0;
        let radius = 0.02;
        for (let i = 1; i < count; i++) {
            let pt = new Vector3();
            list.push(pt);
            angle += 1 - ((1 - 0.618) * i) / count;
            radius += i * 0.01;
            pt.x = Math.sin(angle) * radius;
            pt.y = Math.cos(angle) * radius;
            pt.z = 1 - i / count;
            pt.multiplyScalar(scaler);
        }
        return list;
    }
}

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
import { View3D } from '../../../core/View3D';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RTFrame } from '../frame/RTFrame';
import { GodRay_cs } from '../../../assets/shader/compute/GodRay_cs';
import { clamp } from '../../../math/MathUtil';


export class GodRayPost extends PostBase {
    /**
     * @internal
     */
    godRayTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    godRayCompute: ComputeShader;
    /**
     * @internal
     */
    historyGodRayData: StorageGPUBuffer;
    /**
     * @internal
     */
    godRaySetting: StorageGPUBuffer;

    rtFrame: RTFrame;

    constructor() {
        super();
    }

    /**
     * @internal
     */
    onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.godRay.enable = true;
        this.createGUI();
    }
    /**
     * @internal
     */Render
    onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.godRay.enable = false;
        this.removeGUI();
    }

    public get blendColor(): boolean {
        return Engine3D.setting.render.postProcessing.godRay.blendColor;
    }
    public set blendColor(value: boolean) {
        Engine3D.setting.render.postProcessing.godRay.blendColor = value;
    }
    public get rayMarchCount(): number {
        return Engine3D.setting.render.postProcessing.godRay.rayMarchCount;
    }
    public set rayMarchCount(value: number) {
        value = clamp(value, 8, 20);
        Engine3D.setting.render.postProcessing.godRay.rayMarchCount = value;
    }
    public get scatteringExponent(): number {
        return Engine3D.setting.render.postProcessing.godRay.scatteringExponent;
    }
    public set scatteringExponent(value: number) {
        value = clamp(value, 1, 40);
        Engine3D.setting.render.postProcessing.godRay.scatteringExponent = value;
    }
    public get intensity(): number {
        return Engine3D.setting.render.postProcessing.godRay.intensity;
    }
    public set intensity(value: number) {
        value = clamp(value, 0.01, 5);
        Engine3D.setting.render.postProcessing.godRay.intensity = value;
    }

    private createGUI() {

    }

    private removeGUI() {
    }


    private createCompute(view: View3D) {
        let setting = Engine3D.setting.render.postProcessing.godRay;

        this.godRayCompute = new ComputeShader(GodRay_cs);

        let godRaySetting: UniformGPUBuffer = new UniformGPUBuffer(4 * 3); //vector4 * 2
        this.godRayCompute.setUniformBuffer('godRayUniform', godRaySetting);

        this.historyGodRayData = new StorageGPUBuffer(4 * this.godRayTexture.width * this.godRayTexture.height);
        this.godRayCompute.setStorageBuffer('historyGodRayData', this.historyGodRayData);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");

        this.godRayCompute.setSamplerTexture(`posTex`, rtFrame.renderTargets[1]);
        this.godRayCompute.setSamplerTexture(`normalTex`, rtFrame.renderTargets[2]);
        this.autoSetColorTexture('inTex', this.godRayCompute);
        this.godRayCompute.setStorageTexture(`outTex`, this.godRayTexture);

        let shadowRenderer = Engine3D.getRenderJob(view).shadowMapPassRenderer;
        this.godRayCompute.setSamplerTexture(`shadowMap`, shadowRenderer.depth2DArrayTexture);

        this.godRaySetting = godRaySetting;

        this.onResize();
    }

    private createResource() {
        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];

        this.godRayTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.godRayTexture.name = 'godRayTexture';
        let gtaoDec = new RTDescriptor();
        gtaoDec.loadOp = `load`;
        this.rtFrame = new RTFrame([this.godRayTexture], [gtaoDec]);
    }

    public onResize() {
        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];

        this.godRayTexture.resize(w, h);
        this.historyGodRayData.resizeBuffer(4 * this.godRayTexture.width * this.godRayTexture.height);
        this.godRayCompute.setStorageBuffer('historyGodRayData', this.historyGodRayData);

        this.godRayCompute.workerSizeX = Math.ceil(this.godRayTexture.width / 8);
        this.godRayCompute.workerSizeY = Math.ceil(this.godRayTexture.height / 8);
        this.godRayCompute.workerSizeZ = 1;
    }

    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.godRayCompute) {
            this.createResource();
            this.createCompute(view);

            let lightUniformEntries = GlobalBindGroup.getLightEntries(view.scene);
            this.godRayCompute.setStorageBuffer("lightBuffer", lightUniformEntries.storageGPUBuffer);
            this.godRayCompute.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "GodRay";

            let globalUniform = GlobalBindGroup.getCameraGroup(view.camera);
            this.godRayCompute.setUniformBuffer('globalUniform', globalUniform.uniformGPUBuffer);
        }

        let setting = Engine3D.setting.render.postProcessing.godRay;

        this.godRaySetting.setFloat('intensity', setting.intensity);
        this.godRaySetting.setFloat('rayMarchCount', setting.rayMarchCount);

        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];
        this.godRaySetting.setFloat('viewPortWidth', w);
        this.godRaySetting.setFloat('viewPortHeight', h);
        this.godRaySetting.setFloat('blendColor', setting.blendColor ? 1 : 0);
        this.godRaySetting.setFloat('scatteringExponent', setting.scatteringExponent);
        this.godRaySetting.apply();
        GPUContext.computeCommand(command, [this.godRayCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }
}

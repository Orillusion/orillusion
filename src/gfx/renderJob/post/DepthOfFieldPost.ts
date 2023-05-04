import { VirtualTexture } from '../../../textures/VirtualTexture';
import { GlobalBindGroup } from '../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { StorageGPUBuffer } from '../../graphics/webGpu/core/buffer/StorageGPUBuffer';
import { UniformGPUBuffer } from '../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { WebGPUDescriptorCreator } from '../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { GPUContext } from '../GPUContext';
import { RTResourceMap } from '../frame/RTResourceMap';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { PostBase } from './PostBase';
import { Engine3D } from '../../../Engine3D';
import { View3D } from '../../../core/View3D';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { RTResourceConfig } from '../config/RTResourceConfig';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RTFrame } from '../frame/RTFrame';
import { DepthOfView_cs } from '../../../assets/shader/compute/DepthOfView_cs';
/**
 * depth of field effect.
 * A common post-processing effect that simulates the focusing characteristics of a camera lens.
 * ```
 *       //Configure parameters related to depth of field
 *       let cfg = {@link Engine3D.setting.render.postProcessing.depthOfView};
 *       cfg.near = 150;
 *       cfg.far = 300;
 *       cfg.pixelOffset = 1.0;
 *         let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        
 *       
 *       Engine3D.startRender(renderJob);
 *```
 * @group Post Effects
 */
export class DepthOfFieldPost extends PostBase {
    /**
     * @internal
     */
    blurTexture1: VirtualTexture;
    /**
     * @internal
     */
    blurTexture2: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    blurComputes: ComputeShader[];
    /**
     * @internal
     */
    blurSettings: StorageGPUBuffer[];
    /**
     * @internal
     */
    outTexture: VirtualTexture;
    rtFrame: RTFrame;

    constructor() {
        super();
    }
    /**
     * @internal
     */
    onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.depthOfView.enable = true;
    }
    /**
     * @internal
     */
    onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.depthOfView.enable = false;
    }

    private createGUI() {

    }

    public get pixelOffset() {
        let setting = Engine3D.setting.render.postProcessing.depthOfView;
        return setting.pixelOffset;
    }

    public set pixelOffset(value: number) {
        value = Math.max(0, value);
        let setting = Engine3D.setting.render.postProcessing.depthOfView;
        setting.pixelOffset = value;
    }

    public get near() {
        let setting = Engine3D.setting.render.postProcessing.depthOfView;
        return setting.near;
    }

    public set near(value: number) {
        value = Math.max(0, value);
        let setting = Engine3D.setting.render.postProcessing.depthOfView;
        setting.near = value;
    }

    public get far() {
        let setting = Engine3D.setting.render.postProcessing.depthOfView;
        return setting.far;
    }

    public set far(value: number) {
        value = Math.max(0, value);
        let setting = Engine3D.setting.render.postProcessing.depthOfView;
        setting.far = value;
    }

    private createBlurCompute() {
        this.blurSettings = [];
        this.blurComputes = [];
        let cfg = Engine3D.setting.render.postProcessing.depthOfView;

        for (let i = 0; i < cfg.iterationCount; i++) {
            let blurSetting: UniformGPUBuffer = new UniformGPUBuffer(4);
            let blurCompute = new ComputeShader(DepthOfView_cs);
            this.blurComputes.push(blurCompute);
            this.blurSettings.push(blurSetting);

            blurCompute.setUniformBuffer('blurSetting', blurSetting);
            let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");

            blurCompute.setSamplerTexture(RTResourceConfig.positionBufferTex_NAME, rtFrame.attachments[1]);
            blurCompute.setSamplerTexture(RTResourceConfig.normalBufferTex_NAME, rtFrame.attachments[2]);

            let input = i % 2 == 0 ? this.blurTexture1 : this.blurTexture2;
            let output = i % 2 == 1 ? this.blurTexture1 : this.blurTexture2;
            blurCompute.setSamplerTexture('inTex', input);
            blurCompute.setStorageTexture(`outTex`, output);

            blurCompute.workerSizeX = Math.ceil(this.blurTexture1.width / 8);
            blurCompute.workerSizeY = Math.ceil(this.blurTexture1.height / 8);
            blurCompute.workerSizeZ = 1;

            this.outTexture = output;
        }
    }

    private createResource() {
        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];

        this.blurTexture1 = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.blurTexture1.name = 'dof1';
        let blur1Dec = new RTDescriptor();
        blur1Dec.clearValue = [0, 0, 0, 1];
        blur1Dec.loadOp = `clear`;

        this.blurTexture2 = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.blurTexture2.name = 'dof2';
        let blur2Dec = new RTDescriptor();
        blur2Dec.clearValue = [0, 0, 0, 1];
        blur2Dec.loadOp = `clear`;

        this.rtFrame = new RTFrame([
            this.blurTexture1,
            this.blurTexture2
        ], [
            blur1Dec,
            blur2Dec
        ]);
    }
    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.blurComputes) {
            this.createResource();
            this.createBlurCompute();
            this.createGUI();

            let standUniform = GlobalBindGroup.getCameraGroup(view.camera);
            for (let i = 0; i < this.blurComputes.length; i++) {
                const blurCompute = this.blurComputes[i];
                blurCompute.setUniformBuffer('standUniform', standUniform.uniformGPUBuffer);
            }
            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
        }

        this.autoSetColorTexture('inTex', this.blurComputes[0]);

        let cfg = Engine3D.setting.render.postProcessing.depthOfView;
        cfg.far = Math.max(cfg.near, cfg.far) + 0.0001;

        for (let i = 0; i < cfg.iterationCount; i++) {
            let blurCompute = this.blurComputes[i];
            let blurSetting = this.blurSettings[i];
            blurSetting.setFloat('near', cfg.near);
            blurSetting.setFloat('far', cfg.far);
            blurSetting.setFloat('pixelOffset', (i + 1) * cfg.pixelOffset);
            blurSetting.apply();
            blurCompute.setStorageBuffer('blurSetting', blurSetting);
        }

        GPUContext.computeCommand(command, this.blurComputes);

        GPUContext.lastRenderPassState = this.rendererPassState;
    }
}

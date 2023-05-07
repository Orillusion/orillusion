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

/**
 * Ground base Ambient Occlusion
 * Let the intersection of the object and the object imitate the effect of the light being cross-occluded
 * ```
 * gtao setting
 * let cfg = {@link Engine3D.setting.render.postProcessing.gtao};
 *```
 * @group Post Effects
 */
export class GTAOPost extends PostBase {
    /**
     * @internal
     */
    gtaoTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    gtaoCompute: ComputeShader;
    /**
     * @internal
     */
    gtaoSetting: StorageGPUBuffer;
    /**
     * @internal
     */
    aoBuffer: StorageGPUBuffer;

    /**
     * @internal
     */
    directionsBuffer: StorageGPUBuffer;
    /**
     * @internal
     */
    directionsArray: Float32Array;
    rtFrame: RTFrame;

    constructor() {
        super();
    }

    /**
     * @internal
     */
    onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.gtao.enable = true;
        this.createGUI();
    }
    /**
     * @internal
     */Render
    onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.gtao.enable = false;
        this.removeGUI();
    }

    public get maxDistance() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.maxDistance;
    }

    public set maxDistance(value: number) {
        value = clamp(value, 0.1, 50);
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.maxDistance = value;
    }

    public get maxPixel() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.maxPixel;
    }

    public set maxPixel(value: number) {
        value = clamp(value, 5, 100);
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.maxPixel = value;
    }

    public get darkFactor() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.darkFactor;
    }

    public set darkFactor(value: number) {
        value = clamp(value, 0.01, 1);
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.darkFactor = value;
    }


    public get rayMarchSegment() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.rayMarchSegment;
    }

    public set rayMarchSegment(value: number) {
        value = clamp(value, 4, 10);
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.rayMarchSegment = value;
    }

    public get multiBounce() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.multiBounce;
    }

    public set multiBounce(value: boolean) {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.multiBounce = value;
    }

    public get blendColor() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.blendColor;
    }

    public set blendColor(value: boolean) {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.blendColor = value;
    }

    public get usePosFloat32() {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        return setting.usePosFloat32;
    }

    public set usePosFloat32(value: boolean) {
        let setting = Engine3D.setting.render.postProcessing.gtao;
        setting.usePosFloat32 = value;
    }

    private createGUI() {

    }

    private removeGUI() {
    }


    private createCompute() {
        let setting = Engine3D.setting.render.postProcessing.gtao;

        this.gtaoCompute = new ComputeShader(GTAO_cs);

        let gtaoSetting: UniformGPUBuffer = new UniformGPUBuffer(4 * 3); //vector4 * 2
        this.gtaoCompute.setUniformBuffer('gtaoData', gtaoSetting);

        this.directionsArray = new Float32Array(8 * 2);
        this.directionsBuffer = new StorageGPUBuffer(8 * 2);

        this.directionsBuffer.setFloat32Array('array', this.randomDirection());
        this.directionsBuffer.apply();
        this.gtaoCompute.setStorageBuffer('directions', this.directionsBuffer);

        this.aoBuffer = new StorageGPUBuffer(this.gtaoTexture.width * this.gtaoTexture.height);
        this.gtaoCompute.setStorageBuffer('aoBuffer', this.aoBuffer);
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        //setting.usePosFloat32 ? RTResourceMap.getTexture(RTResourceConfig.positionBufferTex_NAME): 
        let posTexture = rtFrame.attachments[1];
        this.gtaoCompute.setSamplerTexture(`posTex`, posTexture);
        this.gtaoCompute.setSamplerTexture(`normalTex`, rtFrame.attachments[2]);
        this.autoSetColorTexture('inTex', this.gtaoCompute);
        this.gtaoCompute.setStorageTexture(`outTex`, this.gtaoTexture);

        this.gtaoCompute.workerSizeX = Math.ceil(this.gtaoTexture.width / 8);
        this.gtaoCompute.workerSizeY = Math.ceil(this.gtaoTexture.height / 8);
        this.gtaoCompute.workerSizeZ = 1;

        this.gtaoSetting = gtaoSetting;
    }

    private createResource() {
        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];

        // RTResourceMap.createRTTextures(
        //     [RTResourceConfig.colorBufferTex_NAME, RTResourceConfig.positionBufferTex_NAME, RTResourceConfig.normalBufferTex_NAME, RTResourceConfig.materialBufferTex_NAME],
        //     [GPUTextureFormat.rgba16float, GPUTextureFormat.rgba16float, GPUTextureFormat.rgba8unorm, GPUTextureFormat.rgba8unorm],
        // );

        this.gtaoTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.gtaoTexture.name = 'gtaoTex';
        let gtaoDec = new RTDescriptor();
        // gtaoDec.clearValue = [1, 1, 1, 1];
        gtaoDec.loadOp = `load`;
        this.rtFrame = new RTFrame([
            this.gtaoTexture
        ], [
            gtaoDec
        ]);
    }

    private randomCount: number = 0;
    private randomDirection(): Float32Array {
        this.randomCount++;
        if (this.randomCount > 1) this.randomCount = 0;
        let offsetAngle = (Math.PI * 2 * this.randomCount) / 16;
        let angleSegment = (Math.PI * 2) / 8;
        for (let i = 0; i < 8; i++) {
            let angle = offsetAngle + i * angleSegment;
            this.directionsArray[i * 2] = Math.sin(angle);
            this.directionsArray[i * 2 + 1] = Math.cos(angle);
        }
        return this.directionsArray;
    }
    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.gtaoCompute) {
            this.createResource();
            this.createCompute();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "GTAO";

            let standUniform = GlobalBindGroup.getCameraGroup(view.camera);
            this.gtaoCompute.setUniformBuffer('standUniform', standUniform.uniformGPUBuffer);
        }
        let cfg = Engine3D.setting.render.postProcessing.gtao;

        this.directionsBuffer.setFloat32Array('array', this.randomDirection());
        this.directionsBuffer.apply();
        let scaleFactor = 1 - 0.2 * (Time.frame % 2);
        let maxDistance = cfg.maxDistance * scaleFactor;
        let maxPixel = cfg.maxPixel * scaleFactor;
        this.gtaoSetting.setFloat('maxDistance', maxDistance);
        this.gtaoSetting.setFloat('maxPixel', maxPixel);
        this.gtaoSetting.setFloat('darkFactor', cfg.darkFactor);
        this.gtaoSetting.setFloat('rayMarchSegment', cfg.rayMarchSegment);

        let camera = view.camera;
        this.gtaoSetting.setFloat('cameraNear', camera.near);
        this.gtaoSetting.setFloat('cameraFar', camera.far);
        this.gtaoSetting.setFloat('viewPortWidth', camera.viewPort.width);
        this.gtaoSetting.setFloat('viewPortHeight', camera.viewPort.height);

        this.gtaoSetting.setFloat('multiBounce', cfg.multiBounce ? 1 : 0);
        this.gtaoSetting.setFloat('blendColor', cfg.blendColor ? 1 : 0);

        this.gtaoSetting.apply();

        GPUContext.computeCommand(command, [this.gtaoCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }
}

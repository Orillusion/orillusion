import { VirtualTexture } from '../../../textures/VirtualTexture';
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
import { clamp } from '../../../math/MathUtil';
import { Vector2 } from '../../../math/Vector2';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RTFrame } from '../frame/RTFrame';
import { View3D } from '../../../core/View3D';
import { OutlineCalcOutline_cs } from '../../../assets/shader/compute/OutlineCalcOutline_cs';
import { Outline_cs } from '../../../assets/shader/compute/Outline_cs';
import { OutLineBlendColor_cs } from '../../../assets/shader/compute/OutLineBlendColor_cs';
import { OutlinePostSlot, outlinePostData } from '../../../io/OutlinePostData';


/**
 * post effect out line 
 * OutlinePostManager,
 * ```
 *       //setting
 *       let cfg = {@link Engine3D.setting.render.postProcessing.outline};
 *         let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        
 *       
 *       Engine3D.startRender(renderJob);
 *```
 * @group Post Effects
 */
export class OutlinePost extends PostBase {
    /**
     * @internal
     */
    outlineTex: VirtualTexture;

    lowTex: VirtualTexture;

    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    calcWeightCompute: ComputeShader;
    outlineCompute: ComputeShader;
    blendCompute: ComputeShader;
    /**
     * @internal
     */
    outlineSetting: StorageGPUBuffer;

    /**
     * @internal
     */
    slotsBuffer: StorageGPUBuffer;
    slotsArray: Float32Array;


    entitiesArray: Float32Array;
    entitiesBuffer: StorageGPUBuffer;

    weightBuffer: StorageGPUBuffer;
    lowTexSize: Vector2;

    oldOutlineColor: StorageGPUBuffer;
    rtFrame: RTFrame;

    constructor() {
        super();
    }

    /**
     * @internal
     */
    onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.outline.enable = true;
    }

    /**
     * @internal
     */
    onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.outline.enable = false;
    }

    public set outlinePixel(value: number) {
        value = clamp(value, 0, 8);
        let cfg = Engine3D.setting.render.postProcessing.outline;
        if (cfg.outlinePixel != value) {
            cfg.outlinePixel = value;
        }
    }

    public get outlinePixel() {
        return Engine3D.setting.render.postProcessing.outline.outlinePixel;
    }

    public set fadeOutlinePixel(value: number) {
        let cfg = Engine3D.setting.render.postProcessing.outline;
        value = clamp(value, 0, 8);
        if (cfg.fadeOutlinePixel != value) {
            cfg.fadeOutlinePixel = value;
        }
    }

    public get fadeOutlinePixel() {
        return Engine3D.setting.render.postProcessing.outline.fadeOutlinePixel;
    }

    public set strength(value: number) {
        value = clamp(value, 0, 1);
        let cfg = Engine3D.setting.render.postProcessing.outline;
        if (cfg.strength != value) {
            cfg.strength = value;
        }
    }

    public get strength() {
        return Engine3D.setting.render.postProcessing.outline.strength;
    }

    public set useAddMode(value: boolean) {
        Engine3D.setting.render.postProcessing.outline.useAddMode = value;
    }

    public get useAddMode() {
        return Engine3D.setting.render.postProcessing.outline.useAddMode;
    }

    private createGUI() {
    }

    private createCompute() {
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        let visibleMap = rtFrame.getPositionMap();

        this.calcWeightCompute = new ComputeShader(OutlineCalcOutline_cs);
        this.calcWeightCompute.setStorageBuffer('outlineSetting', this.outlineSetting);
        this.calcWeightCompute.setStorageBuffer('slotsBuffer', this.slotsBuffer);
        this.calcWeightCompute.setStorageBuffer(`weightBuffer`, this.weightBuffer);
        this.calcWeightCompute.setStorageBuffer(`entitiesBuffer`, this.entitiesBuffer);
        this.calcWeightCompute.setSamplerTexture(`indexTexture`, visibleMap);

        this.calcWeightCompute.workerSizeX = Math.ceil(this.lowTex.width / 8);
        this.calcWeightCompute.workerSizeY = Math.ceil(this.lowTex.height / 8);
        this.calcWeightCompute.workerSizeZ = 1;

        //outline
        this.outlineCompute = new ComputeShader(Outline_cs);
        this.outlineCompute.setStorageBuffer('outlineSetting', this.outlineSetting);
        this.outlineCompute.setStorageBuffer('slotsBuffer', this.slotsBuffer);
        this.outlineCompute.setStorageBuffer(`weightBuffer`, this.weightBuffer);
        this.outlineCompute.setStorageBuffer(`oldOutlineColor`, this.oldOutlineColor);
        this.outlineCompute.setStorageTexture(`lowTex`, this.lowTex);

        this.outlineCompute.workerSizeX = Math.ceil(this.lowTex.width / 8);
        this.outlineCompute.workerSizeY = Math.ceil(this.lowTex.height / 8);
        this.outlineCompute.workerSizeZ = 1;

        //blend
        this.blendCompute = new ComputeShader(OutLineBlendColor_cs);
        this.blendCompute.setStorageBuffer('outlineSetting', this.outlineSetting);
        this.autoSetColorTexture('inTex', this.blendCompute);
        this.blendCompute.setSamplerTexture(`lowTex`, this.lowTex);
        this.blendCompute.setStorageTexture(`outlineTex`, this.outlineTex);

        this.blendCompute.workerSizeX = Math.ceil(this.outlineTex.width / 8);
        this.blendCompute.workerSizeY = Math.ceil(this.outlineTex.height / 8);
        this.blendCompute.workerSizeZ = 1;
    }

    private createResource() {
        let presentationSize = webGPUContext.presentationSize;
        let w = presentationSize[0];
        let h = presentationSize[1];
        this.lowTexSize = new Vector2(Math.floor(w * 0.5), Math.floor(h * 0.5));

        this.lowTex = new VirtualTexture(this.lowTexSize.x, this.lowTexSize.y, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.lowTex.name = 'lowTex';
        let lowDec = new RTDescriptor();
        lowDec.clearValue = [0, 0, 0, 1];
        lowDec.loadOp = `clear`;

        this.outlineTex = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.outlineTex.name = 'outlineTex';
        let outDec = new RTDescriptor();
        outDec.clearValue = [0, 0, 0, 1];
        outDec.loadOp = `clear`;

        this.rtFrame = new RTFrame([this.outlineTex], [outDec]);

        this.outlineSetting = new UniformGPUBuffer(8);
        this.weightBuffer = new StorageGPUBuffer(this.lowTexSize.x * this.lowTexSize.y * 4, GPUBufferUsage.COPY_SRC);
        this.oldOutlineColor = new StorageGPUBuffer(this.lowTexSize.x * this.lowTexSize.y * 4, GPUBufferUsage.COPY_SRC);

        this.slotsArray = new Float32Array(outlinePostData.SlotCount * 4);
        this.slotsBuffer = new StorageGPUBuffer(this.slotsArray.length);
        this.slotsBuffer.setFloat32Array('slotsArray', this.slotsArray);
        this.slotsBuffer.apply();

        this.entitiesArray = new Float32Array(outlinePostData.SlotCount * outlinePostData.MaxEntities);
        this.entitiesBuffer = new StorageGPUBuffer(this.entitiesArray.length);
        this.entitiesBuffer.setFloat32Array('entitiesArray', this.entitiesArray);
        this.slotsBuffer.apply();

        this.fetchData ||= {} as any;
    }

    private fetchData: { dirty: boolean; slots: OutlinePostSlot[] };

    private fetchOutlineData(): void {
        outlinePostData.fetchData(this.fetchData);
        if (this.fetchData.dirty) {
            let slotCount = outlinePostData.SlotCount;
            let maxEntities = outlinePostData.MaxEntities;
            for (let i = 0; i < slotCount; i++) {
                let offset = 4 * i;
                let slot = this.fetchData.slots[i];
                this.slotsArray[offset + 0] = slot.color.r;
                this.slotsArray[offset + 1] = slot.color.g;
                this.slotsArray[offset + 2] = slot.color.b;
                this.slotsArray[offset + 3] = slot.count;

                offset = maxEntities * i;
                this.entitiesArray.set(slot.indexList, offset);
            }
            this.slotsBuffer.setFloat32Array('slotsArray', this.slotsArray);
            this.slotsBuffer.apply();
            this.entitiesBuffer.setFloat32Array('entitiesArray', this.entitiesArray);
            this.entitiesBuffer.apply();
        }
    }

    private computeList: ComputeShader[];

    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.calcWeightCompute) {
            this.createResource();
            this.createCompute();
            this.createGUI();
            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
        }
        this.computeList ||= [this.calcWeightCompute, this.outlineCompute, this.blendCompute];
        let cfg = Engine3D.setting.render.postProcessing.outline;
        this.outlineSetting.setFloat('strength', cfg.strength);
        this.outlineSetting.setFloat('useAddMode', cfg.useAddMode ? 1 : 0);
        this.outlineSetting.setFloat('outlinePixel', cfg.outlinePixel);
        this.outlineSetting.setFloat('fadeOutlinePixel', cfg.fadeOutlinePixel);
        this.outlineSetting.setFloat('lowTexWidth', this.lowTexSize.x);
        this.outlineSetting.setFloat('lowTexHeight', this.lowTexSize.y);
        this.outlineSetting.apply();

        this.fetchOutlineData();
        GPUContext.computeCommand(command, this.computeList);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }
}

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
import { GUIHelp } from '@orillusion/debug/GUIHelp';


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
        // Engine3D.setting.render.postProcessing.gtao.enable = true;
        this.createGUI();
    }
    /**
     * @internal
     */Render
    onDetach(view: View3D,) {
        // Engine3D.setting.render.postProcessing.gtao.enable = false;
        this.removeGUI();
    }

    public blendColor: boolean = true;
    public rayMarchCount: number = 16;
    public scatteringExponent: number = 5;
    public intensity: number = 0.5;

    private createGUI() {

    }

    private removeGUI() {
    }


    private createCompute(view: View3D) {
        let setting = Engine3D.setting.render.postProcessing.gtao;

        this.godRayCompute = new ComputeShader(GodRay_cs);

        let godRaySetting: UniformGPUBuffer = new UniformGPUBuffer(4 * 3); //vector4 * 2
        this.godRayCompute.setUniformBuffer('godRayUniform', godRaySetting);

        this.historyGodRayData = new StorageGPUBuffer(4 * this.godRayTexture.width * this.godRayTexture.height);
        this.godRayCompute.setStorageBuffer('historyGodRayData', this.historyGodRayData);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");

        this.godRayCompute.setSamplerTexture(`posTex`, rtFrame.attachments[1]);
        this.godRayCompute.setSamplerTexture(`normalTex`, rtFrame.attachments[2]);
        this.autoSetColorTexture('inTex', this.godRayCompute);
        this.godRayCompute.setStorageTexture(`outTex`, this.godRayTexture);

        let shadowRenderer = Engine3D.getRenderJob(view).shadowMapPassRenderer;
        this.godRayCompute.setSamplerTexture(`shadowMap`, shadowRenderer.depth2DArrayTexture);

        this.godRayCompute.workerSizeX = Math.ceil(this.godRayTexture.width / 8);
        this.godRayCompute.workerSizeY = Math.ceil(this.godRayTexture.height / 8);
        this.godRayCompute.workerSizeZ = 1;

        this.godRaySetting = godRaySetting;
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

            GUIHelp.addFolder("GodRay");
            GUIHelp.add(this, "blendColor", 0.0, 1.0, 0.1);
            GUIHelp.add(this, 'scatteringExponent', 1, 10.0, 0.1);
            GUIHelp.add(this, 'rayMarchCount', 10, 30.0, 1.0);
            GUIHelp.add(this, 'intensity', 0.01, 2.0, 0.01);

            GUIHelp.endFolder();
        }

        this.godRaySetting.setFloat('intensity', this.intensity);
        this.godRaySetting.setFloat('rayMarchCount', this.rayMarchCount);

        let camera = view.camera;
        this.godRaySetting.setFloat('viewPortWidth', camera.viewPort.width);
        this.godRaySetting.setFloat('viewPortHeight', camera.viewPort.height);

        this.godRaySetting.setFloat('blendColor', this.blendColor ? 1 : 0);
        this.godRaySetting.setFloat('scatteringExponent', this.scatteringExponent);

        this.godRaySetting.apply();

        GPUContext.computeCommand(command, [this.godRayCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }
}

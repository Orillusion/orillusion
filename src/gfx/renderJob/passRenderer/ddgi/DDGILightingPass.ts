import { DDGILighting_shader } from '../../../../assets/shader/compute/DDGILighting_CSShader';
import { View3D } from '../../../../core/View3D';
import { Engine3D } from '../../../../Engine3D';
import { VirtualTexture } from '../../../../textures/VirtualTexture';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { Texture } from '../../../graphics/webGpu/core/texture/Texture';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { GPUContext } from '../../GPUContext';
import { RendererPassState } from '../state/RendererPassState';
/**
 * @internal
 * @group Post
 */
export class DDGILightingPass {
    private computeShader: ComputeShader;
    private worldPosMap: Texture;
    private worldNormalMap: Texture;
    private colorMap: Texture;
    private shadowMap: Texture;
    private pointShadowMap: Texture;

    public lightingTexture: VirtualTexture;
    constructor() {
        let giSetting = Engine3D.setting.gi;
        this.lightingTexture = new VirtualTexture(giSetting.probeSourceTextureSize, giSetting.probeSourceTextureSize, GPUTextureFormat.rgba16float, false, GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING);
    }

    private create(view: View3D) {
        let lightUniformEntries = GlobalBindGroup.getLightEntries(view.scene);

        this.computeShader = new ComputeShader(DDGILighting_shader);
        this.computeShader.setStorageTexture("outputBuffer", this.lightingTexture);
        this.computeShader.setStorageBuffer("lightBuffer", lightUniformEntries.storageGPUBuffer);
        this.computeShader.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);

        this.computeShader.setSamplerTexture("positionMap", this.worldPosMap);
        this.computeShader.setSamplerTexture("normalMap", this.worldNormalMap);
        this.computeShader.setSamplerTexture("colorMap", this.colorMap);
        this.computeShader.setSamplerTexture("shadowMap", this.shadowMap);
        this.computeShader.setSamplerTexture("pointShadowMap", this.pointShadowMap);
        this.computeShader.setSamplerTexture("prefilterMap", Engine3D.res.defaultSky);
    }

    public setInputs(inputs: Texture[]) {
        this.worldPosMap = inputs[0];
        this.worldNormalMap = inputs[1];
        this.colorMap = inputs[2];
        this.shadowMap = inputs[3];
        this.pointShadowMap = inputs[4];
    }

    public computer(view: View3D, renderPassState: RendererPassState) {
        if (!this.computeShader) {
            this.create(view);

            let cameraBindGroup = GlobalBindGroup.getCameraGroup(view.camera);
            this.computeShader.setUniformBuffer("globalUniform", cameraBindGroup.uniformGPUBuffer);
        }
        // EntityCollect.instance.sky ? EntityCollect.instance.sky.materials : defaultRes.defaultSky
        let command = GPUContext.beginCommandEncoder();
        let giSetting = Engine3D.setting.gi;

        this.computeShader.workerSizeX = giSetting.probeSourceTextureSize / 8;
        this.computeShader.workerSizeY = giSetting.probeSourceTextureSize / 8;
        this.computeShader.workerSizeZ = 1;
        GPUContext.computeCommand(command, [this.computeShader]);
    }
}

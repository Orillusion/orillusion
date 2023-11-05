import { DDGIIrradiance_shader } from '../../../../assets/shader/compute/DDGIIrradiance_Cs';
import { View3D } from '../../../../core/View3D';
import { Engine3D } from '../../../../Engine3D';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { StorageGPUBuffer } from '../../../graphics/webGpu/core/buffer/StorageGPUBuffer';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { RendererPassState } from '../state/RendererPassState';
import { DDGIIrradianceVolume } from './DDGIIrradianceVolume';

/**
 * @internal
 * @group Post
 */
export class DDGIIrradianceComputePass {
    private irradianceBuffer: StorageGPUBuffer;
    private depthBuffer: StorageGPUBuffer;
    private probeIrradianceMap: RenderTexture;
    private probeDepthMap: RenderTexture;
    private volume: DDGIIrradianceVolume;
    private computeShader: ComputeShader;
    private depthRaysBuffer: StorageGPUBuffer;
    constructor(volume: DDGIIrradianceVolume) {
        this.volume = volume;
        this.initPipeline();
    }

    private initPipeline() {
        this.computeShader = new ComputeShader(DDGIIrradiance_shader);

        let giSetting = Engine3D.setting.gi;
        let pixelCount = giSetting.octRTMaxSize * giSetting.octRTMaxSize;

        this.irradianceBuffer = new StorageGPUBuffer(pixelCount * 4, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
        this.computeShader.setStorageBuffer(`irradianceBuffer`, this.irradianceBuffer);

        this.depthBuffer = new StorageGPUBuffer(pixelCount * 4, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
        this.computeShader.setStorageBuffer(`depthBuffer`, this.depthBuffer);

        this.depthRaysBuffer = new StorageGPUBuffer(4096 * 4 * 2 * 2 * 2, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
        this.computeShader.setStorageBuffer(`depthRaysBuffer`, this.depthRaysBuffer);

        this.computeShader.setStorageBuffer(`probes`, this.volume.probesBuffer);
        this.computeShader.setUniformBuffer(`uniformData`, this.volume.irradianceVolumeBuffer);

        this.computeShader.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
    }

    public setTextures(inputs: RenderTexture[], probeIrradianceMap: RenderTexture, probeDepthMap: RenderTexture) {
        this.probeIrradianceMap = probeIrradianceMap;
        this.probeDepthMap = probeDepthMap;

        let worldPosMap = inputs[0];
        let worldNormalMap = inputs[1];
        let colorMap = inputs[2];

        this.computeShader.setStorageTexture(`probeIrradianceMap`, this.probeIrradianceMap);
        this.computeShader.setStorageTexture(`probeDepthMap`, this.probeDepthMap);
        this.computeShader.setSamplerTexture(`positionMap`, worldPosMap);
        this.computeShader.setSamplerTexture(`normalMap`, worldNormalMap);
        this.computeShader.setSamplerTexture(`colorMap`, colorMap);
    }

    public readBuffer() {
        return this.depthRaysBuffer.readBuffer();
    }

    public compute(view: View3D, renderPassState: RendererPassState) {
        let setting = this.volume.setting;
        let command = GPUContext.beginCommandEncoder();
        let probes = EntityCollect.instance.getProbes(view.scene);

        this.computeShader.workerSizeX = setting.octRTSideSize / 8;
        this.computeShader.workerSizeY = setting.octRTSideSize / 8;
        this.computeShader.workerSizeZ = probes.length;
        GPUContext.computeCommand(command, [this.computeShader]);
    }
}

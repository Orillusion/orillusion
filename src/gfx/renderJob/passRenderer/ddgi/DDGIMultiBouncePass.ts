import { MultiBouncePass_cs } from '../../../../assets/shader/compute/MultiBouncePass_cs';
import { View3D } from '../../../../core/View3D';
import { Engine3D } from '../../../../Engine3D';
import { VirtualTexture } from '../../../../textures/VirtualTexture';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { GPUContext } from '../../GPUContext';
import { RendererPassState } from '../state/RendererPassState';
import { DDGIIrradianceVolume } from './DDGIIrradianceVolume';

/**
 * @internal
 * @group Post
 */
export class DDGIMultiBouncePass {
    public blendTexture: VirtualTexture;
    private volume: DDGIIrradianceVolume;
    private computerShader: ComputeShader;

    constructor(volume: DDGIIrradianceVolume) {
        this.volume = volume;
        this.initPipeline();
    }

    private initPipeline() {
        let giSetting = Engine3D.setting.gi;
        this.blendTexture = new VirtualTexture(giSetting.probeSourceTextureSize, giSetting.probeSourceTextureSize, GPUTextureFormat.rgba16float, false, GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING);

        this.computerShader = new ComputeShader(MultiBouncePass_cs);
        this.computerShader.setStorageTexture("outputBuffer", this.blendTexture);
        this.computerShader.setStorageBuffer("uniformData", this.volume.irradianceVolumeBuffer);
    }

    public setInputs(inputs: VirtualTexture[]) {
        let worldNormalMap = inputs[0];
        let colorMap = inputs[1];
        let lightingMap = inputs[2];
        let irradianceMap = inputs[3];

        this.computerShader.setSamplerTexture("normalMap", worldNormalMap);
        this.computerShader.setSamplerTexture("colorMap", colorMap);
        this.computerShader.setSamplerTexture("litMap", lightingMap);
        this.computerShader.setSamplerTexture("irradianceMap", irradianceMap);
    }

    public computer(view: View3D, renderPassState: RendererPassState) {
        let command = GPUContext.beginCommandEncoder();
        let setting = this.volume.setting;
        let probesCount: number = setting.probeXCount * setting.probeYCount * setting.probeZCount;
        let probeSourceSize: number = setting.probeSize;
        this.computerShader.workerSizeX = (probeSourceSize * 6) / 8;
        this.computerShader.workerSizeY = probeSourceSize / 8;
        this.computerShader.workerSizeZ = probesCount;
        GPUContext.computeCommand(command, [this.computerShader]);
    }
}

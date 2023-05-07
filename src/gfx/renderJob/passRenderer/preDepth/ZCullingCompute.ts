
import { ZPassShader_cs } from '../../../../assets/shader/core/pass/ZPassShader_cs';
import { Scene3D } from '../../../../core/Scene3D';
import { ComputeGPUBuffer } from '../../../graphics/webGpu/core/buffer/ComputeGPUBuffer';
import { Texture } from '../../../graphics/webGpu/core/texture/Texture';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { GPUContext } from '../../GPUContext';
import { RTResourceConfig } from '../../config/RTResourceConfig';
import { RTResourceMap } from '../../frame/RTResourceMap';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';

/**
 * @internal
 * @group Post
 */
export class ZCullingCompute {
    computeShader: ComputeShader;
    visibleBuffer: ComputeGPUBuffer;
    texture: Texture;
    constructor() {
        this.computeShader = new ComputeShader(ZPassShader_cs);

        this.visibleBuffer = new ComputeGPUBuffer(8192 * 2);
        this.computeShader.setStorageBuffer(`visibleBuffer`, this.visibleBuffer);

        this.texture = RTResourceMap.getTexture(RTResourceConfig.zBufferTexture_NAME);
        this.computeShader.setSamplerTexture(`zBufferTexture`, this.texture);
        this.computeShader.workerSizeX = Math.ceil(this.texture.width / 8);
        this.computeShader.workerSizeY = Math.ceil(this.texture.height / 8);
        this.computeShader.workerSizeZ = 1;
    }

    compute(scene: Scene3D, occlusionSystem: OcclusionSystem) {
        this.visibleBuffer.reset(true, 0);
        this.visibleBuffer.apply();

        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [this.computeShader]);
        // GPUContext.submitCommandEncoder(command);
        this.visibleBuffer.readBuffer();
        occlusionSystem.zVisibleList = this.visibleBuffer.outFloat32Array;
    }
}

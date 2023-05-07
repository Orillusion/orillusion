import { MergeRGBA_cs } from '../../../assets/shader/compute/MergeRGBA_cs';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { GPUContext } from '../../renderJob/GPUContext';
/**
 * @internal
 * @group GFX
 */
export class MergeRGBACreator {
    public static merge(textureR: Texture, textureG: Texture, textureB: Texture, textureA: Texture) {
        let w = 0;
        let h = 0;
        w = Math.max(textureR.width, w);
        w = Math.max(textureG.width, w);
        w = Math.max(textureB.width, w);
        w = Math.max(textureA.width, w);

        h = Math.max(textureR.height, h);
        h = Math.max(textureG.height, h);
        h = Math.max(textureB.height, h);
        h = Math.max(textureA.height, h);
        let outTex = new VirtualTexture(w, h, GPUTextureFormat.rgba8unorm);

        let compute = new ComputeShader(MergeRGBA_cs);
        compute.setSamplerTexture('textureR', textureR);
        compute.setSamplerTexture('textureG', textureG);
        compute.setSamplerTexture('textureB', textureB);
        compute.setSamplerTexture('textureA', textureA);
        compute.setStorageTexture('outTex', outTex);

        compute.workerSizeX = Math.ceil(w / 8);
        compute.workerSizeY = Math.ceil(h / 8);

        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [compute]);
        GPUContext.endCommandEncoder(command);
        return outTex;
    }
}

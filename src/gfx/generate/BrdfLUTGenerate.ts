import { BRDFLUT } from '../../assets/shader/utils/BRDFLUT';
import { VirtualTexture } from '../../textures/VirtualTexture';
import { ComputeShader } from '../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../graphics/webGpu/WebGPUConst';
import { GPUContext } from '../renderJob/GPUContext';
/**
 * @internal
 * @group GFX
 */
export class BRDFLUTGenerate {
    compute: ComputeShader;

    constructor() {
        this.compute = new ComputeShader(BRDFLUT);
    }
    public generateBRDFLUTTexture() {
        //create virtual texture
        let texture = new VirtualTexture(256, 256, GPUTextureFormat.rgba8unorm, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);

        //set storageTexture
        this.compute.setStorageTexture('brdflutTexture', texture);

        //set worker size
        this.compute.workerSizeX = 256 / 8;
        this.compute.workerSizeY = 256 / 8;

        //active
        let commandEncoder = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(commandEncoder, [this.compute]);
        GPUContext.endCommandEncoder(commandEncoder);

        return texture;
    }
}

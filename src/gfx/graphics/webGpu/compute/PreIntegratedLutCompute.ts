import { VirtualTexture } from '../../../../textures/VirtualTexture';
import { GPUTextureFormat } from '../WebGPUConst';
import { GPUContext } from '../../../renderJob/GPUContext';
import { RenderShaderCompute } from './RenderShaderCompute';
import { PreIntegratedLut } from '../../../../assets/shader/compute/PreIntegratedLut';
import { MaterialDataUniformGPUBuffer } from '../core/buffer/MaterialDataUniformGPUBuffer';
import { Shader } from '../shader/Shader';
/**
 * @internal
 * @group GFX
 */
export class PreIntegratedLutCompute extends RenderShaderCompute {

    constructor(shader: Shader) {
        super(PreIntegratedLut, shader);
    }

    protected init() {
        //create virtual texture
        let texture = new VirtualTexture(256, 256, GPUTextureFormat.rgba8unorm, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);

        //set storageTexture
        this.compute.setStorageTexture('sssMap', texture);
        this.sourceShader.setTexture("lutMap", texture);

        return texture;
    }

    public onFrame() {

        //set worker size
        this.compute.workerSizeX = 256 / 8;
        this.compute.workerSizeY = 256 / 8;

        //active
        let commandEncoder = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(commandEncoder, [this.compute]);
        GPUContext.endCommandEncoder(commandEncoder);
    }
}

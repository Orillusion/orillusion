import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { ITexture } from '../gfx/graphics/webGpu/core/texture/ITexture';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
/**
 * Depth 2D TextureArray
 * @internal
 * @group Texture
 */
export class Depth2DTextureArray extends Texture implements ITexture {

    /**
     * @constructor
     * @width texture width (pixel)
     * @width texture height (pixel)
     * @width texture format, default value is depth32float
     */
    constructor(width: number, height: number, format: GPUTextureFormat = GPUTextureFormat.depth32float) {
        super(width, height, 4);

        this.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

        // texture_depth_2d_array
        this.format = format;
        this.mipmapCount = 1;

        this.init();
    }

    internalCreateBindingLayoutDesc() {
        this.textureBindingLayout.sampleType = `depth`;
        this.textureBindingLayout.viewDimension = `2d-array`;
        this.samplerBindingLayout.type = `filtering`;
        this.sampler_comparisonBindingLayout.type = `comparison`;
    }

    internalCreateTexture() {
        this.textureDescriptor = {
            format: this.format,
            size: { width: this.width, height: this.height, depthOrArrayLayers: this.numberLayer },
            dimension: '2d',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        }
        this.gpuTexture = webGPUContext.device.createTexture(this.textureDescriptor);
    }

    internalCreateView() {
        this.viewDescriptor = {
            dimension: `2d-array`,
        };
        this.view = this.gpuTexture.createView(this.viewDescriptor);
    }

    internalCreateSampler() {
        this.gpuSampler = webGPUContext.device.createSampler({});
        this.gpuSampler_comparison = webGPUContext.device.createSampler({
            compare: 'less',
            label: "sampler_comparison"
        });
    }

}

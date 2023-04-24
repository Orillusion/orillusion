import { GPUAddressMode } from '../../WebGPUConst';
import { Texture } from './Texture';
/**
 * Texture Cube
 * @internal
 * @group Texture
 */
export class TextureCube extends Texture {
    /**
     * texture width, default value is 4
     */
    public width: number = 4;
    /**
     * texture height, default value is 4
     */
    public height: number = 4;
    /**
     * depth or array layers, default value is 6
     */
    public depthOrArrayLayers: number = 6;

    /**
     * GPUShaderStage
     */
    public visibility: number = GPUShaderStage.FRAGMENT;

    /**
     * GPUTextureBindingLayout
     */
    public textureBindingLayout: GPUTextureBindingLayout = {
        viewDimension: 'cube',
        multisampled: false,
    };

    /**
     * GPUSamplerBindingLayout
     */
    public samplerBindingLayout: GPUSamplerBindingLayout = {
        type: 'filtering',
    };

    /**
     * @constructor
     */
    constructor() {
        super(4, 4);
        this.addressModeU = GPUAddressMode.clamp_to_edge;
        this.addressModeV = GPUAddressMode.clamp_to_edge;
        this.addressModeW = GPUAddressMode.clamp_to_edge;
        this.magFilter = this.minFilter = 'linear';
        this.mipmapFilter = 'linear';
        this.visibility = GPUShaderStage.FRAGMENT;
    }

    /**
     * createTextureDescriptor
     */
    protected createTextureDescriptor(
        width: number,
        height: number,
        mipLevelCount: number,
        format: GPUTextureFormat,
        usage: number = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        sizeCount: number = 1,
    ) {
        this.width = width;
        this.height = height;
        this.format = format;
        this.usage = usage;
        this.textureDescriptor = {
            size: { width: width, height: height, depthOrArrayLayers: 6 },
            mipLevelCount: mipLevelCount,
            format: format,
            usage: usage,
            dimension: '2d',
        };

        if (sizeCount > 1) {
            this.viewDescriptor = {
                dimension: `cube-array`,
            };
        } else {
            this.viewDescriptor = {
                dimension: this.textureBindingLayout.viewDimension,
            };
        }
    }
}

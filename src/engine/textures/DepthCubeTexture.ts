import { webGPUContext } from "../gfx/graphics/webGpu/Context3D";
import { GPUTextureFormat } from "../gfx/graphics/webGpu/WebGPUConst";
import { ITexture } from "../gfx/graphics/webGpu/core/texture/ITexture";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";

/**
 * cube texture witch data if for depth
 * @internal
 * @group Texture
 */
export class DepthCubeTexture extends Texture implements ITexture {

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
    public visibility: number = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

    /**
     * @constructor
     */
    constructor(width: number, height: number) {
        super(width, height, 6);

        // texture_depth_2d_array
        this.format = GPUTextureFormat.depth24plus;
        this.mipmapCount = 1;

        this.init();
    }

    public internalCreateBindingLayoutDesc() {
        this.samplerBindingLayout.type = `non-filtering`;
        this.textureBindingLayout.sampleType = `unfilterable-float`;
        this.textureBindingLayout.viewDimension = 'cube';
    }

    public internalCreateTexture() {
        this.textureDescriptor = {
            format: `depth24plus`,
            size: { width: this.width, height: this.height, depthOrArrayLayers: 6 },
            dimension: '2d',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        }
        this.gpuTexture = webGPUContext.device.createTexture(this.textureDescriptor);
    }

    public internalCreateView() {
        this.viewDescriptor = {
            dimension: `cube`,
        };
        this.view = this.gpuTexture.createView(this.viewDescriptor);
    }

    public internalCreateSampler() {
        this.gpuSampler = webGPUContext.device.createSampler({});
        this.gpuSampler_comparison = webGPUContext.device.createSampler({
            compare: 'less',
            label: "sampler_comparison"
        });
    }

}

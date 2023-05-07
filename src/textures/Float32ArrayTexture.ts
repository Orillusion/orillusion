import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { TextureMipmapGenerator } from '../gfx/graphics/webGpu/core/texture/TextureMipmapGenerator';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { GPUContext } from '../gfx/renderJob/GPUContext';
/**
 * @internal
 * Float32Array texture
 * @group Texture
 */
export class Float32ArrayTexture extends Texture {
    /**
     * fill this texture by array of numbers;the format as [red0, green0, blue0, alpha0, red1, green1, blue1, alpha1...]
     * @param width assign the texture width
     * @param height assign the texture height
     * @param data color of each pixel
     * @param filtering set the sampler type to filtering, else it's non-filtering
     * @returns
     */
    public create(width: number, height: number, data: Float32Array, filtering: boolean = true) {
        let device = webGPUContext.device;
        const bytesPerRow = width * 4 * 4;
        this.format = GPUTextureFormat.rgba32float;

        let mipmapCount = 1;
        this.createTextureDescriptor(width, height, mipmapCount, this.format);

        const textureDataBuffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        device.queue.writeBuffer(textureDataBuffer, 0, data);
        const commandEncoder = GPUContext.beginCommandEncoder();
        commandEncoder.copyBufferToTexture(
            {
                buffer: textureDataBuffer,
                bytesPerRow: bytesPerRow,
            },
            {
                texture: this.getGPUTexture(),
            },
            {
                width: width,
                height: height,
                depthOrArrayLayers: 1,
            },
        );

        GPUContext.endCommandEncoder(commandEncoder);

        // this.sampler.minFilter = `nearest`;
        // this.sampler.magFilter = `nearest`;
        // this.sampler.mipmapFilter = `nearest`;
        // this.sampler.maxAnisotropy = 0.5 ;
        // this.bindingSampler.type = `non-filtering`;
        // this.bindingTexture.sampleType = `unfilterable-float`;
        if (filtering) {
            this.samplerBindingLayout.type = `non-filtering`;
            this.textureBindingLayout.sampleType = `unfilterable-float`;
        }

        this.gpuSampler = device.createSampler({});

        if (mipmapCount > 1) TextureMipmapGenerator.webGPUGenerateMipmap(this);
    }

    /**
     * fill this texture GPUBuffer
     * @param width assign the texture width
     * @param height assign the texture height
     * @param textureDataBuffer GPUBuffer
     * @returns
     */
    public fromBuffer(width: number, height: number, textureDataBuffer: GPUBuffer): this {
        let device = webGPUContext.device;
        const bytesPerRow = width * 4 * 4;
        this.format = GPUTextureFormat.rgba32float;

        this.mipmapCount = 1;
        this.createTextureDescriptor(width, height, this.mipmapCount, this.format);

        const commandEncoder = GPUContext.beginCommandEncoder();
        commandEncoder.copyBufferToTexture(
            {
                buffer: textureDataBuffer,
                bytesPerRow: bytesPerRow,
            },
            {
                texture: this.getGPUTexture(),
            },
            {
                width: width,
                height: height,
                depthOrArrayLayers: 1,
            },
        );

        GPUContext.endCommandEncoder(commandEncoder);

        // this.sampler.minFilter = `nearest`;
        // this.sampler.magFilter = `nearest`;
        // this.sampler.mipmapFilter = `nearest`;
        // this.sampler.maxAnisotropy = 0.5 ;
        // this.bindingSampler.type = `non-filtering`;
        // this.bindingTexture.sampleType = `unfilterable-float`;
        this.samplerBindingLayout.type = `non-filtering`;
        this.textureBindingLayout.sampleType = `unfilterable-float`;
        this.gpuSampler = device.createSampler({});
        return this;
        // if (mipmapCount > 1) textureMipmapGenerator.webGPUGenerateMipmap(this);
    }
}

import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { TextureMipmapGenerator } from '../gfx/graphics/webGpu/core/texture/TextureMipmapGenerator';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { GPUContext } from '../gfx/renderJob/GPUContext';
/**
 * @internal
 * Uint16 texture
 * @group Texture
 */
export class Uint16Texture extends Texture {

    /**
     * create texture by number array, which format is uint8
     * @param width width of texture
     * @param height height of texture
     * @param data uint8 array
     * @param useMipmap whether or not gen mipmap
     * @returns
     */
    public create(width: number, height: number, data: Float32Array, useMiamp: boolean = true) {
        let device = webGPUContext.device;
        const bytesPerRow = width * 4 * 4;
        this.format = GPUTextureFormat.rgba16float;

        this.mipmapCount = Math.floor(useMiamp ? Math.log2(width) : 1);
        this.createTextureDescriptor(width, height, this.mipmapCount, this.format);

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

        this.minFilter = `nearest`;
        this.magFilter = `nearest`;
        this.mipmapFilter = `nearest`;
        this.samplerBindingLayout.type = `non-filtering`;
        this.textureBindingLayout.sampleType = `unfilterable-float`;

        // not suport float this
        this.minFilter = `linear`;
        this.magFilter = `linear`;
        this.mipmapFilter = `nearest`;
        this.samplerBindingLayout.type = `filtering`;
        this.textureBindingLayout.sampleType = `float`;
        this.gpuSampler = device.createSampler(this);

        if (this.mipmapCount > 1) {
            TextureMipmapGenerator.webGPUGenerateMipmap(this);
        }
    }

}

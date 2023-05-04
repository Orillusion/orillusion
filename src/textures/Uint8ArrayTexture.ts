import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { TextureMipmapGenerator } from '../gfx/graphics/webGpu/core/texture/TextureMipmapGenerator';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { GPUContext } from '../gfx/renderJob/GPUContext';

/**
 * create texture by number array, which format is uint8
 * @group Texture
 */
export class Uint8ArrayTexture extends Texture {
    private _dataBuffer: GPUBuffer;

    /**
     * create texture by number array, which format is uint8
     * @param width width of texture
     * @param height height of texture
     * @param data uint8 array
     * @param useMipmap whether or not gen mipmap
     * @returns
     */
    public create(width: number, height: number, data: Uint8Array, useMipmap: boolean = false): this {
        let device = webGPUContext.device;
        const bytesPerRow = Math.ceil((width * 4) / 256) * 256;

        this.format = GPUTextureFormat.rgba8unorm;
        this.mipmapCount = Math.floor(useMipmap ? Math.log2(width) : 1);
        this.createTextureDescriptor(width, height, this.mipmapCount, this.format);

        const textureDataBuffer = (this._dataBuffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        }));

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

        if (useMipmap) {
            TextureMipmapGenerator.webGPUGenerateMipmap(this);
        }
        return this;
    }

    /**
     * validate the change of this texture
     */
    public updateTexture(width: number, height: number, data: Uint8Array) {
        let device = webGPUContext.device;
        const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
        this.mipmapCount = Math.floor(true ? Math.log2(width) : 1);

        this._dataBuffer && this._dataBuffer.destroy();
        this._dataBuffer = null;
        const textureDataBuffer = (this._dataBuffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        }));

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
        this.gpuSampler = device.createSampler(this);

        if (this.mipmapCount > 1) {
            TextureMipmapGenerator.webGPUGenerateMipmap(this);
        }
    }
}

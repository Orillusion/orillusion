import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { GPUContext } from '../gfx/renderJob/GPUContext';
import { FileLoader } from '../loader/FileLoader';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { RGBEParser } from '../loader/parser/RGBEParser';
/**
 * HDR Texture
 * @group Texture
 */
export class HDRTexture extends Texture {

    constructor() {
        super(32, 32, null);
        this.isHDRTexture = true;
    }

    /**
     * fill this texture by array of numbers;the format as [red0, green0, blue0, e0, red1, green1, blue1, e1...]
     * @param width assign the texture width
     * @param height assign the texture height
     * @param data color of each pixel
     * @param useMipmap gen mipmap or not
     * @returns
     */
    public create(width: number = 32, height: number = 32, data: ArrayBuffer = null, useMipmap: boolean = true): this {
        this.width = width;
        this.height = height;
        let device = webGPUContext.device;
        const bit = 2; //half float
        const bytesPerRow = width * 4 * bit;
        let fixedData: ArrayBuffer = data;

        this.format = GPUTextureFormat.rgba16float;
        this.useMipmap = useMipmap;

        this.updateTextureDescription();

        this.updateGPUTexture();

        const textureDataBuffer = device.createBuffer({
            size: fixedData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        device.queue.writeBuffer(textureDataBuffer, 0, fixedData);
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

        if (!this.useMipmap) {
            this.samplerBindingLayout.type = `filtering`;
            this.textureBindingLayout.sampleType = `float`;
        }

        this.gpuSampler = device.createSampler(this);

        // if (this.useMipmap && this.mipmapCount > 1) TextureMipmapGenerator.webGPUGenerateMipmap(this);

        return this;
    }


    /**
     * load one hdr image
     * @param url the url of hdr image
     * @param loaderFunctions callback when load complete
     * @returns
     */
    public async load(url: string, loaderFunctions?: LoaderFunctions): Promise<HDRTexture> {
        let loader = new FileLoader();
        let parser = await loader.load(url, RGBEParser, loaderFunctions);
        return parser.getHDRTexture();
    }
}

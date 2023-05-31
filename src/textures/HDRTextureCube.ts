import { ErpImage2CubeMap } from '../gfx/generate/convert/ErpImage2CubeMap';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { TextureCube } from '../gfx/graphics/webGpu/core/texture/TextureCube';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { VirtualTexture } from './VirtualTexture';
import { FileLoader } from '../loader/FileLoader';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { RGBEParser } from '../loader/parser/RGBEParser';
import { TextureCubeFaceData } from './TextureCubeFaceData';

/**
 * HDR TextureCube
 * @group Texture
 */
export class HDRTextureCube extends TextureCube {

    private _url: string;
    protected _faceData: TextureCubeFaceData;
    /**
     * create a cube texture, it's high dynamic range texture
     */
    constructor() {
        super();
        this.useMipmap = true;
        this.format = GPUTextureFormat.rgba16float;
        this.isHDRTexture = true;
        this._faceData = new TextureCubeFaceData(this);
    }

    /**
     * fill this texture by array of numbers;the format as [red0, green0, blue0, alpha0, red1, green1, blue1, alpha1...]
     * @param size assign the cube texture size
     * @param data raw data of cubeTexture; the format is { width: number; height: number; array: Uint8Array }
     * @returns
     */
    public createFromHDRData(size: number, data: { width: number; height: number; array: Uint8Array }): this {
        let texture = new VirtualTexture(data.width, data.height, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);

        let float32Array: Float32Array = new Float32Array(data.array);
        ErpImage2CubeMap.convertRGBE2RGBA(texture, float32Array);
        this.createFromTexture(size, texture);
        return this;
    }

    /**
     * fill this texture by a texture2D, which is a 360 panorama image
     * @param size assign the cube texture size
     * @param texture the image texture
     * @returns
     */
    public createFromTexture(size: number, texture: Texture): this {
        this.width = this.height = size;
        this.textureBindingLayout.viewDimension = 'cube';
        let mipmapSize = this.width;
        this.mipmapCount = 1;
        while (mipmapSize > 16) {
            mipmapSize /= 2;
            this.mipmapCount++;
        }

        this.createTextureDescriptor(size, size, this.mipmapCount, this.format);

        this.textureDescriptor.size = { width: size, height: size, depthOrArrayLayers: 6 };
        this.textureDescriptor.dimension = '2d';
        this.gpuSampler = webGPUContext.device.createSampler(this);

        this._faceData.uploadErpTexture(texture);
        return this;
    }


    /**
    * load texture data from web url, which is a 360 panorama image
    * @param url web url
    * @param loaderFunctions callback function when load complete
    */
    public async load(url: string, loaderFunctions?: LoaderFunctions): Promise<HDRTextureCube> {
        this._url = url;
        let loader = new FileLoader();
        let parser = await loader.load(url, RGBEParser, loaderFunctions);
        return parser.getCubeTexture();
    }
}

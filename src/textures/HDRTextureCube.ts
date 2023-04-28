import { ErpImage2CubeMap } from '../gfx/generate/convert/ErpImage2CubeMap';
import { IBLEnvMapCreator } from '../gfx/generate/convert/IBLEnvMapCreator';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { TextureCube } from '../gfx/graphics/webGpu/core/texture/TextureCube';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { VirtualTexture } from './VirtualTexture';
import { FileLoader } from '../loader/FileLoader';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { RGBEParser } from '../loader/parser/RGBEParser';

/**
 * HDR TextureCube
 * @group Texture
 */
export class HDRTextureCube extends TextureCube {
    private faceTextureRef: { [key: string]: { t: GPUTexture; v: GPUTextureView } };

    private _url: string;
    /**
     * create a cube texture, it's high dynamic range texture
     */
    constructor() {
        super();
        this.faceTextureRef = {};
        this.useMipmap = true;
        this.format = GPUTextureFormat.rgba16float;
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

        this.uploadErpTexture(texture);
        return this;
    }

    /**
     * fill this texture by a texture2D, which is a 360 panorama image
     * @param texture a panorama image
     * @returns
     */
    public uploadErpTexture(texture: Texture): this {
        let gpuSource = this.getGpuSource(0);
        ErpImage2CubeMap.makeTextureCube(texture, this.width, gpuSource.v);
        // this.uploadMipmap(0, maxSize, faceTextures);
        // this.generateMipmap();
        this.generateMipmap(texture);
        return this;
    }

    /**
     * fill this texture by a texture2D, which is a 360 panorama image
     * assign mipmap level
     * @param mip mipmap level
     * @param texture a panorama image
     * @returns
     */
    public uploadTexture(mip: number, texture: Texture): this {
        let gpuSource = this.getGpuSource(mip);
        ErpImage2CubeMap.makeTextureCube(texture, this.width, gpuSource.v);
        return this;
    }

    /**
     * get GPU texture raw data
     * @param mip mipmap level
     * @returns GPU texture raw data, including t: GPUTexture and v: GPUTextureView
     */
    private getGpuSource(mip: number): { t: GPUTexture; v: GPUTextureView } {
        let source: { t: GPUTexture; v: GPUTextureView } = this.faceTextureRef[mip];
        if (!source) {
            source = {
                t: this.getGPUTexture(),
                v: this.getGPUTexture().createView({
                    format: this.format,
                    dimension: '2d-array',
                    baseMipLevel: mip,
                    mipLevelCount: 1,
                    arrayLayerCount: 6,
                }),
            };
            this.faceTextureRef[mip] = source;
        }
        return source;
    }

    /**
     * Generate Mipmap
     * @param texture
     */
    private generateMipmap(texture: Texture) {
        let mipmap: number = 1;
        while (mipmap < this.mipmapCount) {
            this.generateMipmapAtLevel(mipmap, texture);
            mipmap++;
        }
    }

    /**
     * Generate a specified level of Mipmap
     * @param mipmap mipmap level
     * @param erpTexture ERP Texture Object
     * @param pow power
     */
    private generateMipmapAtLevel(mipmap: number, erpTexture: Texture, pow: number = 3.0): void {
        let mipFaceSize = this.width / Math.pow(2, mipmap);
        let image = { width: mipFaceSize, height: mipFaceSize, erpTexture: erpTexture };
        let roughness = (mipmap + 1) / this.mipmapCount;
        roughness = Math.pow(roughness, pow);
        let gpuSource = this.getGpuSource(mipmap);
        IBLEnvMapCreator.importantSample(image, mipFaceSize, roughness, gpuSource.v);
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

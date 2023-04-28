import { ErpImage2CubeMap } from "../gfx/generate/convert/ErpImage2CubeMap";
import { IBLEnvMapCreator } from "../gfx/generate/convert/IBLEnvMapCreator";
import { GPUTextureFormat } from "../gfx/graphics/webGpu/WebGPUConst";
import { webGPUContext } from "../gfx/graphics/webGpu/Context3D";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { TextureCube } from "../gfx/graphics/webGpu/core/texture/TextureCube";
import { LoaderFunctions } from "../loader/LoaderFunctions";
import { BitmapTexture2D } from "./BitmapTexture2D";

/**
 * LDRTextureCube: create a cube texture, it's low dynamic range texture
 * @group Texture
 */
export class LDRTextureCube extends TextureCube {
    private _faceTextureRef: { [key: string]: { t: GPUTexture; v: GPUTextureView } };

    private _url: string;
    /**
     * constructor: create a cube texture, it's low dynamic range texture
     */

    public get ldrImageUrl() {
        return this._url;
    }
    constructor() {
        super();
        this._faceTextureRef = {};
        this.useMipmap = true;
        this.format = GPUTextureFormat.rgba16float;
    }


    /**
    * load texture data from web url, which is a 360 panorama image
    * @param url web url
    * @param loaderFunctions callback function when load complete
    */
    public async load(url: string, loaderFunctions?: LoaderFunctions): Promise<LDRTextureCube> {
        this._url = url;
        let bitmapTexture: BitmapTexture2D = new BitmapTexture2D(false);
        await bitmapTexture.load(url, loaderFunctions);
        this.createFromLDRTexture(bitmapTexture);
        return this;
    }

    /**
     *
     * Create a texture cube
     * @param srcTexture The cube texture will be created from this 2D texture
     * @returns this
     */
    private createFromLDRTexture(srcTexture: Texture): this {
        let size = Math.log2(srcTexture.width / 4);
        size = Math.pow(2, Math.round(size));
        this.createFromTexture(size, srcTexture);
        return this;
    }

    /**
     *
     * create cube texture by environment image
     * @param size size of cube texture
     * @param texture source texture
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
     * @private
     * @param texture texture reference
     * @returns this
     */
    private uploadErpTexture(texture: Texture): this {
        let gpuSource = this.getGpuSource(0);
        ErpImage2CubeMap.makeTextureCube(texture, this.width, gpuSource.v);
        this.generateMipmap(texture);
        return this;
    }

    /**
     * @priate get GPU texture raw data
     * @param mip mipmap level
     * @returns GPU texture raw data, including t: GPUTexture and v: GPUTextureView
     */
    private getGpuSource(mip: number): { t: GPUTexture; v: GPUTextureView } {
        let source = this._faceTextureRef[mip];
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
            this._faceTextureRef[mip] = source;
        }
        return source;
    }

    /**
     * @private generateMipmap
     * @param texture texture reference
     */
    private generateMipmap(texture: Texture) {
        let mipmap: number = 1;
        while (mipmap < this.mipmapCount) {
            this.generateMipmapAtLevel(mipmap, texture);
            mipmap++;
        }
    }

    /**
     * @private Generate a specified level of Mipmap
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

}

import { GPUTextureFormat } from "../gfx/graphics/webGpu/WebGPUConst";
import { webGPUContext } from "../gfx/graphics/webGpu/Context3D";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { TextureCube } from "../gfx/graphics/webGpu/core/texture/TextureCube";
import { LoaderFunctions } from "../loader/LoaderFunctions";
import { BitmapTexture2D } from "./BitmapTexture2D";
import { TextureCubeFaceData } from "./TextureCubeFaceData";

/**
 * LDRTextureCube: create a cube texture, it's low dynamic range texture
 * @group Texture
 */
export class LDRTextureCube extends TextureCube {

    protected _faceData: TextureCubeFaceData;
    private _url: string;
    /**
     * constructor: create a cube texture, it's low dynamic range texture
     */

    public get ldrImageUrl() {
        return this._url;
    }
    constructor() {
        super();
        this.useMipmap = true;
        this.format = GPUTextureFormat.rgba16float;
        this._faceData = new TextureCubeFaceData(this);
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

        this._faceData.uploadErpTexture(texture);
        return this;
    }




}

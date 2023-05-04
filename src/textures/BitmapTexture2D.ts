import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { LoaderBase } from '../loader/LoaderBase';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { StringUtil } from '../util/StringUtil';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';

/**
 * bitmap texture
 * @group Texture
 */
export class BitmapTexture2D extends Texture {
    private _source: HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

    /**
     * @constructor
     * @param useMipmap Set whether to use mipmap
     */
    constructor(useMipmap: boolean = true) {
        super();
        this.useMipmap = useMipmap;
    }

    /**
     * get raw data of this texture
     */
    public get source(): HTMLCanvasElement | ImageBitmap | OffscreenCanvas {
        return this._source;
    }

    /**
     * set raw data of this texture
     */
    public set source(value: HTMLCanvasElement | ImageBitmap | OffscreenCanvas) {
        this._source = value;

        if (this._source instanceof HTMLImageElement) {
            this._source.decode().then(async () => {
                if (this._source instanceof HTMLImageElement) {
                    const imageBitmap = await createImageBitmap(this._source, { imageOrientation: this.flipY ? "flipY" : "from-image" });
                    this.generate(imageBitmap);
                }
            });
        } else {
            //@bug not generate OffscreenCanvas
            if (this._source instanceof HTMLCanvasElement || this._source instanceof ImageBitmap) {
                this.generate(this._source);
            }
        }
    }

    /**
     * load texture data from web url
     * @param url web url
     * @param loaderFunctions callback function when load complete
     */
    public async load(url: string, loaderFunctions?: LoaderFunctions) {
        if (url.indexOf(';base64') != -1) {
            const img = document.createElement('img');
            let start = url.indexOf('data:image');
            let uri = url.substring(start, url.length);
            img.src = uri;
            await img.decode();
            img.width = Math.max(img.width, 32);
            img.height = Math.max(img.height, 32);
            const imageBitmap = await createImageBitmap(img, {
                resizeWidth: img.width,
                resizeHeight: img.height,
                imageOrientation: this.flipY ? "flipY" : "from-image"
            });
            this.format = GPUTextureFormat.rgba8unorm;
            this.generate(imageBitmap);
        } else {
            const r = await fetch(url, {
                headers: Object.assign({
                    'Accept': 'image/avif,image/webp,*/*'
                }, loaderFunctions?.headers)
            });
            // const img = await r.blob();
            // await this.loadFromBlob(img);
            let chunks = await LoaderBase.read(url, r, loaderFunctions);
            let img = new Blob([chunks], { type: 'image/jpeg' });
            chunks = null;

            await this.loadFromBlob(img);
        }
        this.name = StringUtil.getURLName(url);
        return true;
    }


    private imageData: Blob;
    /**
    * load data from Blob
    * @param imgData blob data which contains image
    */
    public async loadFromBlob(imgData: Blob) {
        this.imageData = imgData;
        let imageBitmap = await createImageBitmap(imgData, { imageOrientation: this.flipY ? 'flipY' : 'from-image' });
        if (imageBitmap.width < 32 || imageBitmap.height < 32) {
            let width = Math.max(imageBitmap.width, 32);
            let height = Math.max(imageBitmap.height, 32);
            imageBitmap = await createImageBitmap(imageBitmap, {
                resizeWidth: width,
                resizeHeight: height,
                imageOrientation: this.flipY ? "flipY" : "from-image"
            });
        }
        this.format = GPUTextureFormat.rgba8unorm;
        this.generate(imageBitmap);
        return true;
    }

}

import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { LoaderBase } from '../loader/LoaderBase';
import { LoaderFunctions } from '../loader/LoaderFunctions';
import { StringUtil } from '../util/StringUtil';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Context3D, bindCtx } from '../gfx/graphics/webGpu/Context3D';

/**
 * Color-space hint for image-backed textures. `'srgb'` selects the
 * `rgba8unorm-srgb` GPU format so the sampler hardware-decodes the
 * stored sRGB-encoded bytes to linear at sample time (the standard
 * choice for color/albedo maps). `'linear'` keeps the plain
 * `rgba8unorm` format — appropriate for normal maps, masks,
 * height/displacement, metallic/roughness packs, and other
 * non-color data.
 *
 * @group Texture
 */
export type TextureColorSpace = 'srgb' | 'linear';

/**
 * bitmap texture
 * @group Texture
 */
export class BitmapTexture2D extends Texture {
    private _source: HTMLCanvasElement | ImageBitmap | OffscreenCanvas | HTMLImageElement;
    public premultiplyAlpha: PremultiplyAlpha = 'none';

    /**
     * Color-space contract for the underlying bytes. `'srgb'` →
     * `rgba8unorm-srgb` format (hardware decode on sample);
     * `'linear'` → `rgba8unorm` (raw, no conversion). Default
     * `'linear'` preserves legacy behavior — migrate sRGB-encoded
     * color textures by passing `'srgb'` at the call site.
     */
    public colorSpace: TextureColorSpace;

    /**
     * @constructor
     * @param useMipmap Set whether to use mipmap
     * @param ctx Optional Context3D — binds the texture to this engine's device
     *            so GPU materialization has a target. Required whenever the caller
     *            already knows which engine owns the texture (loaders, Res, GLTF).
     * @param colorSpace `'srgb'` to enable hardware sRGB decode (use for
     *            baseColor / emissive textures), `'linear'` (default) for
     *            normal / mask / metallic-roughness / AO / height data.
     */
    constructor(useMipmap: boolean = true, ctx?: Context3D, colorSpace: TextureColorSpace = 'linear') {
        super();
        this.useMipmap = useMipmap;
        this.colorSpace = colorSpace;

        this.lodMinClamp = 0;
        this.lodMaxClamp = 4;
        if (ctx) bindCtx(this, ctx);

        // this.visibility = GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    }

    /** GPU texture format derived from `colorSpace`. `'srgb'` →
     *  `rgba8unorm-srgb`, `'linear'` → `rgba8unorm`. */
    private get _ldrFormat(): GPUTextureFormat {
        return this.colorSpace === 'srgb'
            ? GPUTextureFormat.rgba8unorm_srgb
            : GPUTextureFormat.rgba8unorm;
    }

    /**
     * get raw data of this texture
     */
    public get source(): HTMLCanvasElement | ImageBitmap | OffscreenCanvas | HTMLImageElement {
        return this._source;
    }

    /**
     * set raw data of this texture
     */
    public set source(value: HTMLCanvasElement | ImageBitmap | OffscreenCanvas | HTMLImageElement) {
        this._source = value;

        // `generate()` ultimately reaches `createTexture` via `gpuTexture`,
        // which requires `this.format` to be set. `load()` sets it before
        // calling `generate()`; we mirror that here so the `.source = bitmap`
        // path (used by UIUtil.textToTexture and other Canvas2D producers)
        // doesn't hit "Required member 'format' is undefined" when assigning
        // to a freshly-constructed BitmapTexture2D.
        if (!this.format) {
            this.format = this._ldrFormat;
        }

        if (this._source instanceof HTMLImageElement) {
            this._source.decode().then(async () => {
                if (this._source instanceof HTMLImageElement) {
                    const imageBitmap = await createImageBitmap(this._source, { imageOrientation: this.flipY ? "flipY" : "from-image", premultiplyAlpha: 'none' });
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
        // Normalize relative asset URLs to origin-absolute so they
        // hit Vite's publicDir instead of falling into the SPA
        // fallback when the host document is an iframe srcdoc. See
        // LoaderBase._normalizeAssetUrl for the underlying issue.
        if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/') && typeof location !== 'undefined') {
            url = '/' + url;
        }
        this.name = StringUtil.getURLName(url);
        if (url.indexOf(';base64') != -1) {
            // Decode through a Blob + createImageBitmap, the same path every
            // other texture takes. The previous `<img>.decode()` on a detached
            // element is deferred by Chrome while the document is hidden, so
            // loading a base64 texture in a background tab (or an iframe of
            // one) never resolved and whatever awaited it hung forever.
            let start = url.indexOf('data:image');
            let uri = url.substring(start, url.length);
            const blob = await (await fetch(uri)).blob();
            await this.loadFromBlob(blob);
        } else {
            return new Promise((succ, fial) => {
                fetch(url, {
                    headers: Object.assign({
                        'Accept': 'image/avif,image/webp,*/*'
                    }, loaderFunctions?.headers)
                }).then((r) => {
                    // const img = await r.blob();
                    // await this.loadFromBlob(img);
                    LoaderBase.read(url, r, loaderFunctions).then((chunks) => {
                        let img = new Blob([chunks as BlobPart], { type: 'image/jpeg' });
                        chunks = null;
                        this.loadFromBlob(img).then(() => {
                            succ(true);
                        });
                    });

                })
            })

        }
        return true;
    }


    private imageData: Blob;
    /**
    * load data from Blob
    * @param imgData blob data which contains image
    */
    public async loadFromBlob(imgData: Blob) {
        this.imageData = imgData;
        let imageBitmap = await createImageBitmap(imgData, { imageOrientation: this.flipY ? 'flipY' : 'from-image', premultiplyAlpha: 'none' });
        if (imageBitmap.width < 32 || imageBitmap.height < 32) {
            let width = Math.max(imageBitmap.width, 32);
            let height = Math.max(imageBitmap.height, 32);
            imageBitmap = await createImageBitmap(imageBitmap, {
                resizeWidth: width,
                resizeHeight: height,
                imageOrientation: this.flipY ? "flipY" : "from-image",
                premultiplyAlpha: 'none'
            });
        }
        this.format = this._ldrFormat;
        this.generate(imageBitmap);
        return true;
    }

}

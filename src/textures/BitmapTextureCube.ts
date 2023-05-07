import { BlurTexture2DBufferCreator } from '../gfx/generate/convert/BlurEffectCreator';
import { TextureCube } from '../gfx/graphics/webGpu/core/texture/TextureCube';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { TextureCubeStdCreator } from "../gfx/generate/convert/TextureCubeStdCreator";
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { GPUContext } from '../gfx/renderJob/GPUContext';
import { StringUtil } from '../util/StringUtil';
import { BitmapTexture2D } from './BitmapTexture2D';
import { VirtualTexture } from './VirtualTexture';

/**
 * @group Texture
 */
export class BitmapTextureCube extends TextureCube {
    private _images: HTMLCanvasElement[] | ImageBitmap[] | OffscreenCanvas[];

    private _url: string | string[];

    constructor() {
        super();
        this.useMipmap = true;
    }

    protected generateImages(images: HTMLCanvasElement[] | ImageBitmap[] | OffscreenCanvas[] | Texture[]) {
        let device = webGPUContext.device;
        this.width = this.height = 32;
        if ('width' in images[0]) {
            this.width = this.height = images[0].width;
        }
        let mipmapSize = Math.min(this.width, this.height);
        this.mipmapCount = 1;
        while (mipmapSize > 16) {
            mipmapSize /= 2;
            this.mipmapCount++;
        }

        this.textureBindingLayout.viewDimension = 'cube';
        this.samplerBindingLayout.type = 'filtering';
        this.createTextureDescriptor(this.width, this.height, this.mipmapCount, this.format);

        this.textureDescriptor.size = { width: this.width, height: this.height, depthOrArrayLayers: 6 };
        this.textureDescriptor.dimension = '2d';
        this.gpuTexture = device.createTexture(this.textureDescriptor);

        let faceTextures: GPUTexture[] = [];
        let lastFaceTextures: GPUTexture[] = faceTextures;
        let mipWidth = this.width;
        let mipHeight = this.height;

        if (images[0] instanceof Texture) {
            for (let i = 0; i < 6; i++) {
                let t = images[i] as Texture;
                faceTextures[i] = t.getGPUTexture();
            }
            this.uploadMipmapGPUTexture(0, this.width, this.width, faceTextures);
        } else {
            this.uploadBaseImages(this.width, images as any);
            for (let i = 0; i < 6; i++) {
                let t = new BitmapTexture2D(false);
                t.format = this.format;
                t.source = images[i] as any;
                faceTextures[i] = t.getGPUTexture();
            }
        }

        for (let i = 1; i < this.mipmapCount; i++) {
            lastFaceTextures = faceTextures;
            faceTextures = [];
            let dstBuffer = { width: mipWidth, height: mipHeight, gpuTexture: null };
            mipWidth = mipWidth / 2;
            mipHeight = mipHeight / 2;
            for (let faceId = 0; faceId < 6; faceId++) {
                dstBuffer.gpuTexture = lastFaceTextures[faceId];
                faceTextures[faceId] = BlurTexture2DBufferCreator.blurImageFromTexture(dstBuffer, mipWidth, mipHeight, false);
            }
            this.uploadMipmapGPUTexture(i, mipWidth, mipHeight, faceTextures);
        }
        this.gpuSampler = device.createSampler(this);
    }

    private uploadBaseImages(size: number, textures: HTMLCanvasElement[] | ImageBitmap[] | OffscreenCanvas[]) {
        let device = webGPUContext.device;
        const commandEncoder = GPUContext.beginCommandEncoder();

        for (let i = 0; i < 6; i++) {
            device.queue.copyExternalImageToTexture(
                { source: textures[i] },
                {
                    texture: this.gpuTexture,
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z: i },
                },
                { width: size, height: size, depthOrArrayLayers: 1 },
            );
        }

        GPUContext.endCommandEncoder(commandEncoder);
    }

    private uploadMipmapGPUTexture(mip: number, width: number, height: number, textures: GPUTexture[]) {
        const commandEncoder = GPUContext.beginCommandEncoder();

        for (let i = 0; i < 6; i++) {
            commandEncoder.copyTextureToTexture(
                {
                    texture: textures[i],
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z: 0 },
                },
                {
                    texture: this.gpuTexture,
                    mipLevel: mip,
                    origin: { x: 0, y: 0, z: i },
                },
                {
                    width: width,
                    height: height,
                    depthOrArrayLayers: 1,
                },
            );
        }

        GPUContext.endCommandEncoder(commandEncoder);
    }

    /**
     * get images of this texture
     */
    public get images(): HTMLCanvasElement[] | ImageBitmap[] | OffscreenCanvas[] {
        return this._images;
    }

    /**
    * set images of this texture
    */
    public set images(value: HTMLCanvasElement[] | ImageBitmap[] | OffscreenCanvas[]) {
        this._images = value;

        if (this._images[0] instanceof HTMLImageElement) {
            let bitmaps: ImageBitmap[] = [];
            let remain: number = 6;
            let that = this;

            function loadImage(index: number, image: HTMLImageElement) {
                image.decode().then(async () => {
                    bitmaps[index] = await createImageBitmap(image);
                    remain--;
                    if (remain == 0) {
                        that.generateImages(bitmaps);
                    }
                });
            }

            for (let i = 0; i < 6; i++) {
                loadImage(i, this._images[i] as any);
            }
        } else {
            //@bug not generate OffscreenCanvas
            if (this._images instanceof HTMLCanvasElement || this._images instanceof ImageBitmap) {
                this.generateImages(this._images);
            }
        }
    }

    /**
     * load texture data from array of web url.
     * make sure there are six images in a group,
     * and the order is: nx, px, py, ny, nz, pz
     * @param urls array of image url
     */
    public async load(urls: string[]) {
        this._url = urls;
        let remain: number = 6;
        let bitmaps: ImageBitmap[] = [];
        this.format = GPUTextureFormat.rgba8unorm;
        let that = this;

        async function loadImage(index: number, url: string) {
            const img = document.createElement('img');
            img.src = url;
            img.setAttribute('crossOrigin', '');
            await img.decode();
            bitmaps[index] = await createImageBitmap(img);
            remain--;
            if (remain == 0) {
                that.generateImages(bitmaps);
                return true;
            }
        }

        for (let i = 0; i < 6; i++) {
            await loadImage(i, urls[i]);
        }
        return true;
    }

    /**
      * load texture data from url.
      * the image is assembled from six images into cross shaped image.
      * @param url the path of image
      */
    public async loadStd(url: string) {
        this._url = url;
        this.format = GPUTextureFormat.rgba8unorm;

        const img = document.createElement('img');
        img.src = url;
        img.setAttribute('crossOrigin', '');
        await img.decode();
        let srcTexture = new BitmapTexture2D(false);
        srcTexture.name = StringUtil.getURLName(url);
        srcTexture.format = 'rgba8unorm';
        srcTexture.source = await createImageBitmap(img);

        let cubeSize = Math.round(Math.log2(srcTexture.width / 4));
        cubeSize = Math.pow(2, cubeSize);
        this.width = this.height = cubeSize;

        let textureList: VirtualTexture[] = [];
        for (let i = 0; i < 6; i++) {
            let item = new VirtualTexture(cubeSize, cubeSize, this.format, false,
                GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
            item.name = 'face ' + i;
            textureList.push(item);
            TextureCubeStdCreator.createFace(i, this.width, srcTexture, item);
        }
        this.generateImages(textureList);
        return true;
    }
}

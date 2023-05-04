import { GPUFilterMode, GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';

import { BitmapTexture2D } from './BitmapTexture2D';
import { GPUContext } from '../gfx/renderJob/GPUContext';
import { ITexture } from '../gfx/graphics/webGpu/core/texture/ITexture';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';

/**
 * Type BitmapTexture 2D Array , Use in GPU
 * @internal
 * @group Texture
 */
export class BitmapTexture2DArray extends Texture implements ITexture {

    private _bitmapTextures: BitmapTexture2D[];

    constructor(width: number, height: number, numberLayer: number) {
        super(width, height, numberLayer);

        this.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

        // texture_depth_2d_array
        this.format = GPUTextureFormat.rgba8unorm;
        this.mipmapCount = 1;

        this._bitmapTextures = [];

        this.init();
    }

    /**
     * fill self by set texture list
     * @param texs array of BitmapTexture2D
     * @returns
     */
    public setTextures(texs: BitmapTexture2D[]) {
        this._bitmapTextures.length = 0;
        for (let i = 0; i < texs.length; i++) {
            const tex = texs[i];
            this.addTexture(tex);
        }
    }

    /**
     * add one BitmapTexture2D to this
     * @param bitmapTexture the bitmapTexture2D be added
     * @returns
     */
    public addTexture(bitmapTexture: BitmapTexture2D) {
        if (bitmapTexture.width != this.width || bitmapTexture.height != this.height) {
            console.error("bitmap texture muse match bitmapTextureArray size!");
        }
        if (this._bitmapTextures.indexOf(bitmapTexture) == -1) {
            bitmapTexture.pid = this._bitmapTextures.length;
            this._bitmapTextures.push(bitmapTexture);
            this.updateTexture();
        }
    }

    /**
    * remove one BitmapTexture2D from this
    * @param bitmapTexture the bitmapTexture2D be removed
    * @returns
    */
    public removeTexture(bitmapTexture: BitmapTexture2D) {
        let index = this._bitmapTextures.indexOf(bitmapTexture);
        if (index != -1) {
            this._bitmapTextures.splice(index, 1);
            for (let i = 0; i < this._bitmapTextures.length; i++) {
                const bitmapTexture = this._bitmapTextures[i];
                bitmapTexture.pid = i;
            }
        }
    }

    /**
     * @internal
     */
    private updateTexture() {
        let encoder = GPUContext.beginCommandEncoder();
        for (let i = 0; i < this._bitmapTextures.length; i++) {
            let bitmapTexture = this._bitmapTextures[i];
            encoder.copyTextureToTexture(
                {
                    texture: bitmapTexture.getGPUTexture(),
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z: 0 },
                },
                {
                    texture: this.getGPUTexture(),
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z: i },
                },
                {
                    width: this.width,
                    height: this.height,
                    depthOrArrayLayers: 1,
                },
            );
        }
        GPUContext.endCommandEncoder(encoder);
    }

    internalCreateBindingLayoutDesc() {
        this.textureBindingLayout.viewDimension = `2d-array`;
        this.samplerBindingLayout.type = `filtering`;

        this.minFilter = GPUFilterMode.linear;
        this.magFilter = GPUFilterMode.linear;
    }

    internalCreateTexture() {
        this.textureDescriptor = {
            format: this.format,
            size: { width: this.width, height: this.height, depthOrArrayLayers: this.numberLayer },
            dimension: '2d',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
        }
        this.gpuTexture = webGPUContext.device.createTexture(this.textureDescriptor);
    }

    internalCreateView() {
        this.viewDescriptor = {
            dimension: `2d-array`,
        };
        this.view = this.gpuTexture.createView(this.viewDescriptor);
    }

    internalCreateSampler() {
        this.gpuSampler = webGPUContext.device.createSampler(this);
    }
}

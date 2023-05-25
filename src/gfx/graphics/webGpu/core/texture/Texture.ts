import { GPUAddressMode } from '../../WebGPUConst';
import { TextureMipmapGenerator } from './TextureMipmapGenerator';
import { webGPUContext } from '../../Context3D';

/**
 * Texture
 * @group Texture
 */
export class Texture implements GPUSamplerDescriptor {

    /**
     * name of texture
     */
    public name: string;

    /**
     * source url
     */
    public url: string;

    /**
     * gpu texture
     */
    protected gpuTexture: GPUTexture;

    /**
     * Return index in texture array
     */
    public pid: number;

    /**
     * GPUTextureView
     */
    public view: GPUTextureView; // Assigned later

    /**
     * GPUSampler
     */
    public gpuSampler: GPUSampler;

    /**
     * GPUSampler for comparison
     */
    public gpuSampler_comparison: GPUSampler;

    /**
     * GPUTextureFormat
     */
    public format: GPUTextureFormat;

    /**
     * GPUTextureUsage
     */
    public usage: number;

    /**
     * texture width
     */
    public width: number = 4;

    /**
     * texture height
     */
    public height: number = 4;

    /**
     * depth or layers, default value is 1
     */
    public depthOrArrayLayers: number = 1;

    /**
     * depth or layers, default value is 1
     */
    public numberLayer: number = 1;

    /**
     * GPUTextureViewDescriptor
     */
    public viewDescriptor: GPUTextureViewDescriptor;

    /**
     * GPUTextureDescriptor
     */
    public textureDescriptor: GPUTextureDescriptor;

    /**
     * GPUShaderStage
     */
    public visibility: number = GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;


    /**
     * GPUTextureBindingLayout, contains viewDimension and multisampled
     */
    public textureBindingLayout: GPUTextureBindingLayout = {
        viewDimension: `2d`,
        multisampled: false,
    };

    /**
     * GPUSamplerBindingLayout
     */
    public samplerBindingLayout: GPUSamplerBindingLayout = {
        type: `filtering`,
    };

    /**
     * GPUSamplerBindingLayout
     */
    public sampler_comparisonBindingLayout: GPUSamplerBindingLayout = {
        type: `comparison`,
    };

    /**
     * whether to flip the image on the y-axis
     */
    public flipY: boolean;

    /**
     *  whether is video texture
     */
    public isVideoTexture?: boolean;
    public isHDRTexture?: boolean;

    private _useMipmap: boolean = false;

    private _sourceImageData: HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

    //****************************************/
    /**
    */
    private _addressModeU?: GPUAddressMode;

    /**
     * 
     */
    private _addressModeV?: GPUAddressMode;

    /**
     * Specifies the {{GPUAddressMode|address modes}} for the texture width, height, and depth
     * coordinates, respectively.
     */
    private _addressModeW?: GPUAddressMode;

    /**
     * Specifies the sampling behavior when the sample footprint is smaller than or equal to one
     * texel.
     */
    private _magFilter?: GPUFilterMode;

    /**
     * Specifies the sampling behavior when the sample footprint is larger than one texel.
     */
    private _minFilter?: GPUFilterMode;

    /**
     * Specifies behavior for sampling between mipmap levels.
     */
    private _mipmapFilter?: GPUMipmapFilterMode;

    /**
    */
    private _lodMinClamp?: number;

    /**
     * Specifies the minimum and maximum levels of detail, respectively, used internally when
     * sampling a texture.
     */
    private _lodMaxClamp?: number;

    /**
     * When provided the sampler will be a comparison sampler with the specified
     * {@link GPUCompareFunction}.
     * Note: Comparison samplers may use filtering, but the sampling results will be
     * implementation-dependent and may differ from the normal filtering rules.
     */
    private _compare?: GPUCompareFunction;

    /**
     * Specifies the maximum anisotropy value clamp used by the sampler.
     * Note: Most implementations support {@link GPUSamplerDescriptor#maxAnisotropy} values in range
     * between 1 and 16, inclusive. The used value of {@link GPUSamplerDescriptor#maxAnisotropy} will
     * be clamped to the maximum value that the platform supports.
     */
    private _maxAnisotropy?: number;

    /**
     *  mipmap Count, default value is 1
     */
    public mipmapCount: number = 1;

    protected _textureChange: boolean = false;

    /**
     * Create a texture2D
     * @param width size of texture width
     * @param height height of texture width
     * @param numberLayer number layer of texture
     * @returns
     */
    constructor(width: number = 32, height: number = 32, numberLayer: number = 1) {
        this.width = width;
        this.height = height;
        this.numberLayer = numberLayer;

        this.minFilter = 'linear';
        this.magFilter = 'linear';
        this.mipmapFilter = `linear`;
        this.addressModeU = GPUAddressMode.repeat;
        this.addressModeV = GPUAddressMode.repeat;
        this.visibility = GPUShaderStage.FRAGMENT;
    }

    public init(): this {
        let self = this;
        if (self[`internalCreateBindingLayoutDesc`]) {
            self[`internalCreateBindingLayoutDesc`]();
        }
        if (self[`internalCreateTexture`]) {
            self[`internalCreateTexture`]();
        }
        if (self[`internalCreateView`]) {
            self[`internalCreateView`]();
        }
        if (self[`internalCreateSampler`]) {
            self[`internalCreateSampler`]();
        }
        return this;
    }

    /**
     * creatTextureDescriptor
     */
    protected createTextureDescriptor(
        width: number,
        height: number,
        mipLevelCount: number,
        format: GPUTextureFormat,
        usage: number = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
        sizeCount: number = 1,
        sampleCount: number = 0,
    ) {
        this.width = width;
        this.height = height;
        this.format = format;
        this.usage = usage;
        this.textureDescriptor = {
            size: [width, height, sizeCount],
            mipLevelCount: mipLevelCount,
            format: format,
            usage: usage,
            label: `${this.name + this.width + this.height + this.format}`
        };

        if (sampleCount > 0) {
            this.textureDescriptor.sampleCount = sampleCount;
        }

        if (sizeCount > 1) {
            this.viewDescriptor = {
                dimension: `2d-array`,
            };
        } else {
            this.viewDescriptor = {
                dimension: this.textureBindingLayout.viewDimension,
            };
        }
    }

    protected generate(imageBitmap: HTMLCanvasElement | ImageBitmap | OffscreenCanvas) {
        let width = 32;
        let height = 32;

        if ('width' in imageBitmap) {
            width = imageBitmap.width;
            height = imageBitmap.height;
        }

        if (width < 32 || height < 32) {
            console.log(imageBitmap['name'] + 'Size must be greater than 32!');
        }

        this.width = width;
        this.height = height;

        this.visibility = GPUShaderStage.FRAGMENT;

        this.createTexture(imageBitmap);
    }

    private createTexture(imageBitmap: HTMLCanvasElement | ImageBitmap | OffscreenCanvas) {
        this._sourceImageData = imageBitmap;
        this.updateTextureDescription();

        this.updateGPUTexture();

        let device = webGPUContext.device;
        if (this.gpuTexture instanceof GPUTexture)
            device.queue.copyExternalImageToTexture({ source: this._sourceImageData }, { texture: this.gpuTexture }, [this.width, this.height]);

        if (this.useMipmap) {
            TextureMipmapGenerator.webGPUGenerateMipmap(this);
        }
    }

    /**
     * enable/disable mipmap
     */
    public get useMipmap(): boolean {
        return this._useMipmap;
    }

    /**
     * get mipmap
     */
    public set useMipmap(value: boolean) {
        if (value) {
            this.samplerBindingLayout.type = 'filtering';
            if (this._useMipmap == false && this._sourceImageData) {
                this._useMipmap = true;
                this.updateTextureDescription();
                this.updateGPUTexture();

                let device = webGPUContext.device;
                if (this.gpuTexture instanceof GPUTexture)
                    device.queue.copyExternalImageToTexture({ source: this._sourceImageData }, { texture: this.gpuTexture }, [this.width, this.height]);
                TextureMipmapGenerator.webGPUGenerateMipmap(this);
            }
        } else {
            this.samplerBindingLayout.type = 'non-filtering';
            if (this._useMipmap == true && this._sourceImageData) {
                this._useMipmap = false;
                this.updateTextureDescription();
                this.updateGPUTexture();

                let device = webGPUContext.device;
                if (this.gpuTexture instanceof GPUTexture)
                    device.queue.copyExternalImageToTexture({ source: this._sourceImageData }, { texture: this.gpuTexture }, [this.width, this.height]);
            }
        }

        this._textureChange = true;
        this._useMipmap = value;
        this.noticeChange();
    }

    protected updateTextureDescription() {
        // let mipmapCount = this.useMipmap ? Math.floor(Math.log2(this.width)) : 1;
        this.mipmapCount = Math.floor(this.useMipmap ? Math.log2(Math.min(this.width, this.height)) : 1);
        this.createTextureDescriptor(this.width, this.height, this.mipmapCount, this.format);
    }

    protected updateGPUTexture() {
        if (this.gpuTexture) {
            if (this.gpuTexture instanceof GPUTexture)
                this.gpuTexture.destroy();
        }
        this.gpuTexture = null;
        this.view = null;
        this.gpuTexture = this.getGPUTexture();
    }

    /**
     * create or get GPUTexture
     * @returns GPUTexture
     */
    public getGPUTexture() {
        if (!this.gpuTexture) {
            this.gpuTexture = webGPUContext.device.createTexture(this.textureDescriptor);
        }
        return this.gpuTexture;
    }

    /**
     * create or get GPUTextureView
     * @returns GPUTextureView | GPUExternalTexture
     */
    public getGPUView(index: number = 0): GPUTextureView | GPUExternalTexture {
        if (!this.view) {
            this.gpuTexture = this.getGPUTexture();
            if (this.gpuTexture instanceof GPUTexture)
                this.view = this.gpuTexture.createView(this.viewDescriptor);
        }
        return this.view;
    }

    protected _stateChangeRef: Map<any, Function> = new Map();

    public bindStateChange(fun: Function, ref: any) {
        this._stateChangeRef.set(ref, fun);
    }

    public unBindStateChange(ref: any) {
        this._stateChangeRef.delete(ref);
    }

    protected noticeChange() {
        this.gpuSampler = webGPUContext.device.createSampler(this);
        this._stateChangeRef.forEach((v, k) => {
            v();
        });
    }

    /**
     * release the texture
     */
    public destroy(force?: boolean) {
        if (force && this.gpuTexture instanceof GPUTexture) {
            this.gpuSampler = null;
            this.gpuSampler_comparison = null;
            this.textureBindingLayout = null;
            this.textureDescriptor = null;
            this.gpuTexture.destroy();
            this.gpuTexture = null;
        }
        this._stateChangeRef.clear();
    }

    public get addressModeU(): GPUAddressMode {
        return this._addressModeU;
    }

    public set addressModeU(value: GPUAddressMode) {
        if (this._addressModeU != value) {
            this._addressModeU = value;
            this.noticeChange();
        }
    }

    public get addressModeV(): GPUAddressMode {
        return this._addressModeV;
    }

    public set addressModeV(value: GPUAddressMode) {
        if (this._addressModeV != value) {
            this._addressModeV = value;
            this.noticeChange();
        }
    }

    public get addressModeW(): GPUAddressMode {
        return this._addressModeW;
    }

    public set addressModeW(value: GPUAddressMode) {
        if (this._addressModeW != value) {
            this._addressModeW = value;
            this.noticeChange();
        }
    }

    public get magFilter(): GPUFilterMode {
        return this._magFilter;
    }

    public set magFilter(value: GPUFilterMode) {
        if (this._magFilter != value) {
            this._magFilter = value;
            this.noticeChange();
        }
    }

    public get minFilter(): GPUFilterMode {
        return this._minFilter;
    }

    public set minFilter(value: GPUFilterMode) {
        if (this._minFilter != value) {
            this._minFilter = value;
            this.noticeChange();
        }
    }

    public get mipmapFilter(): GPUMipmapFilterMode {
        return this._mipmapFilter;
    }

    public set mipmapFilter(value: GPUMipmapFilterMode) {
        if (this._mipmapFilter != value) {
            this._mipmapFilter = value;
            this.noticeChange();
        }
    }

    public get lodMinClamp(): number {
        return this._lodMinClamp;
    }

    public set lodMinClamp(value: number) {
        if (this._lodMinClamp != value) {
            this._lodMinClamp = value;
            this.noticeChange();
        }
    }

    public get lodMaxClamp(): number {
        return this._lodMaxClamp;
    }

    public set lodMaxClamp(value: number) {
        if (this._lodMaxClamp != value) {
            this._lodMaxClamp = value;
            this.noticeChange();
        }
    }

    public get compare(): GPUCompareFunction {
        return this._compare;
    }

    public set compare(value: GPUCompareFunction) {
        if (this._compare != value) {
            this._compare = value;
            this.noticeChange();
        }
    }

    public get maxAnisotropy(): number {
        return this._maxAnisotropy;
    }

    public set maxAnisotropy(value: number) {
        if (this._maxAnisotropy != value) {
            this._maxAnisotropy = value;
            this.noticeChange();
        }
    }

}

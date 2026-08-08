import { AtmosphericScatteringSky_shader } from '../shader/AtmosphericScatteringSky_shader';
import { 
    Engine3D,
    Vector3,
    Color,
    HDRTextureCube,
    Texture,
    ComputeShader,
    UniformGPUBuffer,
    VirtualTexture,
    GPUTextureFormat,
    GPUContext,
    GPUAddressMode
} from "@orillusion/core";

/**
 * AtmosphericScattering Sky Setting
 * @group Texture
 */
export class AtmosphericScatteringSkySetting {
    public sunRadius: number = 500.0;
    public sunRadiance: number = 11.0;
    public mieG: number = 0.76;
    public mieHeight: number = 1200;
    public eyePos: number = 1500;
    public sunX: number = 0.71;
    public sunY: number = 0.56;
    public sunBrightness: number = 1.0;
    public displaySun: boolean = true;
    public enableClouds: boolean = true;
    public showV1: boolean = false;
    public defaultTextureCubeSize: number = 512;
    public defaultTexture2DSize: number = 1024;
    public skyColor: Color = new Color(1, 1, 1, 1);
    public hdrExposure: number = 2;
}

/**
 * Atmospheric Scattering Sky Texture
 * @group Texture
 */
export class AtmosphericScatteringSky extends HDRTextureCube {
    private _transmittanceLut: TransmittanceTexture2D;
    private _multipleScatteringLut: MultipleScatteringTexture2D;
    private _skyTexture: SkyTexture2D;
    private _skyViewLut: SkyViewTexture2D;
    private _cloudNoiseTexture: CloudNoiseTexture2D;
    private _cubeSize: number;
    public readonly setting: AtmosphericScatteringSkySetting;
    private _internalTexture: AtmosphericTexture;

    /**
     * @constructor
     * @param setting AtmosphericScatteringSkySetting
     * @returns
     */
    constructor(setting: AtmosphericScatteringSkySetting) {
        super();
        this.setting = setting;
        this.isHDRTexture = true;
        this._internalTexture = new AtmosphericTexture(setting.defaultTexture2DSize, setting.defaultTexture2DSize * 0.5);
        this._internalTexture.updateUniforms(this.setting);
        this._internalTexture.update();
        this._internalTexture.isHDRTexture = true;
        this._cubeSize = setting.defaultTextureCubeSize;
        this._cloudNoiseTexture = new CloudNoiseTexture2D(64, 64);
        this._cloudNoiseTexture.updateUniforms(this.setting);
        this._cloudNoiseTexture.update();
        this._transmittanceLut = new TransmittanceTexture2D(256, 64);
        this._transmittanceLut.updateUniforms(this.setting);
        this._transmittanceLut.update();
        this._multipleScatteringLut = new MultipleScatteringTexture2D(32, 32);
        this._multipleScatteringLut.updateUniforms(this.setting);
        this._multipleScatteringLut.updateTransmittance(this._transmittanceLut, this._cloudNoiseTexture);
        this._multipleScatteringLut.update();
        this._skyViewLut = new SkyViewTexture2D(192, 108);
        this._skyViewLut.updateUniforms(this.setting);
        this._skyViewLut.updateTextures(this._transmittanceLut, this._multipleScatteringLut, this._cloudNoiseTexture);
        this._skyViewLut.update();
        this._skyTexture = new SkyTexture2D(setting.defaultTexture2DSize, setting.defaultTexture2DSize * 0.5);
        this._skyTexture.updateUniforms(this.setting);
        this._skyTexture.updateTextures(this._transmittanceLut, this._multipleScatteringLut, this._skyViewLut, this._cloudNoiseTexture);
        this._skyTexture.isHDRTexture = true;
        this._skyTexture.update();
        this.createFromTexture(this._cubeSize, this._skyTexture);
        return this;
    }

    public get texture2D(): Texture {
        return this._skyTexture;
    }

    /**
     * @internal
     * @returns
     */
    public apply(view?: any): this {
        if (this.setting.showV1) {
            this._internalTexture.updateUniforms(this.setting);
            this._internalTexture.update();
            this._faceData.uploadErpTexture(this._internalTexture);
        } else {
            this._skyTexture.updateUniforms(this.setting);
            this._skyTexture.updateTextures(this._transmittanceLut, this._multipleScatteringLut, this._skyViewLut, this._cloudNoiseTexture);
            this._skyTexture.update();
            this._faceData.uploadErpTexture(this._skyTexture);
        }
        return this;
    }
}

/**
 * @internal
 */
class AtmosphericTexture extends VirtualTexture {
    protected _computeShader: ComputeShader;
    private _uniformBuffer: UniformGPUBuffer;
    private _workerSize: Vector3 = new Vector3(8, 8, 1);

    set workerSize(value: Vector3) {
        this._workerSize = value;
    }

    get workerSize(): Vector3 {
        return this._workerSize;
    }

    constructor(width: number, height: number, numberLayer: number = 1) {
        super(width, height, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING, numberLayer);
        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.cs);
        this._computeShader.entryPoint = 'CsMain';
        this.magFilter = 'linear';
        this.minFilter = 'linear';
        this.initCompute(width, height, numberLayer);
    }

    protected initCompute(w: number, h: number, d: number = 1): void {
        this._uniformBuffer = new UniformGPUBuffer(16 * 4);
        this._uniformBuffer.apply();

        this._computeShader.setUniformBuffer('uniformBuffer', this._uniformBuffer);
        this._computeShader.setStorageTexture(`outTexture`, this);
        this._computeShader.setSamplerTexture(`transmittanceTexture`, Engine3D.res.blackTexture);
        this._computeShader.setSamplerTexture(`multipleScatteringTexture`, Engine3D.res.blackTexture);
        this._computeShader.setSamplerTexture(`cloudTexture`, Engine3D.res.blackTexture);
        this._computeShader.workerSizeX = w / this._workerSize.x;
        this._computeShader.workerSizeY = h / this._workerSize.y;
        this._computeShader.workerSizeZ = this._workerSize.z;
    }

    public updateUniforms(setting: AtmosphericScatteringSkySetting): this {
        this._uniformBuffer.setFloat('width', this.width);
        this._uniformBuffer.setFloat('height', this.height);
        this._uniformBuffer.setFloat('sunU', setting.sunX);
        this._uniformBuffer.setFloat('sunV', setting.sunY);
        this._uniformBuffer.setFloat('eyePos', setting.eyePos);
        this._uniformBuffer.setFloat('sunRadius', setting.sunRadius);
        this._uniformBuffer.setFloat('sunRadiance', setting.sunRadiance);
        this._uniformBuffer.setFloat('mieG', setting.mieG);
        this._uniformBuffer.setFloat('mieHeight', setting.mieHeight);
        this._uniformBuffer.setFloat('sunBrightness', setting.sunBrightness);
        this._uniformBuffer.setFloat('displaySun', setting.displaySun ? 1 : 0);
        this._uniformBuffer.setFloat('enableClouds', setting.enableClouds ? 1 : 0);
        this._uniformBuffer.setFloat('hdrExposure', setting.hdrExposure);
        this._uniformBuffer.setColor('skyColor', setting.skyColor);
        this._uniformBuffer.apply();
        return this;
    }

    public update(): this {
        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [this._computeShader]);
        GPUContext.endCommandEncoder(command);
        return this;
    }
}

/**
 * @internal
 */
class TransmittanceTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number) {
        super(width, height);
        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.transmittance_cs);
        this.initCompute(width, height);
    }
}

/**
 * @internal
 */
class MultipleScatteringTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number) {
        super(width, height);
        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.multiscatter_cs);
        this.workerSize.set(1, 1, 64);
        this.initCompute(width, height);
    }

    public updateTransmittance(transmittanceTexture: TransmittanceTexture2D, cloudTexture: CloudNoiseTexture2D) {
        this._computeShader.setSamplerTexture(`transmittanceTexture`, transmittanceTexture);
        this._computeShader.setSamplerTexture(`cloudTexture`, cloudTexture);
    }
}

/**
 * @internal
 */
class SkyViewTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number) {
        super(width, height);
        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.skyview_cs);
        this.initCompute(width, height);
    }

    public updateTextures(transmittanceTexture: TransmittanceTexture2D, multipleScatteringTexture: MultipleScatteringTexture2D, cloudTexture: CloudNoiseTexture2D) {
        this._computeShader.setSamplerTexture(`transmittanceTexture`, transmittanceTexture);
        this._computeShader.setSamplerTexture(`multipleScatteringTexture`, multipleScatteringTexture);
        this._computeShader.setSamplerTexture(`cloudTexture`, cloudTexture);
    }
}

/**
 * @internal
 */
class SkyTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number) {
        super(width, height);
        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.raymarch_cs);
        this.initCompute(width, height);
    }

    public updateTextures(transmittanceTexture: TransmittanceTexture2D, multipleScatteringTexture: MultipleScatteringTexture2D, skyViewTexture: SkyViewTexture2D, cloudTexture: CloudNoiseTexture2D) {
        this._computeShader.setSamplerTexture(`transmittanceTexture`, transmittanceTexture);
        this._computeShader.setSamplerTexture(`multipleScatteringTexture`, multipleScatteringTexture);
        this._computeShader.setSamplerTexture(`skyTexture`, skyViewTexture);
        this._computeShader.setSamplerTexture(`cloudTexture`, cloudTexture);
    }
}

/**
 * @internal
 */
class CloudNoiseTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number) {
        super(width, height);
        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.cloud_cs);
        this.addressModeU = GPUAddressMode.repeat;
        this.addressModeV = GPUAddressMode.repeat;
        this.initCompute(width, height);
    }
}

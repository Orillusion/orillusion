import { AtmosphericScatteringSky_shader } from '../assets/shader/sky/AtmosphericScatteringSky_shader';
import { UniformGPUBuffer } from '../gfx/graphics/webGpu/core/buffer/UniformGPUBuffer';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { ComputeShader } from '../gfx/graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { GPUContext } from '../gfx/renderJob/GPUContext';
import { Color } from '../math/Color';
import { LDRTextureCube } from './LDRTextureCube';
import { VirtualTexture } from './VirtualTexture';
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
    public sunX: number = 0.55;
    public sunY: number = 0.56;
    public sunBrightness: number = 1.0;
    public displaySun: boolean = true;
    public defaultTextureCubeSize: number = 512;
    public defaultTexture2DSize: number = 1024;
    public skyColor: Color = new Color(1, 1, 1, 1);
}

/**
 * Atmospheric Scattering Sky Texture
 * @group Texture
 */
export class AtmosphericScatteringSky extends LDRTextureCube {
    private _internalTexture: AtmosphericTexture2D;
    private _cubeSize: number;
    public readonly setting: AtmosphericScatteringSkySetting;

    /**
     * @constructor
     * @param setting AtmosphericScatteringSkySetting
     * @returns
     */
    constructor(setting: AtmosphericScatteringSkySetting) {
        super();
        this.setting = setting;
        this._cubeSize = setting.defaultTextureCubeSize;
        this._internalTexture = new AtmosphericTexture2D(setting.defaultTexture2DSize, setting.defaultTexture2DSize * 0.5);
        this._internalTexture.update(this.setting);
        this.createFromTexture(this._cubeSize, this._internalTexture);

        return this;
    }

    public get texture2D(): Texture {
        return this._internalTexture;
    }

    /**
     * @internal
     * @returns
     */
    public apply(): this {
        this._internalTexture.update(this.setting);
        this._faceData.uploadErpTexture(this._internalTexture);
        return this;
    }
}

/**
 * @internal
 */
class AtmosphericTexture2D extends VirtualTexture {
    private _computeShader: ComputeShader;
    private _uniformBuffer: UniformGPUBuffer;

    constructor(width: number, height: number) {
        super(width, height, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);
        this.initCompute(width, height);
    }

    private initCompute(w: number, h: number): void {
        this._uniformBuffer = new UniformGPUBuffer(16 * 4);
        this._uniformBuffer.apply();

        this._computeShader = new ComputeShader(AtmosphericScatteringSky_shader.cs);
        this._computeShader.setUniformBuffer('uniformBuffer', this._uniformBuffer);
        this._computeShader.setStorageTexture(`outTexture`, this);
        this._computeShader.workerSizeX = w / 8;
        this._computeShader.workerSizeY = h / 8;
    }

    public update(setting: AtmosphericScatteringSkySetting): this {
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
        this._uniformBuffer.setColor('skyColor', setting.skyColor);
        this._uniformBuffer.apply();

        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [this._computeShader]);
        GPUContext.endCommandEncoder(command);
        return this;
    }
}

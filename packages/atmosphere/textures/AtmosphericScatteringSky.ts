import { AtmosphericScatteringSky_shader } from '../shader/AtmosphericScatteringSky_shader';
import {
    Engine3D,
    Vector3,
    Color,
    Context3D,
    HDRTextureCube,
    Texture,
    ComputeShader,
    UniformGPUBuffer,
    VirtualTexture,
    GPUTextureFormat,
    GPUAddressMode
} from "@orillusion/core";

/**
 * AtmosphericScattering Sky Setting
 * @group Texture
 */
export class AtmosphericScatteringSkySetting {
    /** Angular size of the sun disc. */
    public sunRadius: number = 500.0;
    /** Radiance (brightness) of the sun. */
    public sunRadiance: number = 11.0;
    /** Mie scattering anisotropy factor (forward-scattering bias). */
    public mieG: number = 0.76;
    /** Scale height of the Mie (aerosol) layer. */
    public mieHeight: number = 1200;
    /** Height of the viewer's eye above the planet surface, in meters. */
    public eyePos: number = 1500;
    /** Sun direction's horizontal (azimuth) parameter, in [0, 1]. */
    public sunX: number = 0.71;
    /** Sun direction's vertical (elevation) parameter, in [0, 1]. */
    public sunY: number = 0.56;
    /** Overall brightness multiplier applied to the sun. */
    public sunBrightness: number = 1.0;
    /** Whether the sun disc is drawn in the sky. */
    public displaySun: boolean = true;
    /** Whether the volumetric cloud layer is ray-marched into the sky. */
    public enableClouds: boolean = true;
    /** Render the legacy Chapman-approximation sky instead of the LUT chain. */
    public showV1: boolean = false;
    /** Default edge size of the generated sky cube texture. */
    public defaultTextureCubeSize: number = 512;
    /** Default width of the generated panorama 2D texture. */
    public defaultTexture2DSize: number = 1024;
    /** Tint color applied to the sky. */
    public skyColor: Color = new Color(1, 1, 1, 1);
    /** Exposure fed to the tonemap / gamma step of the sky kernel. */
    public hdrExposure: number = 2;
}

/**
 * Physically based atmospheric scattering sky texture.
 *
 * Bakes a Hillaire-style LUT chain — transmittance, multiple scattering, sky
 * view and a Worley cloud noise — and ray-marches them into an equirect
 * panorama, which is then projected onto the cube faces used as the skybox
 * and the scene environment map.
 *
 * @group Texture
 */
export class AtmosphericScatteringSky extends HDRTextureCube {
    private _transmittanceLut: TransmittanceTexture2D;
    private _multipleScatteringLut: MultipleScatteringTexture2D;
    private _skyTexture: SkyTexture2D;
    private _skyViewLut: SkyViewTexture2D;
    private _cloudNoiseTexture: CloudNoiseTexture2D;
    private _cubeSize: number;
    /** The scattering parameters driving this sky's appearance. */
    public readonly setting: AtmosphericScatteringSkySetting;
    private _internalTexture: AtmosphericTexture;

    /**
     * @constructor
     * @param setting AtmosphericScatteringSkySetting
     * @param ctx the Context3D this sky's GPU resources belong to. Required
     *        when more than one Engine3D is alive — every texture, compute
     *        shader and uniform buffer below binds to exactly one device.
     * @returns
     */
    constructor(setting: AtmosphericScatteringSkySetting, ctx?: Context3D) {
        super();
        this.setting = setting;
        this.isHDRTexture = true;
        this._cubeSize = setting.defaultTextureCubeSize;

        this._internalTexture = new AtmosphericTexture(setting.defaultTexture2DSize, setting.defaultTexture2DSize * 0.5, AtmosphericScatteringSky_shader.cs, null, ctx);
        this._internalTexture.isHDRTexture = true;
        this._internalTexture.updateUniforms(this.setting);
        this._internalTexture.update();

        this._cloudNoiseTexture = new CloudNoiseTexture2D(64, 64, ctx);
        this._cloudNoiseTexture.updateUniforms(this.setting);
        this._cloudNoiseTexture.update();

        this._transmittanceLut = new TransmittanceTexture2D(256, 64, ctx);
        this._transmittanceLut.updateUniforms(this.setting);
        this._transmittanceLut.update();

        this._multipleScatteringLut = new MultipleScatteringTexture2D(32, 32, ctx);
        this._multipleScatteringLut.updateUniforms(this.setting);
        this._multipleScatteringLut.updateTransmittance(this._transmittanceLut, this._cloudNoiseTexture);
        this._multipleScatteringLut.update();

        this._skyViewLut = new SkyViewTexture2D(192, 108, ctx);
        this._skyViewLut.updateUniforms(this.setting);
        this._skyViewLut.updateTextures(this._transmittanceLut, this._multipleScatteringLut, this._cloudNoiseTexture);
        this._skyViewLut.update();

        this._skyTexture = new SkyTexture2D(setting.defaultTexture2DSize, setting.defaultTexture2DSize * 0.5, ctx);
        this._skyTexture.isHDRTexture = true;
        this._skyTexture.updateUniforms(this.setting);
        this._skyTexture.updateTextures(this._transmittanceLut, this._multipleScatteringLut, this._skyViewLut, this._cloudNoiseTexture);
        this._skyTexture.update();

        this.createFromTexture(this._cubeSize, this._skyTexture, ctx);
        return this;
    }

    /** Get the underlying panorama 2D texture used to build the sky cube. */
    public get texture2D(): Texture {
        return this.setting.showV1 ? this._internalTexture : this._skyTexture;
    }

    /** Transmittance LUT (256x64) — optical depth from a point to the sun. */
    public get transmittanceLut(): Texture {
        return this._transmittanceLut;
    }

    /** Multiple-scattering LUT (32x32). */
    public get multipleScatteringLut(): Texture {
        return this._multipleScatteringLut;
    }

    /** Sky-view LUT (192x108) — the low-res distant sky. */
    public get skyViewLut(): Texture {
        return this._skyViewLut;
    }

    /** Worley noise (64x64) driving the cloud layer's density. */
    public get cloudNoiseTexture(): Texture {
        return this._cloudNoiseTexture;
    }

    /**
     * @internal
     * @returns
     */
    public apply(): this {
        if (this.setting.showV1) {
            this._internalTexture.updateUniforms(this.setting);
            this._internalTexture.update();
            this._faceData.uploadErpTexture(this._internalTexture);
        } else {
            // Re-bake the whole chain, not just the panorama: the LUTs also
            // read `enableClouds` through the shared medium sampling, and the
            // sky-view LUT tracks the sun. They are tiny (256x64, 32x32,
            // 192x108) next to the 1024x512 ray-march, so always-correct beats
            // tracking which knob invalidates what. The cloud noise is
            // setting-independent and is baked once in the constructor.
            this._transmittanceLut.updateUniforms(this.setting);
            this._transmittanceLut.update();
            this._multipleScatteringLut.updateUniforms(this.setting);
            this._multipleScatteringLut.update();
            this._skyViewLut.updateUniforms(this.setting);
            this._skyViewLut.update();
            this._skyTexture.updateUniforms(this.setting);
            this._skyTexture.update();
            this._faceData.uploadErpTexture(this._skyTexture);
        }
        return this;
    }

    /** Release the LUT chain along with the cube texture. */
    public destroy(force?: boolean): void {
        super.destroy(force);
        this._internalTexture?.destroy(force);
        this._cloudNoiseTexture?.destroy(force);
        this._transmittanceLut?.destroy(force);
        this._multipleScatteringLut?.destroy(force);
        this._skyViewLut?.destroy(force);
        this._skyTexture?.destroy(force);
        this._internalTexture = null;
        this._cloudNoiseTexture = null;
        this._transmittanceLut = null;
        this._multipleScatteringLut = null;
        this._skyViewLut = null;
        this._skyTexture = null;
    }
}

/**
 * @internal
 * One compute-shader-backed rgba16float target of the LUT chain.
 */
class AtmosphericTexture extends VirtualTexture {
    protected _computeShader: ComputeShader;
    private _uniformBuffer: UniformGPUBuffer;
    private _workerSize: Vector3;

    get workerSize(): Vector3 {
        return this._workerSize;
    }

    constructor(width: number, height: number, source: string, workerSize?: Vector3, ctx?: Context3D) {
        super(width, height, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING, 1, 0, 1, ctx);
        this._workerSize = workerSize ?? new Vector3(8, 8, 1);
        this._computeShader = new ComputeShader(source);
        this._computeShader.entryPoint = 'CsMain';
        this.magFilter = 'linear';
        this.minFilter = 'linear';
        this.initCompute(width, height);
    }

    protected initCompute(w: number, h: number): void {
        this._uniformBuffer = new UniformGPUBuffer(16 * 4);
        this._uniformBuffer.apply();

        const black = Engine3D.resFor(this._boundCtx).blackTexture;
        this._computeShader.setUniformBuffer('uniformBuffer', this._uniformBuffer);
        this._computeShader.setStorageTexture(`outTexture`, this);
        // Placeholders for the LUT inputs. Kernels that declare none of these
        // simply ignore the extra entries — bind groups are built from shader
        // reflection, not from this dictionary.
        this._computeShader.setSamplerTexture(`transmittanceTexture`, black);
        this._computeShader.setSamplerTexture(`multipleScatteringTexture`, black);
        this._computeShader.setSamplerTexture(`cloudTexture`, black);
        this._computeShader.workerSizeX = Math.ceil(w / this._workerSize.x);
        this._computeShader.workerSizeY = Math.ceil(h / this._workerSize.y);
        // Every kernel here writes a 2D target, so one workgroup deep. The
        // multi-scattering kernel's 64 z-threads are a per-workgroup reduction
        // over sample directions, not extra output rows.
        this._computeShader.workerSizeZ = 1;
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
        // WGSL starts a vec4 member on a 16-byte boundary; the CPU-side
        // allocator only aligns to 4, so pad the 13 scalars out to 16 floats
        // before the color or skyColor lands 12 bytes short of its slot.
        this._uniformBuffer.setFloat('pad0', 0);
        this._uniformBuffer.setFloat('pad1', 0);
        this._uniformBuffer.setFloat('pad2', 0);
        this._uniformBuffer.setColor('skyColor', setting.skyColor);
        this._uniformBuffer.apply();
        return this;
    }

    public update(): this {
        let gpuContext = this._boundCtx!.gpuContext;
        let command = gpuContext.beginCommandEncoder();
        gpuContext.computeCommand(command, [this._computeShader]);
        gpuContext.endCommandEncoder(command);
        return this;
    }
}

/**
 * @internal
 */
class TransmittanceTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number, ctx?: Context3D) {
        super(width, height, AtmosphericScatteringSky_shader.transmittance_cs, null, ctx);
    }
}

/**
 * @internal
 */
class MultipleScatteringTexture2D extends AtmosphericTexture {
    constructor(width: number, height: number, ctx?: Context3D) {
        // 64 z-threads per workgroup reduce the sampled sphere directions
        // through workgroup memory, one workgroup per output texel.
        super(width, height, AtmosphericScatteringSky_shader.multiscatter_cs, new Vector3(1, 1, 64), ctx);
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
    constructor(width: number, height: number, ctx?: Context3D) {
        super(width, height, AtmosphericScatteringSky_shader.skyview_cs, null, ctx);
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
    constructor(width: number, height: number, ctx?: Context3D) {
        super(width, height, AtmosphericScatteringSky_shader.raymarch_cs, null, ctx);
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
    constructor(width: number, height: number, ctx?: Context3D) {
        super(width, height, AtmosphericScatteringSky_shader.cloud_cs, null, ctx);
        // Tiling noise: the setters drop the cached sampler, which the lazy
        // getter rebuilds before the bind group is created.
        this.addressModeU = GPUAddressMode.repeat;
        this.addressModeV = GPUAddressMode.repeat;
    }
}

import { WATER_MAX_WAVES, WaterShader } from '../assets/shader/materials/WaterShader';
import { WATER_FFT_PATCHES, WaterFFT } from '../components/renderer/WaterFFT';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { RenderShaderPass } from '../gfx/graphics/webGpu/shader/RenderShaderPass';
import { Shader } from '../gfx/graphics/webGpu/shader/Shader';
import { GPUCullMode } from '../gfx/graphics/webGpu/WebGPUConst';
import { PassType } from '../gfx/renderJob/passRenderer/state/PassType';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';
import { BlendMode } from './BlendMode';
import { Material } from './Material';

export { WATER_MAX_WAVES };
const WAVE_UNIFORMS = ['waveA', 'waveB', 'waveC', 'waveD', 'waveE', 'waveF', 'waveG', 'waveH'];

/**
 * Surface material of {@link WaterRenderer}: Gerstner-wave displacement,
 * refraction of the opaque scene behind, absorption, environment
 * reflection and a sun highlight. Drawn by the transmission pass, after
 * the opaque scene has been captured into the scene color pyramid.
 * @group Material
 */
export class WaterMaterial extends Material {
    /** Fade distance, undisturbed height, detail scale, detail strength (WaterShader surface). */
    private _surface = new Vector4(0, 0, 1, 0);
    /** Foam intensity, reflection roughness, subsurface intensity, underwater clarity (WaterShader look). */
    private _look = new Vector4(1, 0.02, 1, 0.5);

    constructor() {
        super();
        ShaderLib.register('WaterShader', WaterShader);
        const shader = new Shader();
        const colorPass = new RenderShaderPass('WaterShader', 'WaterShader');
        colorPass.passType = PassType.COLOR;
        colorPass.setShaderEntry('VertMain', 'FragMain');
        const state = colorPass.shaderState;
        state.useLight = true;
        state.receiveEnv = true;
        state.acceptShadow = false;
        state.castShadow = false;
        state.acceptGI = false;
        state.blendMode = BlendMode.NONE;
        shader.addRenderPass(colorPass);
        this.shader = shader;
        // Back faces are the surface seen from below.
        this.cullMode = GPUCullMode.none;

        this.absorptionColor = new Color(0.12, 0.62, 0.72, 1);
        this.underwaterColor = new Color(0.03, 0.16, 0.2, 1);
        this.density = 0.15;
        this.refractionStrength = 1;
        this.waterDepth = 2;
        this.specularPower = 2000;
        this.specularIntensity = 2;
        this.reflectionIntensity = 1;
        this.fresnelClamp = 1;
        this.waveTime = 0;
        for (let i = 0; i < WATER_MAX_WAVES; i++) this.setWave(i, 0, 0, 0, 0);
        this.setRippleTransform([1, 0, 0], [0, 1, 0], [0, 0, 1, 1]);
        this.shader.setUniformVector4('surface', this._surface);
        this.shader.setUniformVector4('look', this._look);
        const [p0, p1, p2] = WATER_FFT_PATCHES;
        this.shader.setUniformVector4('fftPatch', new Vector4(p0, p1, p2, 0));
    }

    /** Drawn by the transmission pass so the scene color pyramid already holds the scene behind. */
    public get transmissionFactor(): number {
        return 1;
    }

    /** @internal Opaque scene color with mips, sampled for refraction. */
    public set sceneColorPyramid(texture: Texture) {
        this.shader.setTexture('sceneColorPyramid', texture);
    }
    public get sceneColorPyramid(): Texture {
        return this.shader.getTexture('sceneColorPyramid');
    }

    /**
     * @internal Opaque scene linear view depth (SceneLinearDepthPass). With it the water uses
     * the real distance to the bottom; without it, {@link waterDepth}.
     */
    public set sceneLinearDepth(texture: Texture | null) {
        if (texture) {
            // r32float: read with textureLoad, not filterable.
            texture.textureBindingLayout.sampleType = 'unfilterable-float';
            this.shader.setTexture('sceneLinearDepth', texture);
        }
        this.shader.setDefine('USE_SCENEDEPTH', !!texture);
    }

    /** @internal FFT wave cascades and their foam (WaterFFT), or null without. */
    public set fft(fft: WaterFFT | null) {
        if (fft) {
            for (let c = 0; c < WATER_FFT_PATCHES.length; c++) {
                this.shader.setTexture(`fftDisplacement${c}`, fft.displacement[c]);
                this.shader.setTexture(`fftSlope${c}`, fft.slope[c]);
            }
            this.shader.setTexture('fftFoam', fft.foam);
        }
        this.shader.setDefine('USE_FFT', !!fft);
    }

    /** Tileable foam (r) drawn where whitecaps form; null falls back to plain noise patches. */
    public set foamTexture(texture: Texture | null) {
        if (texture) this.shader.setTexture('foamTexture', texture);
        this.shader.setDefine('USE_FOAM_TEXTURE', !!texture);
    }
    public get foamTexture(): Texture | null {
        return this.shader.getTexture('foamTexture') ?? null;
    }

    /** @internal Typical crest height of the FFT waves, for the crests' scattering. Set by WaterRenderer. */
    public set fftCrest(value: number) {
        const v = this.shader.getUniformVector4('fftPatch');
        this.shader.setUniformVector4('fftPatch', new Vector4(v.x, v.y, v.z, value));
    }

    /**
     * @internal Interactive ripple heights (WaterRipples, r = height), or null without ripples.
     */
    public set rippleMap(texture: Texture | null) {
        if (texture) this.shader.setTexture('rippleMap', texture);
        this.shader.setDefine('USE_RIPPLES', !!texture);
    }

    /**
     * @internal Maps world xz to the ripple grid: local x = dot(toLocalX.xy, xz) + toLocalX.z,
     * likewise z; bounds are the local xz the grid covers (min x, min z, max x, max z).
     */
    public setRippleTransform(toLocalX: number[], toLocalZ: number[], bounds: number[]): void {
        this.shader.setUniformVector4('rippleX', new Vector4(toLocalX[0], toLocalX[1], toLocalX[2], 0));
        this.shader.setUniformVector4('rippleZ', new Vector4(toLocalZ[0], toLocalZ[1], toLocalZ[2], 0));
        this.shader.setUniformVector4('rippleBounds', new Vector4(bounds[0], bounds[1], bounds[2], bounds[3]));
    }

    /**
     * Sets one Gerstner wave. A wavelength of 0 disables it.
     * @param index 0 to {@link WATER_MAX_WAVES} - 1
     * @param dirX direction of travel, x
     * @param dirZ direction of travel, z
     * @param steepness 0 to 1; the sum over all waves should stay below 1 to avoid loops
     * @param wavelength crest-to-crest distance in world units
     */
    public setWave(index: number, dirX: number, dirZ: number, steepness: number, wavelength: number): void {
        if (index < 0 || index >= WATER_MAX_WAVES) return;
        this.shader.setUniformVector4(WAVE_UNIFORMS[index], new Vector4(dirX, dirZ, steepness, wavelength));
    }

    /**
     * @internal Distance from the camera, in wavelengths, at which a wave has faded out
     * (from half of it on); 0 keeps every wave at any distance. Set through WaterRenderer.
     */
    public get waveFadeDistance(): number {
        return this._surface.x;
    }
    public set waveFadeDistance(value: number) {
        this._surface.x = value;
        this.shader.setUniformVector4('surface', this._surface);
    }

    /** @internal World height of the undisturbed surface, for the crests' scattering. Set by WaterRenderer. */
    public set baseHeight(value: number) {
        this._surface.y = value;
        this.shader.setUniformVector4('surface', this._surface);
    }

    /** @internal Base wavelength of the fine ripples. Set through WaterRenderer.detailScale. */
    public set detailScale(value: number) {
        this._surface.z = value;
        this.shader.setUniformVector4('surface', this._surface);
    }

    /** @internal How much the fine ripples bend the surface normal. Set through WaterRenderer.detailStrength. */
    public set detailStrength(value: number) {
        this._surface.w = value;
        this.shader.setUniformVector4('surface', this._surface);
    }

    /** Whitecaps where the waves pinch into sharp crests (0 to 1); calm water has none. */
    public get foamIntensity(): number {
        return this._look.x;
    }
    public set foamIntensity(value: number) {
        this._look.x = value;
        this.shader.setUniformVector4('look', this._look);
    }

    /**
     * Roughness of the surface below the scale of the fine ripples (0 to 1),
     * blurring the reflection; ripples too fine for a pixel add to it.
     */
    public get reflectionRoughness(): number {
        return this._look.y;
    }
    public set reflectionRoughness(value: number) {
        this._look.y = value;
        this.shader.setUniformVector4('look', this._look);
    }

    /** Sunlight glowing through the crests of tall waves when looking toward the sun. */
    public get subsurfaceIntensity(): number {
        return this._look.z;
    }
    public set subsurfaceIntensity(value: number) {
        this._look.z = value;
        this.shader.setUniformVector4('look', this._look);
    }

    /**
     * How clearly the world above shows through the surface from underwater
     * (0 to 1). 0 is physical: Snell's window spans 48.6 degrees from straight
     * up and the rest of the surface mirrors the water below; higher widens
     * the window and weakens the mirror.
     */
    public get underwaterClarity(): number {
        return this._look.w;
    }
    public set underwaterClarity(value: number) {
        this._look.w = value;
        this.shader.setUniformVector4('look', this._look);
    }

    /** Light passing through the water is tinted toward this color. */
    public get absorptionColor(): Color {
        return this.shader.getUniformColor('absorptionColor');
    }
    public set absorptionColor(value: Color) {
        this.shader.setUniformColor('absorptionColor', value);
    }

    /** Color of deep water: anything seen through the water, from above or below, fades into it with distance. */
    public get underwaterColor(): Color {
        return this.shader.getUniformColor('underwaterColor');
    }
    public set underwaterColor(value: Color) {
        this.shader.setUniformColor('underwaterColor', value);
    }

    /** Absorption per world unit of path through the water. */
    public get density(): number {
        return this.shader.getUniformFloat('density');
    }
    public set density(value: number) {
        this.shader.setUniformFloat('density', value);
    }

    /** Scale of the wave distortion seen through the surface: 1 is physical, 0 disables it. */
    public get refractionStrength(): number {
        return this.shader.getUniformFloat('refractionStrength');
    }
    public set refractionStrength(value: number) {
        this.shader.setUniformFloat('refractionStrength', value);
    }

    /** Depth of the bottom below the surface, in world units; used when setting.render.water is off (no scene depth). */
    public get waterDepth(): number {
        return this.shader.getUniformFloat('waterDepth');
    }
    public set waterDepth(value: number) {
        this.shader.setUniformFloat('waterDepth', value);
    }

    /** Sun highlight exponent; higher is smaller and sharper. */
    public get specularPower(): number {
        return this.shader.getUniformFloat('specularPower');
    }
    public set specularPower(value: number) {
        this.shader.setUniformFloat('specularPower', value);
    }

    /** Sun highlight strength. */
    public get specularIntensity(): number {
        return this.shader.getUniformFloat('specularIntensity');
    }
    public set specularIntensity(value: number) {
        this.shader.setUniformFloat('specularIntensity', value);
    }

    /** Environment reflection strength. */
    public get reflectionIntensity(): number {
        return this.shader.getUniformFloat('reflectionIntensity');
    }
    public set reflectionIntensity(value: number) {
        this.shader.setUniformFloat('reflectionIntensity', value);
    }

    /** Upper bound of the fresnel reflection weight (0 to 1). */
    public get fresnelClamp(): number {
        return this.shader.getUniformFloat('fresnelClamp');
    }
    public set fresnelClamp(value: number) {
        this.shader.setUniformFloat('fresnelClamp', value);
    }

    /** @internal Wave phase time in seconds, driven by WaterRenderer. */
    public get waveTime(): number {
        return this.shader.getUniformFloat('waveTime');
    }
    public set waveTime(value: number) {
        this.shader.setUniformFloat('waveTime', value);
    }
}

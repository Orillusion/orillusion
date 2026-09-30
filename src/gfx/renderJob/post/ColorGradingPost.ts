import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { ColorGradingShader } from '../../../assets/shader/post/ColorGradingShader';
import { Engine3D } from '../../../Engine3D';
import { View3D } from '../../../core/View3D';
import { ViewQuad } from '../../../core/ViewQuad';
import { Vector4 } from '../../../math/Vector4';
import { RenderTexture } from '../../../textures/RenderTexture';
import { Uint8ArrayTexture } from '../../../textures/Uint8ArrayTexture';
import { ColorGradingUtil } from '../../../util/ColorGradingUtil';
import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { GPUAddressMode, GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { PostBase } from './PostBase';

/**
 * Color grading, applied after the tonemap on display-referred color:
 * exposure trim, white balance (temperature / tint), contrast, saturation,
 * ASC-CDL slope / offset / power, and an optional strip LUT for film looks.
 *
 * ```ts
 * const post = scene.addComponent(PostProcessingComponent);
 * const grade = post.addPost(ColorGradingPost);
 * grade.contrast = 1.15;
 * grade.saturation = 1.1;
 * grade.temperature = 0.2;
 * grade.setLUTFromFunction(16, (r, g, b) => [r, g * 0.9, b * 0.8]);   // or grade.lut = a 256×16 strip texture
 * ```
 * @group Post Effects
 */
export class ColorGradingPost extends PostBase {
    public postQuad: ViewQuad;
    public renderTexture: RenderTexture;

    private _lut: Texture | null = null;
    private _lutSize: number = 0;
    private _gradeParams = new Vector4();
    private _whiteBalance = new Vector4();
    private _slope = new Vector4();
    private _offset = new Vector4();
    private _power = new Vector4();

    constructor() {
        super();
        // Runs with the final passes, after TonemapPost (attached earlier by the engine).
        this.isFinalPass = true;
        ShaderLib.register('ColorGrading_Shader', ColorGradingShader);
    }

    protected createResource(view: View3D) {
        let [w, h] = this._boundCtx!.presentationSize;
        this.renderTexture = this.createRTTexture(`ColorGradingPost`, w, h, GPUTextureFormat.rgba16float);
        this.postQuad = this.createViewQuad(`colorGrading`, 'ColorGrading_Shader', this.renderTexture);
        this.applyUniforms();
    }

    public onResize() {
        let [w, h] = this._boundCtx!.presentationSize;
        this.renderTexture?.resize(w, h);
    }

    /** @internal */
    public onAttach(view: View3D) {
        this.setting.render.postProcessing.colorGrading.enable = true;
    }

    /** @internal */
    public onDetach(view: View3D) {
        this.setting.render.postProcessing.colorGrading.enable = false;
    }

    private get _s() {
        return this.setting.render.postProcessing.colorGrading;
    }

    /** Exposure trim in stops. */
    public get exposure(): number { return this._s.exposure; }
    public set exposure(v: number) { this._s.exposure = v; }

    /** White balance, −1 cool … +1 warm. */
    public get temperature(): number { return this._s.temperature; }
    public set temperature(v: number) { this._s.temperature = Math.min(Math.max(v, -1), 1); }

    /** Green–magenta balance, −1 green … +1 magenta. */
    public get tint(): number { return this._s.tint; }
    public set tint(v: number) { this._s.tint = Math.min(Math.max(v, -1), 1); }

    /** Contrast, 1 = unchanged. */
    public get contrast(): number { return this._s.contrast; }
    public set contrast(v: number) { this._s.contrast = Math.max(v, 0); }

    /** Saturation, 0 = greyscale, 1 = unchanged. */
    public get saturation(): number { return this._s.saturation; }
    public set saturation(v: number) { this._s.saturation = Math.max(v, 0); }

    /** ASC-CDL slope per channel. */
    public get slope(): [number, number, number] { return this._s.slope; }
    public set slope(v: [number, number, number]) { this._s.slope = [v[0], v[1], v[2]]; }

    /** ASC-CDL offset per channel. */
    public get offset(): [number, number, number] { return this._s.offset; }
    public set offset(v: [number, number, number]) { this._s.offset = [v[0], v[1], v[2]]; }

    /** ASC-CDL power per channel. */
    public get power(): [number, number, number] { return this._s.power; }
    public set power(v: [number, number, number]) { this._s.power = [Math.max(v[0], 1e-3), Math.max(v[1], 1e-3), Math.max(v[2], 1e-3)]; }

    /** LUT blend, 0…1. */
    public get lutIntensity(): number { return this._s.lutIntensity; }
    public set lutIntensity(v: number) { this._s.lutIntensity = Math.min(Math.max(v, 0), 1); }

    /**
     * Strip LUT texture (`size²`×`size`, e.g. 256×16 or 1024×32), sRGB-encoded,
     * top row = green 0. `null` removes it. The texture must not use mipmaps.
     */
    public get lut(): Texture | null { return this._lut; }
    public set lut(tex: Texture | null) {
        this._lut = tex;
        this._lutSize = tex ? tex.height : 0;
        if (tex) {
            tex.addressModeU = GPUAddressMode.clamp_to_edge;
            tex.addressModeV = GPUAddressMode.clamp_to_edge;
        }
        if (this.postQuad) this.postQuad.quadShader.setTexture('lutMap', this._lutOrDefault());
    }

    /** Edge length of the current LUT cube, 0 without a LUT. */
    public get lutSize(): number { return this._lutSize; }

    /**
     * Build a LUT from a function on sRGB-encoded colors and use it.
     * @returns the pixel data, e.g. to feed `ColorGradingUtil.sampleLUT`.
     */
    public setLUTFromFunction(size: number, fn: (r: number, g: number, b: number) => [number, number, number]) {
        const lut = ColorGradingUtil.createLUTData(size, fn);
        const tex = new Uint8ArrayTexture();
        tex.create(lut.width, lut.height, lut.data, false, this._boundCtx ?? undefined);
        this.lut = tex;
        return lut;
    }

    private _lutOrDefault(): Texture {
        return this._lut ?? Engine3D.resFor(this._boundCtx!).whiteTexture;
    }

    public render(view: View3D, command: GPUCommandEncoder) {
        this.applyUniforms();
        this.rtViewQuad.forEach((viewQuad) => {
            let lastTexture = this._boundCtx!.gpuContext.lastRenderPassState.getLastRenderTexture(this._boundCtx!);
            viewQuad.renderToViewQuad(view, viewQuad, command, lastTexture);
        });
    }

    private applyUniforms() {
        if (!this.postQuad) return;
        const s = this._s;
        const wb = ColorGradingUtil.whiteBalance(s.temperature, s.tint);
        this._gradeParams.set(Math.pow(2, s.exposure), s.contrast, s.saturation, this._lut ? s.lutIntensity : 0);
        this._whiteBalance.set(wb[0], wb[1], wb[2], this._lut ? this._lutSize : 0);
        this._slope.set(s.slope[0], s.slope[1], s.slope[2], 1);
        this._offset.set(s.offset[0], s.offset[1], s.offset[2], 0);
        this._power.set(s.power[0], s.power[1], s.power[2], 1);
        const shader = this.postQuad.quadShader;
        shader.setUniform('gradeParams', this._gradeParams);
        shader.setUniform('whiteBalance', this._whiteBalance);
        shader.setUniform('slope', this._slope);
        shader.setUniform('offset', this._offset);
        shader.setUniform('power', this._power);
        if (!shader.getTexture('lutMap')) shader.setTexture('lutMap', this._lutOrDefault());
    }
}

import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { LensShader } from '../../../assets/shader/post/LensShader';
import { View3D } from '../../../core/View3D';
import { ViewQuad } from '../../../core/ViewQuad';
import { Color } from '../../../math/Color';
import { Vector4 } from '../../../math/Vector4';
import { RenderTexture } from '../../../textures/RenderTexture';
import { Time } from '../../../util/Time';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { PostBase } from './PostBase';

/**
 * Lens effects in a single fullscreen pass: vignette, chromatic aberration
 * and film grain. Runs in scene-linear HDR ahead of the final tonemap, so
 * the grain and the darkened corners go through the same tone curve as the
 * rest of the image.
 *
 * ```ts
 * const post = scene.addComponent(PostProcessingComponent);
 * const lens = post.addPost(LensPost);
 * lens.vignetteIntensity = 0.45;
 * lens.chromaticAberration = 0.08;
 * lens.grainIntensity = 0.12;
 * ```
 * @group Post Effects
 */
export class LensPost extends PostBase {
    public postQuad: ViewQuad;
    public renderTexture: RenderTexture;

    private _vignetteParams = new Vector4();
    private _lensParams = new Vector4();
    private _vignetteColor = new Vector4();

    constructor() {
        super();
        ShaderLib.register('Lens_Shader', LensShader);
    }

    protected createResource(view: View3D) {
        let [w, h] = this._boundCtx!.presentationSize;
        this.renderTexture = this.createRTTexture(`LensPost`, w, h, GPUTextureFormat.rgba16float);
        this.postQuad = this.createViewQuad(`lens`, 'Lens_Shader', this.renderTexture);
        this.applyUniforms();
    }

    public onResize() {
        let [w, h] = this._boundCtx!.presentationSize;
        this.renderTexture?.resize(w, h);
    }

    /** @internal */
    public onAttach(view: View3D) {
        this.setting.render.postProcessing.lens.enable = true;
    }

    /** @internal */
    public onDetach(view: View3D) {
        this.setting.render.postProcessing.lens.enable = false;
    }

    private get _s() {
        return this.setting.render.postProcessing.lens;
    }

    /** Vignette strength, 0 = off. */
    public get vignetteIntensity(): number { return this._s.vignetteIntensity; }
    public set vignetteIntensity(v: number) { this._s.vignetteIntensity = Math.max(0, v); }

    /** Vignette falloff softness, 0..1. */
    public get vignetteSmoothness(): number { return this._s.vignetteSmoothness; }
    public set vignetteSmoothness(v: number) { this._s.vignetteSmoothness = Math.min(Math.max(v, 0), 1); }

    /** 1 = circular, 0 = follows the screen rectangle. */
    public get vignetteRoundness(): number { return this._s.vignetteRoundness; }
    public set vignetteRoundness(v: number) { this._s.vignetteRoundness = Math.min(Math.max(v, 0), 1); }

    /** Color the corners fade to. */
    public get vignetteColor(): Color { return this._s.vignetteColor; }
    public set vignetteColor(v: Color) { this._s.vignetteColor.copy(v); }

    /** Chromatic aberration strength, 0 = off. */
    public get chromaticAberration(): number { return this._s.chromaticAberration; }
    public set chromaticAberration(v: number) { this._s.chromaticAberration = Math.max(0, v); }

    /** Film grain strength, 0 = off. */
    public get grainIntensity(): number { return this._s.grainIntensity; }
    public set grainIntensity(v: number) { this._s.grainIntensity = Math.max(0, v); }

    /** Freeze the grain pattern. */
    public get grainStatic(): boolean { return this._s.grainStatic; }
    public set grainStatic(v: boolean) { this._s.grainStatic = v; }

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
        const [w, h] = this._boundCtx!.presentationSize;
        const c = s.vignetteColor;
        this._vignetteColor.set(c.r, c.g, c.b, 1);
        this._vignetteParams.set(s.vignetteIntensity, s.vignetteSmoothness, s.vignetteRoundness, h > 0 ? w / h : 1);
        this._lensParams.set(s.chromaticAberration, s.grainIntensity, s.grainStatic ? 0 : (Time.frame % 1024), 0);
        const shader = this.postQuad.quadShader;
        shader.setUniform('vignetteColor', this._vignetteColor);
        shader.setUniform('vignetteParams', this._vignetteParams);
        shader.setUniform('lensParams', this._lensParams);
    }
}

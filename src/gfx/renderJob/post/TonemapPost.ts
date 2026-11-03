import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { TonemapShader } from '../../../assets/shader/post/TonemapShader';
import { View3D } from '../../../core/View3D';
import { ViewQuad } from '../../../core/ViewQuad';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { RenderTexture } from '../../../textures/RenderTexture';
import { PostBase } from './PostBase';
import { TonemapUtil } from '../../../util/TonemapUtil';

/**
 * Final HDR → LDR tonemap pass. Applies the curve selected by
 * `setting.render.tonemap.mode` (ACES, Reinhard, Uncharted2, AgX, Khronos
 * Neutral or passthrough) and writes to an `rgba16float` RT — keeping the chain
 * HDR-correct so the swapchain (in sRGB hardware-encode mode) does
 * the linear→sRGB step. Reads the chain cursor via
 * `lastRenderPassState.getLastRenderTexture`, identical to FXAAPost.
 *
 * Marked as a final pass (`isFinalPass = true`) so PostRenderer always
 * iterates it after every user-attached post regardless of attach
 * order. This guarantees Bloom / FXAA / GodRay run in linear HDR
 * space and only the *combined* signal hits the curve.
 *
 * @group Post Effects
 */
export class TonemapPost extends PostBase {
    public postQuad: ViewQuad;
    public renderTexture: RenderTexture;

    constructor() {
        super();
        this.isFinalPass = true;
        ShaderLib.register('Tonemap_Shader', TonemapShader);
    }

    protected createResource(view: View3D) {
        let [w, h] = this._boundCtx!.presentationSize;
        this.renderTexture = this.createRTTexture(`TonemapPost`, w, h, GPUTextureFormat.rgba16float);
        this.postQuad = this.createViewQuad(`tonemap`, 'Tonemap_Shader', this.renderTexture);
        this.applyUniforms();
    }

    public onResize() {
        let [w, h] = this._boundCtx!.presentationSize;
        this.renderTexture.resize(w, h);
    }

    public onAttach(view: View3D) {
        const tm = this.setting.render.tonemap;
        if (tm) tm.enable = true;
    }

    public onDetach(view: View3D) {
        const tm = this.setting.render.tonemap;
        if (tm) tm.enable = false;
    }

    public render(view: View3D, command: GPUCommandEncoder) {
        const tm = this.setting.render.tonemap;
        if (tm && !tm.enable) {
            return;
        }
        this.applyUniforms();
        this.rtViewQuad.forEach((viewQuad) => {
            let lastTexture = this._boundCtx!.gpuContext.lastRenderPassState.getLastRenderTexture(this._boundCtx!);
            viewQuad.renderToViewQuad(view, viewQuad, command, lastTexture);
        });
    }

    private applyUniforms() {
        if (!this.postQuad) return;
        const tm = this.setting.render.tonemap;
        const exposure = tm ? tm.exposure : 1.0;
        const mode = TonemapUtil.modeIndex(tm?.mode);
        this.postQuad.quadShader.setUniform('exposure', exposure);
        this.postQuad.quadShader.setUniform('mode', mode);
        this.postQuad.quadShader.setUniform('whitePoint', tm?.whitePoint ?? 4.0);
        // Every MaterialUniform field needs a value before the bind group is
        // generated, including the alignment pad.
        this.postQuad.quadShader.setUniform('tonemapPad', 0.0);
    }
}

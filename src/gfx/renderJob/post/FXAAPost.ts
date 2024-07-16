import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { Engine3D } from '../../../Engine3D';
import { Vector2 } from '../../../math/Vector2';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
import { FXAAShader } from '../../../assets/shader/post/FXAAShader';
import { ViewQuad } from '../../../core/ViewQuad';
import { RenderTexture } from '../../../textures/RenderTexture';
/**
 * FXAA(fast approximate antialiasing)
 * A deformation anti-aliasing method that pays more attention to performance. 
 * It only needs one pass to get the result. FXAA focuses on fast visual anti-aliasing effect, 
 * rather than pursuing perfect real anti-aliasing effect.
 * @group Post Effects
 */
export class FXAAPost extends PostBase {
    postQuad: ViewQuad;

    renderTexture: RenderTexture;
    constructor() {
        super();
        let [w, h] = webGPUContext.presentationSize;
        ShaderLib.register("FXAA_Shader", FXAAShader);

        this.renderTexture = this.createRTTexture(`FXAAPost`, w, h, GPUTextureFormat.rgba16float);
        this.postQuad = this.createViewQuad(`fxaa`, 'FXAA_Shader', this.renderTexture);
        this.postQuad.quadShader.setUniform("u_texel", new Vector2(1.0 / w, 1.0 / h));
        this.postQuad.quadShader.setUniform("u_strength", 4);
    }

    public onResize() {
        let [w, h] = webGPUContext.presentationSize;
        this.renderTexture.resize(w, h);
    }

    /**
     * @internal
     */
    onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.fxaa.enable = true;
    }

    /**
     * @internal
     */
    onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.fxaa.enable = false;
    }
}

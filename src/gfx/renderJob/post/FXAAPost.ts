import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { Engine3D } from '../../../Engine3D';
import { Vector2 } from '../../../math/Vector2';
import { UniformNode } from '../../graphics/webGpu/core/uniforms/UniformNode';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
import { FXAAShader } from '../../..';
/**
 * FXAA(fast approximate antialiasing)
 * A deformation anti-aliasing method that pays more attention to performance. 
 * It only needs one pass to get the result. FXAA focuses on fast visual anti-aliasing effect, 
 * rather than pursuing perfect real anti-aliasing effect.
 * @group Post Effects
 */
export class FXAAPost extends PostBase {

    constructor() {
        super();
        let presentationSize = webGPUContext.presentationSize;

        ShaderLib.register("FXAA_Shader", FXAAShader);

        let rt = this.createRTTexture(`FXAAPost`, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float);
        let quad = this.createViewQuad(`fxaa`, 'FXAA_Shader', rt);
        quad.quadShader.setUniform("u_texel", new Vector2(1.0 / presentationSize[0], 1.0 / presentationSize[1]));
        quad.quadShader.setUniform("u_strength", 4);
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

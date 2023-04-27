import FSAA_Shader from '../../../assets/shader/post/FSAAShader.wgsl?raw';
import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { Engine3D } from '../../../Engine3D';
import { Vector2 } from '../../../math/Vector2';
import { UniformNode } from '../../graphics/webGpu/core/uniforms/UniformNode';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { RTResourceConfig } from '../config/RTResourceConfig';
import { RTResourceMap } from '../frame/RTResourceMap';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
/**
 * FXAA(fast approximate antialiasing)屏幕抗锯齿
 * 一种比较注重性能的形变抗锯齿方式，只需要一次 Pass 就能得到结果，FXAA 注重快速的视觉抗锯齿效果，而非追求完美的真实抗锯齿效果。
 * ```
 * //配置相关参数
 * let cfg = {@link Engine3D.setting.render.postProcessing.fxaa};
 *   let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        
 * Engine3D.startRender(renderJob);
 *```
 * @group Post Effects
 */
export class FXAAPost extends PostBase {

    constructor() {
        super();
        let presentationSize = webGPUContext.presentationSize;
        RTResourceMap.createRTTexture(RTResourceConfig.colorBufferTex_NAME, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float, false);

        ShaderLib.register("FXAA_Shader", FSAA_Shader);

        let shaderUniforms = {
            u_texel: new UniformNode(new Vector2(1.0 / presentationSize[0], 1.0 / presentationSize[1])),
            u_strength: new UniformNode(4),
        };

        let rt = this.createRTTexture(`FXAAPost`, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float);
        this.createViewQuad(`fxaa`, 'FXAA_Shader', rt, shaderUniforms);
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

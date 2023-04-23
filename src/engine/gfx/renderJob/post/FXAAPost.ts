import { View3D } from '../../../..';
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
/**
 * FXAA(fast approximate antialiasing)Anti aliasing
 * A performance oriented deformation anti aliasing method that only requires one pass to obtain results.
 *  FXAA focuses on fast visual anti aliasing effects rather than pursuing perfect real anti aliasing effects.
 * ```
 * //Configure relevant parameters
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

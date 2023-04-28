import { QuadGlsl_fs, QuadGlsl_vs } from '../assets/shader/glsl/Quad_glsl';
import { ShaderLib } from '../assets/shader/ShaderLib';
import { MeshRenderer } from '../components/renderer/MeshRenderer';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { UniformNode } from '../gfx/graphics/webGpu/core/uniforms/UniformNode';
import { WebGPUDescriptorCreator } from '../gfx/graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { GPUCompareFunction } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { RTFrame } from '../gfx/renderJob/frame/RTFrame';
import { BlendMode } from '../materials/BlendMode';
import { MaterialBase } from '../materials/MaterialBase';
import { Color } from '../math/Color';
import { PlaneGeometry } from '../shape/PlaneGeometry';

import { Object3D } from './entities/Object3D';
import { RendererPassState } from '../gfx/renderJob/passRenderer/state/RendererPassState';
import { Engine3D } from '../Engine3D';
import { GPUContext } from '../gfx/renderJob/GPUContext';
import { RendererType } from '../gfx/renderJob/passRenderer/state/RendererType';
import { View3D } from './View3D';
/**
 * @internal
 * @group Entity
 */
export class ViewQuad extends Object3D {
    width: number = 128;
    height: number = 128;
    quadRenderer: MeshRenderer;
    material: MaterialBase;
    uniforms: { [key: string]: UniformNode };
    rendererPassState: RendererPassState;

    constructor(vs: string = 'QuadGlsl_vs', fs: string = 'QuadGlsl_fs', rtFrame: RTFrame, shaderUniforms?: { [uniName: string]: UniformNode }, multisample: number = 0, f: boolean = false) {
        super();

        let renderTexture = rtFrame ? rtFrame.attachments : [];

        ShaderLib.register("QuadGlsl_vs", QuadGlsl_vs);
        ShaderLib.register("QuadGlsl_fs", QuadGlsl_fs);

        this.material = new MaterialBase();
        this.material.setShader(vs, fs);
        let shader = this.material.getShader();
        this.material.blendMode = BlendMode.NONE;
        let shaderState = shader.shaderState;
        shaderState.frontFace = `cw`;
        // shaderState.cullMode = `back`;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.always;
        shaderState.multisample = multisample;
        this.uniforms = shader.uniforms = shaderUniforms ? shaderUniforms : { color: new UniformNode(new Color()) };

        this.quadRenderer = this.addComponent(MeshRenderer);
        this.quadRenderer.material = this.material;
        this.quadRenderer.castGI = false;
        this.quadRenderer.castShadow = false;
        this.quadRenderer.drawType = f ? 2 : 0;
        // this.quadRenderer.renderOrder = 99999;
        this.quadRenderer.geometry = new PlaneGeometry(100, 100, 1, 1);
        this.quadRenderer[`__start`]();
        this.quadRenderer[`_enable`] = true;
        this.quadRenderer[`onEnable`]();
        this.colorTexture = Engine3D.res.blackTexture;

        shader.setUniformFloat(`x`, 0);
        shader.setUniformFloat(`y`, 0);
        shader.setUniformFloat(`width`, 100);
        shader.setUniformFloat(`height`, 100);

        // this.createRendererPassState(renderTargets, depth);
        // this.rendererPassState = WebGPUDescriptorPool.createRendererPassState(renderTargets, shaderState.multisample>0 ? false : true);
        this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(rtFrame, `load`);
        if (shaderState.multisample > 0) {
            this.rendererPassState.multisample = shaderState.multisample;
            this.rendererPassState.multiTexture = webGPUContext.device.createTexture({
                size: {
                    width: webGPUContext.presentationSize[0],
                    height: webGPUContext.presentationSize[1],
                },
                sampleCount: shaderState.multisample,
                format: renderTexture.length > 0 ? renderTexture[0].format : webGPUContext.presentationFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            })
        }
    }

    public set colorTexture(tex: Texture) {
        this.material.baseMap = tex;
    }

    /**
     * By inputting a map to viewQuad and setting corresponding 
     * processing shaders, the corresponding results are output for off-screen rendering
     * Can also be directly used as the final display rendering result rendering canvas
     * @param viewQuad 
     * @see ViewQuad
     * @param scene3D 
     * @see Scene3D
     * @param command 
     */
    public renderTarget(view: View3D, viewQuad: ViewQuad, command: GPUCommandEncoder) {
        let camera = view.camera;
        let encoder = GPUContext.beginRenderPass(command, viewQuad.rendererPassState);
        GPUContext.bindCamera(encoder, camera);
        viewQuad.quadRenderer.nodeUpdate(view, RendererType.COLOR, viewQuad.rendererPassState, null);
        viewQuad.quadRenderer.renderPass2(view, RendererType.COLOR, viewQuad.rendererPassState, null, encoder);
        GPUContext.endPass(encoder);
    }

    /**
     * Output to screen through screen based shading
     * @param viewQuad 
     * @see ViewQuad
     * @param scene3D 
     * @see Scene3D
     * @param command 
     * @param colorTexture 
     */
    public renderToViewQuad(view: View3D, viewQuad: ViewQuad, command: GPUCommandEncoder, colorTexture: Texture) {
        let camera = view.camera;
        viewQuad.colorTexture = colorTexture;
        let encoder = GPUContext.beginRenderPass(command, viewQuad.rendererPassState);
        GPUContext.bindCamera(encoder, camera);

        // viewQuad.x = view.viewPort.x;
        // viewQuad.y = view.viewPort.y;
        // viewQuad.scaleX = view.viewPort.width;
        // viewQuad.scaleY = view.viewPort.height;
        // viewQuad.transform.updateWorldMatrix(true);
        // encoder.setViewport(
        //     view.viewPort.x * webGPUContext.presentationSize[0],
        //     view.viewPort.y * webGPUContext.presentationSize[1],
        //     view.viewPort.width * webGPUContext.presentationSize[0],
        //     view.viewPort.height * webGPUContext.presentationSize[1],
        //     0.0, 1.0);
        // encoder.setScissorRect(
        //     view.viewPort.x * webGPUContext.presentationSize[0],
        //     view.viewPort.y * webGPUContext.presentationSize[0],
        //     view.viewPort.width * webGPUContext.presentationSize[0],
        //     view.viewPort.height * webGPUContext.presentationSize[1],
        // );

        // encoder.setScissorRect(view.viewPort.x, view.viewPort.y, 300, 150);
        // encoder.setViewport(view.viewPort.x, view.viewPort.y, view.viewPort.width / (view.viewPort.width / view.viewPort.height), view.viewPort.height, 0.0, 1.0);
        // encoder.setScissorRect(view.viewPort.x, view.viewPort.y, view.viewPort.width, view.viewPort.height);

        // encoder.setViewport(camera.viewPort.x, camera.viewPort.y, camera.viewPort.width, camera.viewPort.height, 0.0, 1.0);
        // encoder.setScissorRect(camera.viewPort.x, camera.viewPort.y, camera.viewPort.width, camera.viewPort.height);

        viewQuad.quadRenderer.nodeUpdate(view, RendererType.COLOR, viewQuad.rendererPassState, null);
        viewQuad.quadRenderer.renderPass2(view, RendererType.COLOR, viewQuad.rendererPassState, null, encoder);
        GPUContext.endPass(encoder);
    }
}

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
import { defaultRes } from '../textures/DefaultRes';
import { VirtualTexture } from '../textures/VirtualTexture';
import { Object3D } from './entities/Object3D';
import { RendererPassState } from '../gfx/renderJob/passRenderer/state/RendererPassState';
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
        this.colorTexture = defaultRes.blackTexture;

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
}

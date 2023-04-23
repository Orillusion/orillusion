import { ViewQuad } from '../../../core/ViewQuad';
import { Engine3D } from '../../../Engine3D';
import { Vector2 } from '../../../math/Vector2';
import { UniformNode } from '../../graphics/webGpu/core/uniforms/UniformNode';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { GPUContext } from '../GPUContext';
import { RTResourceConfig } from '../config/RTResourceConfig';
import { RTResourceMap } from '../frame/RTResourceMap';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
/**
 * HDRBloom泛光效果
 * ```
 *       //Configure relevant parameters
 *       let cfg = {@link Engine3D.setting.render.postProcessing.bloom};
 *         let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        
 *       
 *       Engine3D.startRender(renderJob);
 *```
 * @group Post Effects
 */
export class HDRBloomPost extends PostBase {
    private brightnessView: ViewQuad;
    private compositeView: ViewQuad;
    private blurList: { ql: ViewQuad; qr: ViewQuad }[];
    /**
     * @internal
     */
    public blurX: number = 1;
    /**
     * @internal
     */
    public blurY: number = 1;
    constructor() {
        super();
        Engine3D.setting.render.postProcessing.bloom.enable = true;

        this.blurX = Engine3D.setting.render.postProcessing.bloom.blurX;
        this.blurY = Engine3D.setting.render.postProcessing.bloom.blurY;

        let presentationSize = webGPUContext.presentationSize;
        let outTextures = this.createRTTexture('HDRBloomPost-outTextures', presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float, false);
        RTResourceMap.createRTTexture(RTResourceConfig.colorBufferTex_NAME, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float, false);

        {
            let brightnessTextures = this.createRTTexture('brightnessTextures', presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float, false);

            this.brightnessView = this.createViewQuad(`brightnessView`, `Bloom_Brightness_frag_wgsl`, brightnessTextures, {
                luminosityThreshold: new UniformNode(Engine3D.setting.render.postProcessing.bloom.brightness),
            });
        }

        let blurMip = 5;
        let sizeW = presentationSize[0];
        let sizeH = presentationSize[1];
        this.blurList = [];
        for (let i = 0; i < blurMip; i++) {
            let tex_l = this.createRTTexture(`tex_l${i}`, sizeW, sizeH, GPUTextureFormat.rgba16float);
            let tex_r = this.createRTTexture(`tex_r${i}`, sizeW, sizeH, GPUTextureFormat.rgba16float);

            let ql = this.createViewQuad(`ql${i}`, `Bloom_blur_frag_wgsl`, tex_l, {
                texSize: new UniformNode(new Vector2(sizeW * 2, sizeH * 2)),
                hScale: new UniformNode(i),
                vScale: new UniformNode(i),
                horizontal: new UniformNode(0.5),
            });

            let qr = this.createViewQuad(`qr${i}`, `Bloom_blur_frag_wgsl`, tex_r, {
                texSize: new UniformNode(new Vector2(sizeW * 2, sizeH * 2)),
                hScale: new UniformNode(i),
                vScale: new UniformNode(i),
                horizontal: new UniformNode(1.0),
            });

            this.blurList.push({
                ql: ql,
                qr: qr,
            });

            sizeW /= 2;
            sizeH /= 2;
        }

        {
            this.compositeView = this.createViewQuad(`compositeView`, `Bloom_composite_frag_wgsl`, outTextures, {
                bloomStrength: new UniformNode(Engine3D.setting.render.postProcessing.bloom.intensity),
                bloomRadius: new UniformNode(1),
            });
        }
    }

    onAttach(view: View3D): void {
        this.debug();
    }

    onDetach(view: View3D): void {
    }

    public debug() {
    }

    public get bloomStrength() {
        return this.compositeView.uniforms['bloomStrength'].value;
    }

    public set bloomStrength(value: number) {
        this.compositeView.uniforms['bloomStrength'].value = value;
    }

    public get bloomRadius() {
        return this.compositeView.uniforms['bloomRadius'].value;
    }

    public set bloomRadius(value: number) {
        this.compositeView.uniforms['bloomRadius'].value = value;
    }

    public get luminosityThreshold() {
        return this.brightnessView.uniforms['luminosityThreshold'].value;
    }

    public set luminosityThreshold(value: number) {
        this.brightnessView.uniforms['luminosityThreshold'].value = value;
    }

    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        // let command = GPUContext.beginCommandEncoder();
        {
            //获取上一个 color Texture 进行离屏幕渲染
            let colorTexture = this.getOutTexture();
            {
                GPUContext.renderToViewQuad(view, this.brightnessView, command, colorTexture);
            }
            {
                let tex = this.brightnessView.rendererPassState.renderTargets[0];
                for (let i = 0; i < this.blurList.length; i++) {
                    let ql = this.blurList[i].ql;
                    let qr = this.blurList[i].qr;

                    ql.material.renderShader.setUniformFloat(`horizontal`, 0.5);
                    ql.material.renderShader.setUniformFloat(`vScale`, i * this.blurX);

                    GPUContext.renderToViewQuad(view, ql, command, tex);
                    tex = ql.rendererPassState.renderTargets[0];

                    qr.material.renderShader.setUniformFloat(`horizontal`, 2.0);
                    qr.material.renderShader.setUniformFloat(`hScale`, i * this.blurY);

                    GPUContext.renderToViewQuad(view, qr, command, tex);
                    tex = qr.rendererPassState.renderTargets[0];
                }
            }

            {
                let shader = this.compositeView.material.renderShader;
                shader.setTexture(`blurTex1`, this.blurList[0].qr.rendererPassState.renderTargets[0]);
                shader.setTexture(`blurTex2`, this.blurList[1].qr.rendererPassState.renderTargets[0]);
                shader.setTexture(`blurTex3`, this.blurList[2].qr.rendererPassState.renderTargets[0]);
                shader.setTexture(`blurTex4`, this.blurList[3].qr.rendererPassState.renderTargets[0]);
                shader.setTexture(`blurTex5`, this.blurList[4].qr.rendererPassState.renderTargets[0]);

                // this.compositeView.material.blurTex5[1] = this.blurList[0].qr.rendererPassState.renderTargets[0];
                // this.compositeView.material.textures[2] = this.blurList[1].qr.rendererPassState.renderTargets[0];
                // this.compositeView.material.textures[3] = this.blurList[2].qr.rendererPassState.renderTargets[0];
                // this.compositeView.material.textures[4] = this.blurList[3].qr.rendererPassState.renderTargets[0];
                // this.compositeView.material.textures[5] = this.blurList[4].qr.rendererPassState.renderTargets[0];
                GPUContext.renderToViewQuad(view, this.compositeView, command, colorTexture);
            }
        }
        // GPUContext.endCommandEncoder(command);
    }
}

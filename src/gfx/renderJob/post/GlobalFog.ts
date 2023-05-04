import { GlobalFog_shader } from '../../../assets/shader/post/GlobalFog_shader';
import { ShaderLib } from '../../../assets/shader/ShaderLib';
import { ViewQuad } from '../../../core/ViewQuad';
import { Engine3D } from '../../../Engine3D';
import { Color } from '../../../math/Color';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { UniformNode } from '../../graphics/webGpu/core/uniforms/UniformNode';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
import { GBufferFrame } from '../frame/GBufferFrame';
/**
 * screen space fog
 * @group Post Effects
 */
export class GlobalFog extends PostBase {
    /**
     * @internal
     */
    viewQuad: ViewQuad;
    /**
     * @internal
     */
    rtTexture: VirtualTexture;
    constructor() {
        super();
        let globalFog = Engine3D.setting.render.postProcessing.globalFog;

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");

        let presentationSize = webGPUContext.presentationSize;

        ShaderLib.register("GlobalFog_shader", GlobalFog_shader);
        let shaderUniforms = {
            fogColor: new UniformNode(new Color(globalFog.fogColor.r, globalFog.fogColor.g, globalFog.fogColor.b, globalFog.fogColor.a)),
            fogType: new UniformNode(globalFog.fogType),
            height: new UniformNode(globalFog.height),
            start: new UniformNode(globalFog.start),
            end: new UniformNode(globalFog.end),
            density: new UniformNode(globalFog.density),
            ins: new UniformNode(globalFog.ins),
        };

        this.rtTexture = this.createRTTexture(`GlobalFog`, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float);
        this.viewQuad = this.createViewQuad(`GlobalFog`, 'GlobalFog_shader', this.rtTexture, shaderUniforms);

        let ptex = rtFrame.getPositionMap();
        let ntex = rtFrame.getNormalMap();
        this.setInputTexture(ptex, ntex);
    }

    /**
     * @internal
     */
    public onAttach(view: View3D,) {
        Engine3D.setting.render.postProcessing.globalFog.enable = true;
        if (Engine3D.setting.render.postProcessing.globalFog.debug) {
            this.debug();
        }
    }
    /**
     * @internal
     */
    public onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.globalFog.enable = false;
    }

    public debug() {
    }
    public set fogType(v: number) {
        this.viewQuad.uniforms['fogType'].value = v;
    }
    public get fogType() {
        return this.viewQuad.uniforms['fogType'].value;
    }
    public set height(v: number) {
        this.viewQuad.uniforms['height'].value = v;
    }
    public get height() {
        return this.viewQuad.uniforms['height'].value;
    }
    public set start(v: number) {
        this.viewQuad.uniforms['start'].value = v;
    }
    public get start() {
        return this.viewQuad.uniforms['start'].value;
    }
    public set end(v: number) {
        this.viewQuad.uniforms['end'].value = v;
    }
    public get end() {
        return this.viewQuad.uniforms['end'].value;
    }
    public set ins(v: number) {
        this.viewQuad.uniforms['ins'].value = v;
    }
    public get ins() {
        return this.viewQuad.uniforms['ins'].value;
    }
    public set density(v: number) {
        this.viewQuad.uniforms['density'].value = v;
    }
    public get density() {
        return this.viewQuad.uniforms['density'].value;
    }
    /**
     * @internal
     */
    public get fogColor(): Color {
        return this.viewQuad.uniforms['fogColor'].color;
    }
    /**
     * @internal
     */
    public set fogColor(value: Color) {
        this.viewQuad.uniforms['fogColor'].color = value;
        this.viewQuad.uniforms['fogColor'].onChange();
    }

    /**
     * @internal
     */
    public setInputTexture(positionMap: VirtualTexture, normalMap: VirtualTexture) {
        const renderShader = this.viewQuad.material.renderShader;
        renderShader.setTexture('positionMap', positionMap);
        renderShader.setTexture('normalMap', normalMap);
    }
    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        const renderShader = this.viewQuad.material.renderShader;
        renderShader.setTexture('colorMap', this.getOutTexture());
        this.viewQuad.renderTarget(view, this.viewQuad, command);
    }

}

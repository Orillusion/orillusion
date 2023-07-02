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
import { SkyRenderer } from '../../../components/renderer/SkyRenderer';
import { EntityCollect } from '../collect/EntityCollect';
import { GlobalFogSetting } from '../../../setting/post/GlobalFogSetting';
import { Texture } from '../../graphics/webGpu/core/texture/Texture';
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
    _globalFog: GlobalFogSetting;

    constructor() {
        super();
        let globalFog = this._globalFog = Engine3D.setting.render.postProcessing.globalFog;

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");

        let presentationSize = webGPUContext.presentationSize;

        ShaderLib.register("GlobalFog_shader", GlobalFog_shader);
        let shaderUniforms = {
            fogColor: new UniformNode(new Color(globalFog.fogColor.r, globalFog.fogColor.g, globalFog.fogColor.b, globalFog.fogColor.a)),
            fogType: new UniformNode(globalFog.fogType),
            fogHeightScale: new UniformNode(globalFog.fogHeightScale),
            start: new UniformNode(globalFog.start),
            end: new UniformNode(globalFog.end),
            density: new UniformNode(globalFog.density),
            ins: new UniformNode(globalFog.ins),
            falloff: new UniformNode(globalFog.falloff),
            rayLength: new UniformNode(globalFog.rayLength),
            scatteringExponent: new UniformNode(globalFog.scatteringExponent),
            dirHeightLine: new UniformNode(globalFog.dirHeightLine),
            skyFactor: new UniformNode(globalFog.skyFactor),
            skyRoughness: new UniformNode(globalFog.skyRoughness),
            overrideSkyFactor: new UniformNode(globalFog.overrideSkyFactor),
            isSkyHDR: new UniformNode(0),
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
    }
    /**
     * @internal
     */
    public onDetach(view: View3D,) {
        Engine3D.setting.render.postProcessing.globalFog.enable = false;
    }

    public set fogType(v: number) {
        this._globalFog.fogType = v;
        this.viewQuad.uniforms['fogType'].value = v;
    }
    public get fogType() {
        return this.viewQuad.uniforms['fogType'].value;
    }
    public set fogHeightScale(v: number) {
        this._globalFog.fogHeightScale = v;
        this.viewQuad.uniforms['fogHeightScale'].value = v;
    }
    public get fogHeightScale() {
        return this.viewQuad.uniforms['fogHeightScale'].value;
    }
    public set start(v: number) {
        this._globalFog.start = v;
        this.viewQuad.uniforms['start'].value = v;
    }
    public get start() {
        return this.viewQuad.uniforms['start'].value;
    }
    public set end(v: number) {
        this._globalFog.end = v;
        this.viewQuad.uniforms['end'].value = v;
    }
    public get end() {
        return this.viewQuad.uniforms['end'].value;
    }
    public set ins(v: number) {
        this._globalFog.ins = v;
        this.viewQuad.uniforms['ins'].value = v;
    }
    public get ins() {
        return this.viewQuad.uniforms['ins'].value;
    }
    public set density(v: number) {
        this._globalFog.density = v;
        this.viewQuad.uniforms['density'].value = v;
    }
    public get density() {
        return this.viewQuad.uniforms['density'].value;
    }
    public set skyRoughness(v: number) {
        this._globalFog.skyRoughness = v;
        this.viewQuad.uniforms['skyRoughness'].value = v;
    }
    public get skyRoughness() {
        return this.viewQuad.uniforms['skyRoughness'].value;
    }
    public set skyFactor(v: number) {
        this._globalFog.skyFactor = v;
        this.viewQuad.uniforms['skyFactor'].value = v;
    }
    public get skyFactor() {
        return this.viewQuad.uniforms['skyFactor'].value;
    }

    public set overrideSkyFactor(v: number) {
        this._globalFog.overrideSkyFactor = v;
        this.viewQuad.uniforms['overrideSkyFactor'].value = v;
    }
    public get overrideSkyFactor() {
        return this.viewQuad.uniforms['overrideSkyFactor'].value;
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
        this._globalFog.fogColor.copyFrom(value);
        this.viewQuad.uniforms['fogColor'].color = value;
        this.viewQuad.uniforms['fogColor'].onChange();
    }

    public set falloff(v: number) {
        this._globalFog.falloff = v;
        this.viewQuad.uniforms['falloff'].value = v;
    }

    public get falloff() {
        return this.viewQuad.uniforms['falloff'].value;
    }

    public set rayLength(v: number) {
        this._globalFog.rayLength = v;
        this.viewQuad.uniforms['rayLength'].value = v;
    }

    public get rayLength() {
        return this.viewQuad.uniforms['rayLength'].value;
    }

    public set scatteringExponent(v: number) {
        this._globalFog.scatteringExponent = v;
        this.viewQuad.uniforms['scatteringExponent'].value = v;
    }

    public get scatteringExponent() {
        return this.viewQuad.uniforms['scatteringExponent'].value;
    }

    public set dirHeightLine(v: number) {
        this._globalFog.dirHeightLine = v;
        this.viewQuad.uniforms['dirHeightLine'].value = v;
    }

    public get dirHeightLine() {
        return this.viewQuad.uniforms['dirHeightLine'].value;
    }

    /**
     * @internal
     */
    public setInputTexture(positionMap: VirtualTexture, normalMap: VirtualTexture) {
        const renderShader = this.viewQuad.material.renderShader;
        renderShader.setTexture('positionMap', positionMap);
        renderShader.setTexture('normalMap', normalMap);
        this._lastSkyTexture = this.getSkyTexture();
        renderShader.setTexture(`prefilterMap`, this._lastSkyTexture);
    }

    private _lastSkyTexture: Texture;
    private getSkyTexture(): Texture {
        let texture = Engine3D.res.defaultSky as Texture;
        if (EntityCollect.instance.sky instanceof SkyRenderer) {
            texture = EntityCollect.instance.sky.map;
        }
        return texture;
    }
    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        const renderShader = this.viewQuad.material.renderShader;
        let skyTexture = this.getSkyTexture();
        if (skyTexture != this._lastSkyTexture) {
            this._lastSkyTexture = skyTexture;
            renderShader.setTexture(`prefilterMap`, this._lastSkyTexture);
        }
        renderShader.setTexture('colorMap', this.getOutTexture());
        renderShader.setUniformFloat('isSkyHDR', skyTexture.isHDRTexture ? 1 : 0);
        this.viewQuad.renderTarget(view, this.viewQuad, command);
    }

}

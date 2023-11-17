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
            isSkyHDR: new UniformNode(0),
        };

        this.rtTexture = this.createRTTexture(`GlobalFog`, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float);
        this.viewQuad = this.createViewQuad(`GlobalFog`, 'GlobalFog_shader', this.rtTexture);
        let shader = this.viewQuad.quadShader;

        shader.setUniformColor("fogColor", new Color(globalFog.fogColor.r, globalFog.fogColor.g, globalFog.fogColor.b, globalFog.fogColor.a));
        shader.setUniform("fogType", globalFog.fogType);
        shader.setUniform("fogHeightScale", globalFog.fogHeightScale);
        shader.setUniform("start", globalFog.start);
        shader.setUniform("end", globalFog.end);
        shader.setUniform("density", globalFog.density);
        shader.setUniform("ins", globalFog.ins);
        shader.setUniform("falloff", globalFog.falloff);
        shader.setUniform("rayLength", globalFog.rayLength);
        shader.setUniform("scatteringExponent", globalFog.scatteringExponent);
        shader.setUniform("dirHeightLine", globalFog.dirHeightLine);
        shader.setUniform("skyFactor", globalFog.skyFactor);
        shader.setUniform("skyRoughness", globalFog.skyRoughness);
        shader.setUniform("overrideSkyFactor", globalFog.overrideSkyFactor);
        shader.setUniform("isSkyHDR", 0);

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
        this.viewQuad.quadShader.setUniform('fogType', v);
    }
    public get fogType() {
        return this._globalFog.fogType;
    }
    public set fogHeightScale(v: number) {
        this._globalFog.fogHeightScale = v;
        this.viewQuad.quadShader.setUniform('fogHeightScale', v);
    }
    public get fogHeightScale() {
        return this.viewQuad.quadShader.getUniform('fogHeightScale');
    }
    public set start(v: number) {
        this._globalFog.start = v;
        this.viewQuad.quadShader.setUniform('start', v);
    }
    public get start() {
        return this.viewQuad.quadShader.getUniform('start');
    }
    public set end(v: number) {
        this._globalFog.end = v;
        this.viewQuad.quadShader.setUniform('end', v);
    }
    public get end() {
        return this.viewQuad.quadShader.getUniform('end');
    }
    public set ins(v: number) {
        this._globalFog.ins = v;
        this.viewQuad.quadShader.setUniform('ins', v);
    }
    public get ins() {
        return this.viewQuad.quadShader.getUniform('ins');
    }
    public set density(v: number) {
        this._globalFog.density = v;
        this.viewQuad.quadShader.setUniform('density', v);
    }
    public get density() {
        return this.viewQuad.quadShader.getUniform('density');
    }
    public set skyRoughness(v: number) {
        this._globalFog.skyRoughness = v;
        this.viewQuad.quadShader.setUniform('skyRoughness', v);
    }
    public get skyRoughness() {
        return this._globalFog.skyRoughness;
    }
    public set skyFactor(v: number) {
        this._globalFog.skyFactor = v;
        this.viewQuad.quadShader.setUniform('skyFactor', v);
    }
    public get skyFactor() {
        return this._globalFog.skyFactor;
    }

    public set overrideSkyFactor(v: number) {
        this._globalFog.overrideSkyFactor = v;
        this.viewQuad.quadShader.setUniform('overrideSkyFactor', v);
    }
    public get overrideSkyFactor() {
        return this._globalFog.overrideSkyFactor;
    }

    /**
     * @internal
     */
    public get fogColor(): Color {
        return this._globalFog.fogColor;
    }

    /**
     * @internal
     */
    public set fogColor(value: Color) {
        this._globalFog.fogColor.copyFrom(value);
        this.viewQuad.quadShader.setUniformColor('fogColor', value);
    }

    public set falloff(v: number) {
        this._globalFog.falloff = v;
        this.viewQuad.quadShader.setUniform('falloff', v);
    }

    public get falloff() {
        return this.viewQuad.quadShader.getUniform('falloff');
    }

    public set rayLength(v: number) {
        this._globalFog.rayLength = v;
        this.viewQuad.quadShader.setUniform('rayLength', v);
    }

    public get rayLength() {
        return this._globalFog.rayLength;
    }

    public set scatteringExponent(v: number) {
        this._globalFog.scatteringExponent = v;
        this.viewQuad.quadShader.setUniform('scatteringExponent', v);
    }

    public get scatteringExponent() {
        return this._globalFog.scatteringExponent;
    }

    public set dirHeightLine(v: number) {
        this._globalFog.dirHeightLine = v;
        this.viewQuad.quadShader.setUniform('dirHeightLine', v);
    }

    public get dirHeightLine() {
        return this._globalFog.dirHeightLine;
    }

    /**
     * @internal
     */
    public setInputTexture(positionMap: VirtualTexture, normalMap: VirtualTexture) {
        const pass = this.viewQuad.quadShader;
        pass.setTexture('positionMap', positionMap);
        pass.setTexture('normalMap', normalMap);
        this._lastSkyTexture = this.getSkyTexture();
        pass.setTexture(`prefilterMap`, this._lastSkyTexture);
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
        const pass = this.viewQuad.quadShader;
        let skyTexture = this.getSkyTexture();
        if (skyTexture != this._lastSkyTexture) {
            this._lastSkyTexture = skyTexture;
            pass.setTexture(`prefilterMap`, this._lastSkyTexture);
        }
        pass.setTexture('colorMap', this.getOutTexture());
        pass.setUniformFloat('isSkyHDR', skyTexture.isHDRTexture ? 1 : 0);
        this.viewQuad.renderTarget(view, this.viewQuad, command);
    }

}

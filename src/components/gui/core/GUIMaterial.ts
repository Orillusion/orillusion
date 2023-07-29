import { Vector4 } from "../../..";
import { Engine3D } from "../../../Engine3D";
import { ShaderLib } from "../../../assets/shader/ShaderLib";
import { GPUCompareFunction, GPUCullMode } from "../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { BlendMode } from "../../../materials/BlendMode";
import { MaterialBase } from "../../../materials/MaterialBase";
import { registerMaterial } from "../../../materials/MaterialRegister";
import { Vector2 } from "../../../math/Vector2";
import { GUISpace } from "../GUIConfig";
import { GUIShader } from "./GUIShader";

/** 
 * material used in rendering GUI
 * @group GPU GUI
 */
export class GUIMaterial extends MaterialBase {
    private _scissorRect: Vector4;
    private _screenSize: Vector2 = new Vector2(1024, 768);
    private _scissorEnable: boolean = false;
    constructor(space: GUISpace) {
        super();

        ShaderLib.register('GUI_shader_view', GUIShader.GUI_shader_view);
        ShaderLib.register('GUI_shader_world', GUIShader.GUI_shader_world);

        let shaderKey: string = space == GUISpace.View ? 'GUI_shader_view' : 'GUI_shader_world';
        let shader = this.setShader(shaderKey, shaderKey);
        shader.setShaderEntry(`VertMain`, `FragMain`);

        shader.setUniformVector2('screenSize', this._screenSize);
        shader.setUniformVector2('guiSolution', this._screenSize);
        shader.setUniformVector4('scissorRect', new Vector4());
        shader.setUniformFloat('scissorCornerRadius', 0.0);
        shader.setUniformFloat('scissorFadeOutSize', 0.0);
        shader.setUniformFloat('limitVertex', 0);
        shader.setUniformFloat('pixelRatio', 1);

        let shaderState = shader.shaderState;
        // shaderState.useZ = false;
        shaderState.depthWriteEnabled = false;
        this.blendMode = BlendMode.ALPHA;
        this.depthCompare = space == GUISpace.View ? GPUCompareFunction.always : GPUCompareFunction.less_equal;
        this.cullMode = GPUCullMode.back;

        this.transparent = true;
        this.receiveEnv = false;
    }

    /**
    * Write effective vertex count (vertex index < vertexCount)
    */
    public setLimitVertex(vertexCount: number) {
        this.renderShader.setUniformFloat('limitVertex', vertexCount);
    }

    public setGUISolution(value: Vector2, pixelRatio: number) {
        this.renderShader.setUniformVector2('guiSolution', value);
        this.renderShader.setUniformFloat('pixelRatio', pixelRatio);
    }

    public setScissorRect(left: number, bottom: number, right: number, top: number) {
        this._scissorRect ||= new Vector4();
        this._scissorRect.set(left, bottom, right, top);
        this.renderShader.setUniformVector4('scissorRect', this._scissorRect);
    }

    public setScissorEnable(value: boolean) {
        if (this._scissorEnable != value) {
            this._scissorEnable = value;
            if (value) {
                this.renderShader.setDefine("SCISSOR_ENABLE", true);
            } else {
                this.renderShader.deleteDefine('SCISSOR_ENABLE');
            }
            this.renderShader.noticeStateChange();
        }
    }

    public setScissorCorner(radius: number, fadeOut: number) {
        this.renderShader.setUniformFloat('scissorCornerRadius', radius);
        this.renderShader.setUniformFloat('scissorFadeOutSize', fadeOut);
    }

    /**
     * Write screenSize size to the shader
     */
    public setScreenSize(width: number, height: number): this {
        this._screenSize.set(width, height);
        this.renderShader.setUniformVector2('screenSize', this._screenSize);
        return this;
    }

    /**
     * Update texture used in GUI
     */
    public setTextures(list: Texture[]) {
        for (let i = 0; i < 7; i++) {
            let texture = list[i] || Engine3D.res.whiteTexture;
            this.renderShader.setTexture(`tex_${i}`, texture);
            this.setVideoTextureDefine(i, texture.isVideoTexture);
        }
    }

    private _videoTextureFlags: { [key: string]: boolean } = {};
    private setVideoTextureDefine(i: number, isVideoTexture: boolean): void {
        let changed = false;
        if (isVideoTexture != this._videoTextureFlags[i]) {
            if (isVideoTexture) {
                this.renderShader.setDefine(`VideoTexture${i}`, true);
            } else {
                this.renderShader.deleteDefine(`VideoTexture${i}`);
            }
            this._videoTextureFlags[i] = isVideoTexture;
            changed = true;
        }

        if (changed) {
            this.renderShader.noticeStateChange();
        }

    }

    public set envMap(texture: Texture) { }
    public set shadowMap(texture: Texture) { }
    public set baseMap(texture: Texture) { }
    public set normalMap(value: Texture) { }
    public set emissiveMap(value: Texture) { }
    public set irradianceMap(value: Texture) { }
    public set irradianceDepthMap(value: Texture) { }
}

registerMaterial('GUIMaterial', GUIMaterial as any);

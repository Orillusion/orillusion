import { PassType, Shader } from "../../..";
import { Engine3D } from "../../../Engine3D";
import { ShaderLib } from "../../../assets/shader/ShaderLib";
import { GPUCompareFunction, GPUCullMode } from "../../../gfx/graphics/webGpu/WebGPUConst";
import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../../../gfx/graphics/webGpu/shader/RenderShaderPass";
import { BlendMode } from "../../../materials/BlendMode";
import { Material } from "../../../materials/Material";
import { Vector2 } from "../../../math/Vector2";
import { Vector4 } from "../../../math/Vector4";
import { GUISpace } from "../GUIConfig";
import { GUIShader } from "./GUIShader";

/** 
 * material used in rendering GUI
 * @group GPU GUI
 */
export class GUIMaterial extends Material {
    private _scissorRect: Vector4;
    private _screenSize: Vector2 = new Vector2(1024, 768);
    private _scissorEnable: boolean = false;
    constructor(space: GUISpace) {
        super();

        ShaderLib.register('GUI_shader_view', GUIShader.GUI_shader_view);
        ShaderLib.register('GUI_shader_world', GUIShader.GUI_shader_world);

        let newShader = new Shader();

        let shaderKey: string = space == GUISpace.View ? 'GUI_shader_view' : 'GUI_shader_world';
        let colorPass = new RenderShaderPass(shaderKey, shaderKey);
        colorPass.passType = PassType.COLOR;
        colorPass.setShaderEntry(`VertMain`, `FragMain`);

        colorPass.setUniformVector2('screenSize', this._screenSize);
        colorPass.setUniformVector2('guiSolution', this._screenSize);
        colorPass.setUniformVector4('scissorRect', new Vector4());
        colorPass.setUniformFloat('scissorCornerRadius', 0.0);
        colorPass.setUniformFloat('scissorFadeOutSize', 0.0);
        colorPass.setUniformFloat('pixelRatio', 1);
        colorPass.setUniformFloat('empty', 0);

        let shaderState = colorPass.shaderState;
        // shaderState.useZ = false;
        shaderState.depthWriteEnabled = false;
        colorPass.blendMode = BlendMode.ALPHA;
        colorPass.depthCompare = space == GUISpace.View ? GPUCompareFunction.always : GPUCompareFunction.less_equal;
        colorPass.cullMode = GPUCullMode.back;
        newShader.addRenderPass(colorPass);
        // colorPass.transparent = true;
        // colorPass.receiveEnv = false;

        this.shader = newShader;
    }

    public setGUISolution(value: Vector2, pixelRatio: number) {
        this.shader.setUniformVector2('guiSolution', value);
        this.shader.setUniformFloat('pixelRatio', pixelRatio);
    }

    public setScissorRect(left: number, bottom: number, right: number, top: number) {
        this._scissorRect ||= new Vector4();
        this._scissorRect.set(left, bottom, right, top);
        this.shader.setUniformVector4('scissorRect', this._scissorRect);
    }

    public setScissorEnable(value: boolean) {
        if (this._scissorEnable != value) {
            this._scissorEnable = value;
            if (value) {
                this.shader.setDefine("SCISSOR_ENABLE", true);
            } else {
                this.shader.deleteDefine('SCISSOR_ENABLE');
            }
            this.shader.noticeValueChange();
        }
    }

    public setScissorCorner(radius: number, fadeOut: number) {
        this.shader.setUniformFloat('scissorCornerRadius', radius);
        this.shader.setUniformFloat('scissorFadeOutSize', fadeOut);
    }

    /**
     * Write screenSize size to the shader
     */
    public setScreenSize(width: number, height: number): this {
        this._screenSize.set(width, height);
        this.shader.setUniformVector2('screenSize', this._screenSize);
        return this;
    }

    /**
     * Update texture used in GUI
     */
    public setTextures(list: Texture[]) {
        for (let i = 0; i < 7; i++) {
            let texture = list[i] || Engine3D.res.whiteTexture;
            this.shader.setTexture(`tex_${i}`, texture);
            this.setVideoTextureDefine(i, texture.isVideoTexture);
        }
    }

    private _videoTextureFlags: { [key: string]: boolean } = {};
    private setVideoTextureDefine(i: number, isVideoTexture: boolean): void {
        let changed = false;
        if (isVideoTexture != this._videoTextureFlags[i]) {
            if (isVideoTexture) {
                this.shader.setDefine(`VideoTexture${i}`, true);
            } else {
                this.shader.deleteDefine(`VideoTexture${i}`);
            }
            this._videoTextureFlags[i] = isVideoTexture;
            changed = true;
        }

        if (changed) {
            this.shader.noticeValueChange();
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


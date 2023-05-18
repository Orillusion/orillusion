import { MaterialBase, ShaderLib, Vector2, BlendMode, GPUCompareFunction, GPUCullMode, Texture, Engine3D, registerMaterial } from "../../..";
import { GUISpace } from "../GUIConfig";
import { GUIShader } from "./GUIShader";

/** 
 * material used in rendering GUI
 * @group GUI
 */
export class GUIMaterial extends MaterialBase {
    constructor(space: GUISpace) {
        super();

        ShaderLib.register('GUI_shader_view', GUIShader.GUI_shader_view);
        ShaderLib.register('GUI_shader_world', GUIShader.GUI_shader_world);

        let shaderKey: string = space == GUISpace.View ? 'GUI_shader_view' : 'GUI_shader_world';
        let shader = this.setShader(shaderKey, shaderKey);
        shader.setShaderEntry(`VertMain`, `FragMain`);

        shader.setUniformVector2('screen', new Vector2(1024, 1024));
        shader.setUniformVector2('mipmapRange', new Vector2(0, 10));

        let shaderState = shader.shaderState;
        // shaderState.useZ = false;
        shaderState.depthWriteEnabled = false;
        this.blendMode = BlendMode.ALPHA;
        this.depthCompare = space == GUISpace.View ? GPUCompareFunction.always : GPUCompareFunction.less_equal;
        this.cullMode = GPUCullMode.back;

        this.transparent = true;
        this.receiveEnv = false;
    }

    private _screenSizeVec2: Vector2 = new Vector2();

    /**
     * Write screen size to the shader
     */
    public setScreenSize(width: number, height: number) {
        this._screenSizeVec2.set(width, height);
        this.renderShader.setUniformVector2('screen', this._screenSizeVec2);
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
        if (isVideoTexture != this._videoTextureFlags[i]) {
            if (isVideoTexture) {
                this.renderShader.setDefine(`VideoTexture${i}`, true);
            } else {
                this.renderShader.deleteDefine(`VideoTexture${i}`);
            }
            this._videoTextureFlags[i] = isVideoTexture;
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

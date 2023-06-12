import { Color, Engine3D, MaterialBase, PhysicMaterial, ShaderLib, Vector2, Vector3, Vector4 } from "@orillusion/core";
import { SeaShader } from "../shader/SeaShader";
export class SeaMaterial extends MaterialBase {
    constructor() {
        super();

        ShaderLib.register(`seaShader`, SeaShader);

        this.setShader('seaShader', 'seaShader');
        let shader = this.getShader();
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setDefine("USE_BRDF", true);
        shader.setDefine("USE_NORMALFILPY", Engine3D.setting.material.normalYFlip);

        shader.setUniformColor(`sea_color`, new Color(0.9, 0.5, 0.5));
        shader.setUniformColor(`sea_base_color`, new Color(0.5, 0.95, 0.5));
        shader.setUniformVector2(`iResolution`, new Vector2(1024, 1024));

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;

        this.baseMap = Engine3D.res.whiteTexture;
        this.normalMap = Engine3D.res.normalTexture;
        this.emissiveMap = Engine3D.res.blackTexture;
    }


    private _sea_color: Color = new Color();
    public get sea_color() {
        return this._sea_color;
    }
    public set sea_color(value) {
        this._sea_color = value;
        this.renderShader.setUniformColor(`sea_color`, value);
    }
    private _sea_base_color: Color = new Color();
    public get sea_base_color() {
        return this._sea_base_color;
    }
    public set sea_base_color(value) {
        this._sea_base_color = value;
        this.renderShader.setUniformColor(`sea_base_color`, value);
    }
}
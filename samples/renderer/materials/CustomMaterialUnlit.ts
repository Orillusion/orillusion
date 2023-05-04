import { MaterialBase, ShaderLib, Engine3D, Color } from "@orillusion/core";
import CusomMaterialUnlitShader from "./CusomMaterialUnlitShader.wgsl?raw"

export class CustomMaterialUnlit extends MaterialBase {
    constructor() {
        super();

        ShaderLib.register("CusomMaterialUnlitShader", CusomMaterialUnlitShader);
        this.setShader("CusomMaterialUnlitShader", "CusomMaterialUnlitShader");
        this.renderShader.setShaderEntry(`VertMain`, `FragMain`)

        this.shaderState.useLight = false;
        this.shaderState.acceptGI = false;
        this.shaderState.castShadow = false;

        //warring must set baseMap
        this.renderShader.setTexture("baseMap", Engine3D.res.whiteTexture);

        this.baseColor = new Color(0.0, 1.0, 0.0, 1.0);
    }

    private _baseColor: Color;
    public get baseColor(): Color {
        return this._baseColor;
    }
    public set baseColor(value: Color) {
        this._baseColor = value;
        this.renderShader.setUniformColor("baseColor", value);
    }
}
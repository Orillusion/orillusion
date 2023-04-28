import { MaterialPass } from "../MaterialPass";

import OutlineShaderPass from "../../assets/shader/materials/OutlinePass.wgsl?raw"
import { GPUCompareFunction } from "../../gfx/graphics/webGpu/WebGPUConst";

import { Color } from "../../math/Color";
import { ShaderLib } from "../../assets/shader/ShaderLib";
import { Engine3D } from "../../Engine3D";

export class OutLinePass extends MaterialPass {
    constructor(lineWeight: number = 10) {
        super();

        ShaderLib.register("OutlineShaderPass", OutlineShaderPass);

        let shader = this.setShader(`OutlineShaderPass`, `OutlineShaderPass`);
        shader.setShaderEntry(`VertMain`, `FragMain`)
        shader.setUniformColor(`baseColor`, new Color(1.0, 0.0, 0.0));
        shader.setUniformFloat(`lineWeight`, lineWeight);

        let shaderState = shader.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.depthWriteEnabled = false;
        shaderState.depthCompare = GPUCompareFunction.always;
        // shaderState.blendMode = BlendMode.ADD ;

        shader.setTexture("baseMap", Engine3D.res.whiteTexture);
    }

    private _lineWeight: number = 0;
    public get lineWeight(): number {
        return this._lineWeight;
    }

    public set lineWeight(value: number) {
        this._lineWeight = value;
        this.renderShader.setUniformFloat("lineWeight", value);
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
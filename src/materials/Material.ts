import { BlendMode } from "..";
import { RenderShader } from "../gfx/graphics/webGpu/shader/RenderShader";
import { RendererType } from "../gfx/renderJob/passRenderer/state/RendererType";

export class Material {

    /**
      *
      * name of this material
      */
    public name: string;

    /**
     *
     * Material Unique Identifier
     */
    public instanceID: string;

    public enable: boolean = true;

    private _defaultPass: RenderShader;

    private _renderPasses: Map<RendererType, RenderShader[]>;

    private _depthCompare: GPUCompareFunction;

    constructor() {
        this._renderPasses = new Map<RendererType, RenderShader[]>();
    }

    public get depthCompare(): GPUCompareFunction {
        return this._depthCompare;
    }

    public set depthCompare(value: GPUCompareFunction) {
        this._depthCompare = value;
        this._defaultPass.depthCompare = value;
    }

    public get defaultPass(): RenderShader {
        return this._defaultPass;
    }

    public set defaultPass(value: RenderShader) {
        this._defaultPass = value;
        this.addPass(RendererType.COLOR, value);
    }

    public get doubleSide(): boolean {
        return this._defaultPass.doubleSide;
    }

    public set doubleSide(value: boolean) {
        this._defaultPass.doubleSide = value;
    }

    public get castShadow(): boolean {
        let colorPass = this.defaultPass;
        return colorPass.shaderState.castShadow;
    }

    public set castShadow(value: boolean) {
        let colorPass = this.defaultPass;
        colorPass.shaderState.castShadow = value;
    }

    public get blendMode(): BlendMode {
        let colorPass = this.defaultPass;
        return colorPass.blendMode;
    }

    public set blendMode(value: BlendMode) {
        let colorPass = this.defaultPass;
        colorPass.blendMode = value;
    }


    public get transparent(): boolean {
        let colorPass = this.defaultPass;
        return colorPass.shaderState.transparent;
    }

    public set transparent(value: boolean) {
        let colorPass = this.defaultPass;
        colorPass.shaderState.transparent = value;
    }

    public get cullMode(): GPUCullMode {
        let colorPass = this.defaultPass;
        return colorPass.cullMode;
    }

    public set cullMode(value: GPUCullMode) {
        let colorPass = this.defaultPass;
        colorPass.cullMode = value;
    }

    /**
     * @param passType 
     * @returns 
     */
    public hasPass(passType: RendererType) {
        return this._renderPasses.has(passType);
    }

    /**
     * get render pass by renderType
     * @param passType 
     * @returns 
     */
    public getPass(passType: RendererType) {
        return this._renderPasses.get(passType);
    }

    /**
     * get all color render pass
     * @returns 
     */
    public getAllPass(): RenderShader[] {
        return this._renderPasses.get(RendererType.COLOR);
    }

    public addPass(passType: RendererType, pass: RenderShader, index: number = -1): RenderShader[] {
        if (!this._renderPasses.has(passType)) this._renderPasses.set(passType, []);

        let passList = this._renderPasses.get(passType);
        if (passType == RendererType.COLOR && passList.length == 0) {
            this._defaultPass = pass;
        }

        let has = passList.indexOf(pass) != -1;
        if (!has) {
            if (index == -1) {
                passList.push(pass);
            } else {
                passList.splice(index, -1, pass);
            }
        }
        return passList;
    }

    public removePass(passType: RendererType, index: number) {
        if (this._renderPasses.has(passType)) {
            let list = this._renderPasses.get(passType);
            if (index < list.length) {
                list.splice(index, 1);
            }
        }
    }

    /**
     * clone one material
     * @returns Material
     */
    public clone() {
        return null;
    }

    destroy(force: boolean) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                for (const textureName in pass.textures) {
                    if (textureName.indexOf("defaultOri") == -1) {
                        let texture = pass.textures[textureName];
                        texture.destroy(force);
                    }
                }
            }
        }
    }
}
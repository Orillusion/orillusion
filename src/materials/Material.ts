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

    public renderPasses: Map<RendererType, RenderShader[]>;

    public transparent: any;

    public sort: number;



    public enable: number;
    public blendMode: BlendMode;


    protected defaultPass: RenderShader;


    constructor() {
        this.renderPasses = new Map<RendererType, RenderShader[]>();
    }

    public get castShadow(): boolean {
        let colorPass = this.renderPasses.get(RendererType.COLOR)[0];
        return colorPass.shaderState.castShadow;
    }
    public set castShadow(value: boolean) {
        let colorPass = this.renderPasses.get(RendererType.COLOR)[0];
        colorPass.shaderState.castShadow = value;
    }

    /**
     * @param passType 
     * @returns 
     */
    public hasPass(passType: RendererType) {
        return this.renderPasses.has(passType);
    }

    public getPass(passType: RendererType) {
        return this.renderPasses.get(passType);
    }

    public addPass(passType: RendererType, pass: RenderShader, index: number = -1): RenderShader[] {
        if (!this.renderPasses.has(passType)) this.renderPasses.set(passType, []);

        let passList = this.renderPasses.get(passType);

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
        if (this.renderPasses.has(passType)) {
            let list = this.renderPasses.get(passType);
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
        throw new Error("Method not implemented.");
    }
}
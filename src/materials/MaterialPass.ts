import { GPUCullMode } from "../gfx/graphics/webGpu/WebGPUConst";
import { RenderShader } from "../gfx/graphics/webGpu/shader/RenderShader";
import { RendererType } from "../gfx/renderJob/passRenderer/state/RendererType";
import { BlendMode } from "./BlendMode";

export class MaterialPass {

    public renderPasses: Map<RendererType, MaterialPass[]>;

    /**
     * whether the pass is enable
     */
    public enable: boolean = true;

    public renderShader: RenderShader;

    private _shaderID: string;

    private _sort: number = 3000;

    private _transparent: boolean = false;

    public get sort(): number {
        return this._sort;
    }

    public set sort(value: number) {
        this._sort = value;
    }

    public get shaderID(): string {
        return this._shaderID;
    }

    public set shaderID(value: string) {
        this._shaderID = value;
    }

    public setShader(vs: string, fs: string) {
        this._shaderID = RenderShader.createShader(vs, fs);
        this.renderShader = this.getShader();
        this.renderShader.setDefault();
        return this.renderShader;
    }

    public getShader() {
        return RenderShader.getShader(this._shaderID);
    }

    /**
     * Get blend mode, see {@link BlendMode}
     */
    public get blendMode(): BlendMode {
        return this.renderShader.blendMode;
    }

    /**
     * Set blend mode, see {@link BlendMode}
     */
    public set blendMode(value: BlendMode) {
        this.renderShader.blendMode = value;
        // this.transparent = value != BlendMode.NONE && value != BlendMode.NORMAL;
    }

    /**
     * Get whether use transparent mode to render
     */
    public get transparent(): boolean {
        return this._transparent;
    }

    /**
     * Set whether use transparent mode to render
     */
    public set transparent(value: boolean) {
        this._transparent = value;
    }

    /**
     * Return GPUFrontFace
     */
    public get frontFace(): GPUFrontFace {
        return this.renderShader.frontFace;
    }

    /**
     * Set GPUFrontFace
     */
    public set frontFace(value: GPUFrontFace) {
        this.renderShader.frontFace = value;
    }

    /**
     * Get whether use double side to render object
     */
    public get doubleSide(): boolean {
        return this.renderShader.cullMode == GPUCullMode.none;
    }

    /**
     * Set whether use double side to render object
     */
    public set doubleSide(value: boolean) {
        this.renderShader.cullMode = value ? GPUCullMode.none : this.renderShader.cullMode;
    }

    /**
     * get cull mode, see {@link GPUCullMode}
     */
    public get cullMode(): GPUCullMode {
        return this.renderShader.cullMode;
    }

    /**
     * set cull mode, see {@link GPUCullMode}
     */
    public set cullMode(value: GPUCullMode) {
        this.renderShader.cullMode = value ? value : this.renderShader.cullMode;
    }

    public get depthBias(): number {
        return this.renderShader.depthBias;
    }

    public set depthBias(value: number) {
        this.renderShader.depthBias = value;
    }

    /**
     * get depth compare mode, see {@link GPUCompareFunction}
     */
    public get depthCompare(): GPUCompareFunction {
        return this.renderShader.depthCompare;
    }

    /**
     * set depth compare mode, see {@link GPUCompareFunction}
     */
    public set depthCompare(value: GPUCompareFunction) {
        this.renderShader.depthCompare = value ? value : this.renderShader.depthCompare;
    }

    /**
     * release material pass
     */
    public destroy() {
        this.renderShader.destroy();
        this.renderShader = null;

        this.renderPasses.forEach((v, k) => {
            for (let i = 0; i < v.length; i++) {
                const pass = v[i];
                pass.destroy();
            }
            v.length = 0;
        });
        this.renderPasses.clear();
        this.renderPasses = null;
    }

    public clone(): MaterialPass {
        return null;
    }

    debug() {
        throw new Error('Method not implemented.');
    }
}
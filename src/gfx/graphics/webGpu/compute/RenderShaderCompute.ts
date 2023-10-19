import { Shader } from "../../../..";
import { ComputeShader } from "../shader/ComputeShader";

export class RenderShaderCompute {

    protected sourceShader: Shader;
    protected compute: ComputeShader;

    protected needUpdate: boolean = true;

    constructor(shaderStr: string, sourceShader: Shader) {
        this.sourceShader = sourceShader;
        this.compute = new ComputeShader(shaderStr);
        this.init();
    }

    protected init() {

    }

    protected onOnce?()

    protected onFrame?()

    public onUpdate() {
        if (this.onFrame) {
            this.onFrame();
        }

        if (this.onOnce && this.needUpdate) {
            this.needUpdate = false;
            this.onFrame();
        }
    }
}
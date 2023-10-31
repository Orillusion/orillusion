import { PoolNode, RenderShaderPass } from "../../..";

export class PipelinePool {
    private static pipelineMap: Map<string, GPURenderPipeline> = new Map<string, GPURenderPipeline>();

    public static getSharePipeline(shaderVariant: string) {
        let pipeline = this.pipelineMap.get(shaderVariant);
        if (pipeline) {
            return pipeline;
        } else {
            return null;
        }
    }

    public static setSharePipeline(shaderVariant: string, pipeline: GPURenderPipeline) {
        this.pipelineMap.set(shaderVariant, pipeline);
    }
}
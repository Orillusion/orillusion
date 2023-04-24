import { WebGPUDescriptorCreator } from "../../graphics/webGpu/descriptor/WebGPUDescriptorCreator";
import { GPUContext } from "../GPUContext";
import { RTFrame } from "../frame/RTFrame";
import { RendererPassState } from "./state/RendererPassState";

export class RenderContext {
    public command: GPUCommandEncoder;
    public encoder: GPURenderPassEncoder;
    private rendererPassStates: RendererPassState[];
    private rtFrame: RTFrame;

    constructor(rtFrame: RTFrame) {
        this.rtFrame = rtFrame;

        this.rendererPassStates = [];
    }

    public clean() {
        this.rendererPassStates.length = 0;
        GPUContext.cleanCache();
    }

    /**
     * continue renderer pass state
     * @returns 
     */
    public beginContinueRendererPassState() {
        if (this.rendererPassStates.length > 0) {
            let splitRtFrame = this.rtFrame.clone();
            for (const iterator of splitRtFrame.rtDescriptors) {
                iterator.loadOp = `load`;
                // iterator.storeOp = `discard`;
            }
            splitRtFrame.depthLoadOp = "load";
            let splitRendererPassState = WebGPUDescriptorCreator.createRendererPassState(splitRtFrame);
            this.rendererPassStates.push(splitRendererPassState);
            return splitRendererPassState;
        } else {
            let splitRendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame);
            this.rendererPassStates.push(splitRendererPassState);
            return splitRendererPassState;
        }
    }

    public get rendererPassState() {
        return this.rendererPassStates[this.rendererPassStates.length - 1];
    }

    public beginRenderPass() {
        this.beginContinueRendererPassState();
        this.begineNewCommand();
        this.beginNewEncoder();
    }

    public endRenderPass() {
        this.endEncoder();
        this.endCommand();
    }

    public begineNewCommand(): GPUCommandEncoder {
        this.command = GPUContext.beginCommandEncoder();
        return this.command;
    }

    public endCommand() {
        GPUContext.endCommandEncoder(this.command);
        this.command = null;
    }

    public beginNewEncoder() {
        this.encoder = GPUContext.beginRenderPass(this.command, this.rendererPassState);
        return this.encoder;
    }

    public endEncoder() {
        GPUContext.endPass(this.encoder);
        this.encoder = null;
    }

}
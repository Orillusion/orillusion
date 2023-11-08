import { RenderTexture } from "../../..";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../graphics/webGpu/descriptor/RTDescriptor";
import { RTFrame } from "./RTFrame";

export class ProbeGBufferFrame extends RTFrame {

    constructor(rtWidth: number, rtHeight: number, autoResize: boolean = true) {
        super([], []);
        this.crateGBuffer(rtWidth, rtHeight, autoResize);
    }

    crateGBuffer(rtWidth: number, rtHeight: number, autoResize: boolean) {
        let attachments = this.renderTargets;
        let rtDescriptors = this.rtDescriptors;
        let positionMap = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false, undefined, 1, 0, true, autoResize);
        positionMap.name = `positionMap`;
        let posDec = new RTDescriptor();
        posDec.loadOp = `load`;

        let normalMap = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false, undefined, 1, 0, true, autoResize);
        normalMap.name = `normalMap`;
        let normalDec = new RTDescriptor();
        normalDec.loadOp = `load`;

        let colorMap = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false, undefined, 1, 0, true, autoResize);
        colorMap.name = `colorMap`;
        let colorDec = new RTDescriptor();
        colorDec.loadOp = `load`;

        let depthTexture = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.depth24plus, false, undefined, 1, 0, true, autoResize);
        depthTexture.name = `depthTexture`;
        let depthDec = new RTDescriptor();
        depthDec.loadOp = `load`;

        attachments.push(positionMap);
        attachments.push(normalMap);
        attachments.push(colorMap);

        rtDescriptors.push(posDec);
        rtDescriptors.push(normalDec);
        rtDescriptors.push(colorDec);

        this.depthTexture = depthTexture;
    }
}
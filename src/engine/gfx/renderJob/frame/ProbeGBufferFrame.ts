import { VirtualTexture } from "../../../textures/VirtualTexture";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../graphics/webGpu/descriptor/RTDescriptor";
import { RTResourceConfig } from "../config/RTResourceConfig";
import { RTFrame } from "./RTFrame";
import { RTResourceMap } from "./RTResourceMap";

export class ProbeGBufferFrame extends RTFrame {

    constructor(rtWidth: number, rtHeight: number) {
        super([], []);
        this.crateGBuffer(rtWidth, rtHeight);
    }

    crateGBuffer(rtWidth: number, rtHeight: number) {
        let attachments = this.attachments;
        let rtDescripts = this.rtDescriptors;
        let positionMap = new VirtualTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        positionMap.name = `positionMap`;
        let posDec = new RTDescriptor();
        posDec.loadOp = `load`;

        let normalMap = new VirtualTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        normalMap.name = `normalMap`;
        let normalDec = new RTDescriptor();
        normalDec.loadOp = `load`;

        let colorMap = new VirtualTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        colorMap.name = `colorMap`;
        let colorDec = new RTDescriptor();
        colorDec.loadOp = `load`;

        let depthTexture = new VirtualTexture(rtWidth, rtHeight, GPUTextureFormat.depth24plus, false);
        depthTexture.name = `depthTexture`;
        let depthDec = new RTDescriptor();
        depthDec.loadOp = `load`;

        attachments.push(positionMap);
        attachments.push(normalMap);
        attachments.push(colorMap);

        rtDescripts.push(posDec);
        rtDescripts.push(normalDec);
        rtDescripts.push(colorDec);

        this.depthTexture = depthTexture;
    }
}
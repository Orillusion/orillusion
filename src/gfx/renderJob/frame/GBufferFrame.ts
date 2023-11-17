
import { RenderTexture } from "../../../textures/RenderTexture";
import { webGPUContext } from "../../graphics/webGpu/Context3D";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../graphics/webGpu/descriptor/RTDescriptor";
import { RTResourceConfig } from "../config/RTResourceConfig";
import { RTFrame } from "./RTFrame";
import { RTResourceMap } from "./RTResourceMap";

export class GBufferFrame extends RTFrame {
    public static gBufferMap: Map<string, GBufferFrame> = new Map<string, GBufferFrame>();
    public static bufferTexture: boolean = false;
    constructor() {
        super([], []);
    }

    crateGBuffer(key: string, rtWidth: number, rtHeight: number) {
        let attachments = this.renderTargets;
        let reDescriptors = this.rtDescriptors;
        let colorBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.colorBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        let positionBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.positionBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        let normalBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.normalBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba8unorm, false);
        let materialBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.materialBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba8unorm, false);

        if (GBufferFrame.bufferTexture) {
            attachments.push(colorBufferTex);
            attachments.push(positionBufferTex);
            attachments.push(normalBufferTex);
            attachments.push(materialBufferTex);
        }

        let colorRTDes = new RTDescriptor();
        colorRTDes.loadOp = `clear`;

        let depthTexture = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.depth24plus, false);
        depthTexture.name = `depthTexture`;
        let depthDec = new RTDescriptor();
        depthDec.loadOp = `load`;
        this.depthTexture = depthTexture;

        if (GBufferFrame.bufferTexture) {
            reDescriptors.push(colorRTDes);
            reDescriptors.push(new RTDescriptor());
            reDescriptors.push(new RTDescriptor());
            reDescriptors.push(new RTDescriptor());
        }
    }

    public getColorMap() {
        return this.renderTargets[0];
    }

    public getPositionMap() {
        return this.renderTargets[1];
    }

    public getNormalMap() {
        return this.renderTargets[2];
    }

    public getMaterialMap() {
        return this.renderTargets[3];
    }

    /**
     * @internal
     */
    public static getGBufferFrame(key: string): GBufferFrame {
        let gBuffer: GBufferFrame;
        if (!GBufferFrame.gBufferMap.has(key)) {
            gBuffer = new GBufferFrame();
            let size = webGPUContext.presentationSize;
            gBuffer.crateGBuffer(key, size[0], size[1]);
            GBufferFrame.gBufferMap.set(key, gBuffer);
        } else {
            gBuffer = GBufferFrame.gBufferMap.get(key);
        }
        return gBuffer;
    }

    public clone() {
        let gBufferFrame = new GBufferFrame();
        this.clone2Frame(gBufferFrame);
        return gBufferFrame;
    }
}
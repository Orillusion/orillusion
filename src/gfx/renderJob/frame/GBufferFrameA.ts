
import { Engine3D } from "../../..";
import { RenderTexture } from "../../../textures/RenderTexture";
import { webGPUContext } from "../../graphics/webGpu/Context3D";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../graphics/webGpu/descriptor/RTDescriptor";
import { RTResourceConfig } from "../config/RTResourceConfig";
import { RTFrame } from "./RTFrame";
import { RTResourceMap } from "./RTResourceMap";

export class GBufferFrameA extends RTFrame {
    public static gBufferMap: Map<string, GBufferFrameA> = new Map<string, GBufferFrameA>();
    public static bufferTexture: boolean = false;
    constructor() {
        super([], []);
    }

    crateGBuffer(key: string, rtWidth: number, rtHeight: number) {
        let attachments = this.renderTargets;
        let reDescriptors = this.rtDescriptors;
        let colorBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.colorBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        let positionBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.positionBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        let normalBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.normalBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        let materialBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.materialBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba16float, false);
        let compressGBufferTex = RTResourceMap.createRTTexture(key + RTResourceConfig.compressGBufferTex_NAME, rtWidth, rtHeight, GPUTextureFormat.rgba32float, false);

        let useCompressGBuffer = Engine3D.setting.render.useCompressGBuffer;
        if (GBufferFrameA.bufferTexture) {
            if (useCompressGBuffer) {
                // attachments.push(colorBufferTex);
                // attachments.push(positionBufferTex);
                // attachments.push(normalBufferTex);
                attachments.push(compressGBufferTex);
            } else {
                attachments.push(colorBufferTex);
                attachments.push(positionBufferTex);
                attachments.push(normalBufferTex);
                attachments.push(materialBufferTex);
            }
        }

        let colorRTDes = new RTDescriptor();
        colorRTDes.loadOp = `clear`;

        let compressGBufferRTDes: RTDescriptor;
        if (useCompressGBuffer) {
            compressGBufferRTDes = new RTDescriptor();
            compressGBufferRTDes.loadOp = `clear`;
        }

        let depthTexture = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.depth24plus, false);
        depthTexture.name = `depthTexture`;

        let depthDec = new RTDescriptor();
        depthDec.loadOp = `load`;

        this.depthTexture = depthTexture;

        if (GBufferFrameA.bufferTexture) {
            if (useCompressGBuffer) {
                // reDescriptors.push(colorRTDes);
                // reDescriptors.push(new RTDescriptor());
                // reDescriptors.push(new RTDescriptor());
                reDescriptors.push(compressGBufferRTDes);
            } else {
                reDescriptors.push(colorRTDes);
                reDescriptors.push(new RTDescriptor());
                reDescriptors.push(new RTDescriptor());
                reDescriptors.push(new RTDescriptor());
            }
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

    public getAlbedoMap() {
        return this.renderTargets[3];
    }


    /**
     * @internal
     */
    public static getGBufferFrame(key: string): GBufferFrameA {
        let gBuffer: GBufferFrameA;
        if (!GBufferFrameA.gBufferMap.has(key)) {
            gBuffer = new GBufferFrameA();
            let size = webGPUContext.presentationSize;
            gBuffer.crateGBuffer(key, size[0], size[1]);
            GBufferFrameA.gBufferMap.set(key, gBuffer);
        } else {
            gBuffer = GBufferFrameA.gBufferMap.get(key);
        }
        return gBuffer;
    }

    public clone() {
        let gBufferFrame = new GBufferFrameA();
        this.clone2Frame(gBufferFrame);
        return gBufferFrame;
    }
}
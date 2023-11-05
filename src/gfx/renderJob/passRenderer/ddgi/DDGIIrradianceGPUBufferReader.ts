import { Engine3D } from "../../../../Engine3D";
import { CEvent } from "../../../../event/CEvent";
import { CEventDispatcher } from "../../../../event/CEventDispatcher";
import { RenderTexture } from "../../../../textures/RenderTexture";
import { webGPUContext } from "../../../graphics/webGpu/Context3D";
import { GPUContext } from "../../GPUContext";
import { DDGIProbeRenderer, GIRenderCompleteEvent, GIRenderStartEvent } from "./DDGIProbeRenderer";

export let IrradianceDataReaderCompleteEvent: CEvent = new CEvent('IrradianceDataReaderCompleteEvent');
export class DDGIIrradianceGPUBufferReader extends CEventDispatcher {
    private readFlag = false;
    private probeRenderer: DDGIProbeRenderer;
    private opColorBuffer: GPUBuffer;
    private opDepthBuffer: GPUBuffer;
    private srcColorMap: RenderTexture;
    private srcDepthMap: RenderTexture;

    public opDepthArray: Float32Array;
    public opColorArray: Float32Array;

    public initReader(probeRender: DDGIProbeRenderer, colorMap: RenderTexture, depthMap: RenderTexture) {
        this.probeRenderer = probeRender;
        this.srcColorMap = colorMap;
        this.srcDepthMap = depthMap;
        let giSetting = Engine3D.setting.gi;
        let pixelCount = giSetting.octRTMaxSize * giSetting.octRTMaxSize;

        this.opColorBuffer = webGPUContext.device.createBuffer({
            size: pixelCount * 4 * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            mappedAtCreation: false,
        });
        this.opColorArray = new Float32Array(pixelCount * 4);

        this.opDepthBuffer = webGPUContext.device.createBuffer({
            size: pixelCount * 4 * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            mappedAtCreation: false,
        });
        this.opDepthArray = new Float32Array(pixelCount * 4);

        //listener
        this.probeRenderer.addEventListener(
            GIRenderCompleteEvent.type,
            () => {
                this.onProbeRenderComplete();
            },
            this,
        );

        //listener
        this.probeRenderer.addEventListener(
            GIRenderStartEvent.type,
            () => {
                console.log('GIRenderStartEvent');
            },
            this,
        );
    }

    private async onProbeRenderComplete() {
        console.log('GIRenderCompleteEvent');
        if (!this.readFlag) {
            this.readFlag = true;
            let startTime = Date.now();
            console.log('irradianceDataReader start reading ');

            await DDGIIrradianceGPUBufferReader.read(this.srcColorMap.getGPUTexture(), this.opColorBuffer, this.opColorArray);
            await DDGIIrradianceGPUBufferReader.read(this.srcDepthMap.getGPUTexture(), this.opDepthBuffer, this.opDepthArray);
            this.readFlag = false;
            console.log('process time :', Date.now() - startTime);
            console.log('irradianceDataReader read complete');
            this.dispatchEvent(IrradianceDataReaderCompleteEvent);
        } else {
            console.log('irradianceDataReader is reading yet!!!');
        }
    }

    private static async read(srcTexture: GPUTexture, dstBuffer: GPUBuffer, output: Float32Array) {
        let command = GPUContext.beginCommandEncoder();
        command.copyTextureToBuffer({ texture: srcTexture }, { buffer: dstBuffer, bytesPerRow: srcTexture.width * 16 }, [srcTexture.width, srcTexture.height]);
        GPUContext.endCommandEncoder(command);

        await dstBuffer.mapAsync(GPUMapMode.READ);
        const copyArrayBuffer = dstBuffer.getMappedRange();
        output.set(new Float32Array(copyArrayBuffer), 0);
        dstBuffer.unmap();
    }
}

export let irradianceDataReader: DDGIIrradianceGPUBufferReader = new DDGIIrradianceGPUBufferReader();

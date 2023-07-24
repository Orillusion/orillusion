import { webGPUContext } from '../../Context3D';
import { ArrayBufferData } from './ArrayBufferData';
import { GPUBufferBase } from './GPUBufferBase';
import { GPUBufferType } from './GPUBufferType';
/**
 * The buffer of the storage class
 * written in the computer shader or CPU Coder
 * usage GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST 
 * @group GFX
 */
export class MatrixGPUBuffer extends GPUBufferBase {

    private mapAsyncBuffersOutstanding = 0;
    private mapAsyncReady: GPUBuffer[];

    constructor(size: number, usage: number = 0, data?: ArrayBufferData) {
        super();
        this.bufferType = GPUBufferType.StorageGPUBuffer;
        this.mapAsyncReady = [];
        this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | usage, size, data);
    }

    public writeToGpu(mapAsyncArray: Float32Array) {
        // Upload data using mapAsync and a queue of staging buffers.
        let device = webGPUContext.device;
        if (mapAsyncArray.length > 0) {
            // if (this.mapAsyncBufferSize != mapAsyncArray.byteLength) {
            //     this.mapAsyncBufferSize = mapAsyncArray.byteLength;
            //     if (this.buffer) this.buffer.destroy();
            //     this.buffer = device.createBuffer({ size: mapAsyncArray.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
            // }
            let buffer: GPUBuffer = null;
            while (this.mapAsyncReady.length) {
                buffer = this.mapAsyncReady.shift();
                if (buffer['usedSize'] == mapAsyncArray.byteLength)
                    break;
                buffer.destroy();
                this.mapAsyncBuffersOutstanding--;
                buffer = null;
            }
            if (!buffer) {
                buffer = device.createBuffer({
                    size: mapAsyncArray.byteLength,
                    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
                    mappedAtCreation: true,
                });
                buffer['usedSize'] = mapAsyncArray.byteLength;
                this.mapAsyncBuffersOutstanding++;
                if (this.mapAsyncBuffersOutstanding > 10) {
                    // ${(this.mapAsync.value * this.mapAsyncBuffersOutstanding).toFixed(2)}
                    console.warn(` Warning: mapAsync requests from ${this.mapAsyncBuffersOutstanding} frames ago have not resolved yet.  MB of staging buffers allocated.`);
                }
            }
            new Float32Array(buffer.getMappedRange()).set(mapAsyncArray);
            buffer.unmap();
            const commandEncoder = device.createCommandEncoder();
            commandEncoder.copyBufferToBuffer(buffer, 0, this.buffer, 0, mapAsyncArray.byteLength);
            // TODO: combine this submit with the main one, but we'll have to delay calling mapAsync until after the submit.
            device.queue.submit([commandEncoder.finish()]);
            // TODO: use this data during rendering.
            buffer.mapAsync(GPUMapMode.WRITE).then(() => this.mapAsyncReady.push(buffer));
        }
    }
}


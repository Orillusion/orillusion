import { GPUBufferBase } from './GPUBufferBase';
import { GPUBufferType } from './GPUBufferType';

/**
 * Storage class buffer for calculating shaders
 * Usage GPUBufferUsage.STORAGE & GPUBufferUsage.COPY_SRC & GPUBufferUsage.COPY_DST
 * @group GFX
 */
export class ComputeGPUBuffer extends GPUBufferBase {
    constructor(size: number, data?: Float32Array) {
        super();
        this.bufferType = GPUBufferType.ComputeGPUBuffer;
        this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST, size, data);
    }
}

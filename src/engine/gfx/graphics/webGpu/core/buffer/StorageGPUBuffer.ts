import { ArrayBufferData, GPUBufferBase } from './GPUBufferBase';
/**
 * The buffer of the storage class
 * written in the computer shader or CPU Coder
 * usage GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST 
 * @group GFX
 */
export class StorageGPUBuffer extends GPUBufferBase {
    constructor(size: number, usage: number = 0, data?: ArrayBufferData) {
        super();
        this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | usage, size, data);
        // this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST, size, data);
    }
}

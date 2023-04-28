import { MemoryInfo } from '../../../../../core/pool/memory/MemoryInfo';
import { webGPUContext } from '../../Context3D';
import { GPUBufferBase } from './GPUBufferBase';
import { GPUBufferType } from './GPUBufferType';

/**
 * The buffer use at geometry indices
 * written in the computer shader or CPU Coder
 * usage GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
 * @group GFX
 */
export class VertexGPUBuffer extends GPUBufferBase {
    public node: MemoryInfo;
    constructor(size: number) {
        super();
        this.bufferType = GPUBufferType.VertexGPUBuffer;
        this.createVertexBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX, size);
    }

    protected createVertexBuffer(usage: GPUBufferUsageFlags, size: number) {
        let device = webGPUContext.device;
        this.byteSize = size * Float32Array.BYTES_PER_ELEMENT;
        this.usage = usage;
        if (this.buffer) {
            this.destroy();
        }
        this.buffer = device.createBuffer({
            size: this.byteSize,
            usage: usage,
            mappedAtCreation: false,
        });

        this.memory.allocation(this.byteSize);
        this.node = this.memory.allocation_node(this.byteSize);
        // this.outFloat32Array = new Float32Array(size);
    }
}

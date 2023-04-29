import { GPUBufferType } from './GPUBufferType';
import { GPUBufferBase } from './GPUBufferBase';
/**
 * CPU write, GPU read-only transmission buffer
 * Can only be copied and written in the cpu coder
 * usage GPUBufferUsage.UNIFORM & GPUBufferUsage.COPY_DST & GPUBufferUsage.COPY_SRC {@link GPUBufferUsage}
 * @group GFX
 */
export class UniformGPUBuffer extends GPUBufferBase {
    constructor(size: number, data?: Float32Array) {
        super();
        this.bufferType = GPUBufferType.UniformGPUBuffer;
        this.createBuffer(GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC, size, data);
    }

    public genUniformNodes() {
    }
}

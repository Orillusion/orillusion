import { FloatArray } from '../../../../../components/matrix/WasmMatrix';
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


    size: number;

    constructor(size: number, usage: number = 0, data?: ArrayBufferData) {
        super();
        this.bufferType = GPUBufferType.StorageGPUBuffer;
        this.size = size;
        this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | usage, size, data, "MatrixGPUBuffer");
    }

    /** Legacy name — same staging-buffer upload as `mapAsyncWrite`. */
    public writeBufferByHeap(floatArray: FloatArray, len: number) {
        this.mapAsyncWrite(floatArray, len);
    }
}


import { Engine3D, Matrix4 } from '../../src';
import matrix from './matrix';

export type FloatArray = Float32Array | Float64Array;

export function CreateFloatArray(buffer: ArrayBufferLike, byteOffset?: number, length?: number) {
    if (Engine3D.setting.doublePrecision) 
        return new Float64Array(buffer, byteOffset, length);
    return new Float32Array(buffer, byteOffset, length);
}

export class WasmMatrix {

    public static matrixBuffer: FloatArray;
    public static matrixSRTBuffer: FloatArray;
    public static matrixContinuedSRTBuffer: FloatArray;
    public static matrixStateBuffer: Int32Array;
    static matrixBufferPtr: number;
    static matrixSRTBufferPtr: number;
    static matrixContinuedSRTBufferPtr: number;
    static matrixStateBufferPtr: number;
    static wasm: typeof matrix;
    static stateStruct: number = 4;
    static useDoublePrecision: boolean = false;

    public static async init(count: number, useDoublePrecision: boolean = false) {
        this.wasm = await matrix();
        this.useDoublePrecision = useDoublePrecision;
        this.wasm._initialize(count, useDoublePrecision, 0);
        this.allocMatrix(count);
    }

    public static allocMatrix(count: number) {
        if (count > Matrix4.maxCount) {
            console.error(`The maximum allocation size is exceeded! current:${count}, limit:${Matrix4.maxCount}`);
        }

        this.wasm._allocMatrix(count);

        this.matrixBufferPtr = this.wasm._getMatrixBufferPtr();
        this.matrixSRTBufferPtr = this.wasm._getSRTPtr();
        this.matrixStateBufferPtr = this.wasm._getInfoPtr();
        this.matrixContinuedSRTBufferPtr = this.wasm._getContinuedSRTPtr();

        if (this.useDoublePrecision) {
            this.matrixBuffer = CreateFloatArray(this.wasm.HEAPF64.buffer, this.matrixBufferPtr, 16 * count);
            this.matrixSRTBuffer = CreateFloatArray(this.wasm.HEAPF64.buffer, this.matrixSRTBufferPtr, (3 * 3) * count);
            this.matrixContinuedSRTBuffer = CreateFloatArray(this.wasm.HEAPF64.buffer, this.matrixContinuedSRTBufferPtr, (3 * 3) * count);
            Matrix4.blockBytes = Matrix4.block * 8;
        } else {
            this.matrixBuffer = CreateFloatArray(this.wasm.HEAPF32.buffer, this.matrixBufferPtr, 16 * count);
            this.matrixSRTBuffer = CreateFloatArray(this.wasm.HEAPF32.buffer, this.matrixSRTBufferPtr, (3 * 3) * count);
            this.matrixContinuedSRTBuffer = CreateFloatArray(this.wasm.HEAPF32.buffer, this.matrixContinuedSRTBufferPtr, (3 * 3) * count);
            Matrix4.blockBytes = Matrix4.block * 4;
        }

        this.matrixStateBuffer = new Int32Array(this.wasm.HEAP32.buffer, this.matrixStateBufferPtr, (WasmMatrix.stateStruct) * count);

        Matrix4.allocMatrix(count);
    }

    public static updateAllContinueTransform(start: number, end: number, dt: number) {
        this.wasm._updateAllMatrixContinueTransform(start, end, dt);
    }

    public static setParent(matIndex: number, x: number, depthOrder: number) {
        this.matrixStateBuffer[matIndex * WasmMatrix.stateStruct + 2] = x >= 0 ? x : -1;
        this.matrixStateBuffer[matIndex * WasmMatrix.stateStruct + 3] = depthOrder;
        // console.warn(`${matIndex} -> ${depthOrder}`);
    }

    public static setTranslate(matIndex: number, x: number, y: number, z: number) {
        this.matrixSRTBuffer[matIndex * 9 + 6] = x;
        this.matrixSRTBuffer[matIndex * 9 + 7] = y;
        this.matrixSRTBuffer[matIndex * 9 + 8] = z;
    }

    public static setRotation(matIndex: number, x: number, y: number, z: number) {
        this.matrixSRTBuffer[matIndex * 9 + 3] = (x % 360);
        this.matrixSRTBuffer[matIndex * 9 + 4] = (y % 360);
        this.matrixSRTBuffer[matIndex * 9 + 5] = (z % 360);
    }

    public static setScale(matIndex: number, x: number, y: number, z: number) {
        this.matrixSRTBuffer[matIndex * 9 + 0] = x;
        this.matrixSRTBuffer[matIndex * 9 + 1] = y;
        this.matrixSRTBuffer[matIndex * 9 + 2] = z;
    }

    public static setContinueTranslate(matIndex: number, x: number, y: number, z: number) {
        if (x != 0 || y != 0 || z != 0) {
            this.matrixContinuedSRTBuffer[matIndex * 9 + 6] = x;
            this.matrixContinuedSRTBuffer[matIndex * 9 + 7] = y;
            this.matrixContinuedSRTBuffer[matIndex * 9 + 8] = z;
            this.matrixStateBuffer[matIndex * WasmMatrix.stateStruct + 1] = 1;
        }
    }

    public static setContinueRotation(matIndex: number, x: number, y: number, z: number) {
        if (x != 0 || y != 0 || z != 0) {
            this.matrixContinuedSRTBuffer[matIndex * 9 + 3] = x;
            this.matrixContinuedSRTBuffer[matIndex * 9 + 4] = y;
            this.matrixContinuedSRTBuffer[matIndex * 9 + 5] = z;
            this.matrixStateBuffer[matIndex * WasmMatrix.stateStruct + 1] = 1;
        }
    }

    public static setContinueScale(matIndex: number, x: number, y: number, z: number) {
        if (x != 0 || y != 0 || z != 0) {
            this.matrixContinuedSRTBuffer[matIndex * 9 + 0] = x;
            this.matrixContinuedSRTBuffer[matIndex * 9 + 1] = y;
            this.matrixContinuedSRTBuffer[matIndex * 9 + 2] = z;
            this.matrixStateBuffer[matIndex * WasmMatrix.stateStruct + 1] = 1;
        }
    }
}

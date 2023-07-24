import wasm from '@orillusion/wasm-matrix';

export class WasmMatrix {

    public static matrixBuffer: Float32Array;
    public static matrixSRTBuffer: Float32Array;
    public static matrixStateBuffer: Int32Array;
    static matrixBufferPtr: number;
    static matrixSRTBufferPtr: number;
    static matrixStateBufferPtr: number;
    public static async isReady(): Promise<boolean> {
        return new Promise(
            (suc, fail) => {
                let id = setInterval(() => {
                    let ready = wasm['calledRun']
                    if (ready) {
                        clearInterval(id);
                        suc(true);
                    } else {
                        fail(false);
                    }
                }, 16);
            }
        )
    }

    public static init(count: number) {
        wasm._initialize(count);

        this.matrixBufferPtr = wasm._getMatrixBufferPtr();
        this.matrixSRTBufferPtr = wasm._getSRTPtr();
        this.matrixStateBufferPtr = wasm._getInfoPtr();

        this.matrixBuffer = new Float32Array(wasm.HEAPF32.buffer, this.matrixBufferPtr, 16 * count);
        this.matrixSRTBuffer = new Float32Array(wasm.HEAPF32.buffer, this.matrixSRTBufferPtr, (3 * 3) * count);
        this.matrixStateBuffer = new Int32Array(wasm.HEAP32.buffer, this.matrixStateBufferPtr, (2) * count);
    }

    public static updateAllMatrixTransform(start: number, end: number) {
        wasm._updateAllMatrixTransform(start, end);
    }

    public static setTranslate(matIndex: number, x: number, y: number, z: number) {
        this.matrixSRTBuffer[matIndex * 9 + 6] = x;
        this.matrixSRTBuffer[matIndex * 9 + 7] = y;
        this.matrixSRTBuffer[matIndex * 9 + 8] = z;
    }

    public static setRotation(matIndex: number, x: number, y: number, z: number) {
        this.matrixSRTBuffer[matIndex * 9 + 3] = x;
        this.matrixSRTBuffer[matIndex * 9 + 4] = y;
        this.matrixSRTBuffer[matIndex * 9 + 5] = z;
    }

    public static setScale(matIndex: number, x: number, y: number, z: number) {
        this.matrixSRTBuffer[matIndex * 9 + 0] = x;
        this.matrixSRTBuffer[matIndex * 9 + 1] = y;
        this.matrixSRTBuffer[matIndex * 9 + 2] = z;
    }

    public static setParent(matIndex: number, x: number) {
        this.matrixStateBuffer[matIndex * 2 + 1] = x >= 0 ? x : -1;
    }
}
export default Module;
declare function Module<T>(target?: T): Promise<T & typeof Module>;
declare module Module {
    function destroy(obj: any): void;
    function _malloc(size: number): number;
    function _free(ptr: number): void;
    const HEAP8: Int8Array;
    const HEAP16: Int16Array;
    const HEAP32: Int32Array;
    const HEAPU8: Uint8Array;
    const HEAPU16: Uint16Array;
    const HEAPU32: Uint32Array;
    const HEAPF32: Float32Array;
    const HEAPF64: Float64Array;

    function _initialize(count: number);

    function _updateAllMatrixTransform(start: number, end: number);

    function _updateAllMatrixContinueTransform(start: number, end: number);

    function _printMatrix(index: number);


    function _getSRTPtr(): number;

    function _getInfoPtr(): number;

    function _getMatrixBufferPtr(): number;

    function _getContinuedSRTPtr(): number;
}



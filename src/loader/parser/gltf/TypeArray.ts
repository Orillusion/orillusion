const isArrayBuffer = window.SharedArrayBuffer
    ? function isArrayBufferOrSharedArrayBuffer(ary) {
        return ary && ary.buffer && (ary.buffer instanceof ArrayBuffer || ary.buffer instanceof window.SharedArrayBuffer);
    }
    : function isArrayBuffer(ary) {
        return ary && ary.buffer && ary.buffer instanceof ArrayBuffer;
    };

const BYTE = 0x1400;
const UNSIGNED_BYTE = 0x1401;
const SHORT = 0x1402;
const UNSIGNED_SHORT = 0x1403;
const INT = 0x1404;
const UNSIGNED_INT = 0x1405;
const FLOAT = 0x1406;
const UNSIGNED_SHORT_4_4_4_4 = 0x8033;
const UNSIGNED_SHORT_5_5_5_1 = 0x8034;
const UNSIGNED_SHORT_5_6_5 = 0x8363;
const HALF_FLOAT = 0x140b;
const UNSIGNED_INT_2_10_10_10_REV = 0x8368;
const UNSIGNED_INT_10F_11F_11F_REV = 0x8c3b;
const UNSIGNED_INT_5_9_9_9_REV = 0x8c3e;
const FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8dad;
const UNSIGNED_INT_24_8 = 0x84fa;

const glTypeToTypedArray = {};
{
    const tt = glTypeToTypedArray;
    tt[BYTE] = Int8Array;
    tt[UNSIGNED_BYTE] = Uint8Array;
    tt[SHORT] = Int16Array;
    tt[UNSIGNED_SHORT] = Uint16Array;
    tt[INT] = Int32Array;
    tt[UNSIGNED_INT] = Uint32Array;
    tt[FLOAT] = Float32Array;
    tt[UNSIGNED_SHORT_4_4_4_4] = Uint16Array;
    tt[UNSIGNED_SHORT_5_5_5_1] = Uint16Array;
    tt[UNSIGNED_SHORT_5_6_5] = Uint16Array;
    tt[HALF_FLOAT] = Uint16Array;
    tt[UNSIGNED_INT_2_10_10_10_REV] = Uint32Array;
    tt[UNSIGNED_INT_10F_11F_11F_REV] = Uint32Array;
    tt[UNSIGNED_INT_5_9_9_9_REV] = Uint32Array;
    tt[FLOAT_32_UNSIGNED_INT_24_8_REV] = Uint32Array;
    tt[UNSIGNED_INT_24_8] = Uint32Array;
}

/**
 * @internal
 */
export function getGLTypeFromTypedArrayType(typedArrayType) {
    switch (typedArrayType) {
        case Int8Array:
            return BYTE;
        case Uint8Array:
            return UNSIGNED_BYTE;
        case Uint8ClampedArray:
            return UNSIGNED_BYTE;
        case Int16Array:
            return SHORT;
        case Uint16Array:
            return UNSIGNED_SHORT;
        case Int32Array:
            return INT;
        case Uint32Array:
            return UNSIGNED_INT;
        case Float32Array:
            return FLOAT;
        default:
            throw new Error('unsupported typed array type');
    }
}

/**
 * @internal
 */
export function getGLTypeFromTypedArray(typedArray) {
    if (typedArray instanceof Int8Array) return BYTE;
    if (typedArray instanceof Uint8Array) return UNSIGNED_BYTE;
    if (typedArray instanceof Uint8ClampedArray) return UNSIGNED_BYTE;
    if (typedArray instanceof Int16Array) return SHORT;
    if (typedArray instanceof Uint16Array) return UNSIGNED_SHORT;
    if (typedArray instanceof Int32Array) return INT;
    if (typedArray instanceof Uint32Array) return UNSIGNED_INT;
    if (typedArray instanceof Float32Array) return FLOAT;
    throw new Error('unsupported typed array type');
}

/**
 * @internal
 */
export function getTypedArrayTypeFromGLType(type) {
    const arrayType = glTypeToTypedArray[type];
    if (!arrayType) throw new Error('unkonw gl type');
    return arrayType;
}

/**
 * @internal
 */
export function getTypedArray(array, Type = Float32Array) {
    if (isArrayBuffer(array)) return array;
    return new Type(array);
}

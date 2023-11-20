import { Vector4 } from "../../../../..";

export class Float32ArrayUtil {

    public static wirteVec4(array: Float32Array, index: number, value: Vector4) {
        array[index * 4 + 0] = value.x;
        array[index * 4 + 1] = value.y;
        array[index * 4 + 2] = value.z;
        array[index * 4 + 3] = value.w;
    }
}
import { Color } from '../../../../../math/Color';
import { Vector2 } from '../../../../../math/Vector2';
import { Vector3 } from '../../../../../math/Vector3';
import { Vector4 } from '../../../../../math/Vector4';
/**
 * @internal
 */
export type UniformValue = number | Vector2 | Vector3 | Vector4 | Color | Float32Array | any;

export enum UniformType {
    Number,
    Vector2,
    Vector3,
    Vector4,
    Color,
    Float32Array
}

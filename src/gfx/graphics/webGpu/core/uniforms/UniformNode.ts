import { MemoryInfo } from '../../../../../core/pool/memory/MemoryInfo';
import { Color } from '../../../../../math/Color';
import { Vector2 } from '../../../../../math/Vector2';
import { Vector3 } from '../../../../../math/Vector3';
import { Vector4 } from '../../../../../math/Vector4';
import { UniformType, UniformValue } from '../../shader/value/UniformValue';

/**
 * @internal
 */
export class UniformNode {

    public size: number;
    public memoryInfo: MemoryInfo;
    public bindOnChange: () => void;

    private _data: UniformValue;
    private _type: UniformType = UniformType.Number;

    constructor(value: UniformValue) {
        this.data = value;
    }

    public get data(): UniformValue {
        return this._data;
    }

    public set data(value: UniformValue) {
        this._data = value;
        this._type = UniformType.Number;
        if (value instanceof Vector2) {
            this.size = 2;
            this._type = UniformType.Vector2;
        } else if (value instanceof Vector3) {
            this.size = 3;
            this._type = UniformType.Vector3;
        } else if (value instanceof Vector4) {
            this.size = 4;
            this._type = UniformType.Vector4;
        } else if (value instanceof Color) {
            this.size = 4;
            this._type = UniformType.Color;
        } else if (value instanceof Float32Array) {
            this.size = value.length;
            this._type = UniformType.Float32Array;
        } else {
            this.size = 1;
            this._type = UniformType.Number;
        }
    }

    public get color(): Color {
        let c = new Color(this._data.r, this._data.g, this._data.b, this._data.a);
        return c;
    }

    public set color(value: Color) {
        if (
            this._data.r != value.r ||
            this._data.g != value.g ||
            this._data.b != value.b ||
            this._data.a != value.a
        ) {
            this._data.r = value.r;
            this._data.g = value.g;
            this._data.b = value.b;
            this._data.a = value.a;
            this.onChange();
        }
    }

    public get value(): number {
        return this._data;
    }

    public set value(value: number) {
        if (this._data != value) {
            this._data = value;
            this.onChange();
        }
    }

    public get vector2(): Vector2 {
        return new Vector2(this._data.x, this._data.y);
    }

    public set vector2(value: Vector2) {
        if (this._data.x != value.x || this._data.y != value.y) {
            this._data.x = value.x;
            this._data.y = value.y;
            this.onChange();
        }
    }

    public get vector3(): Vector3 {
        return new Vector3(this._data.x, this._data.y, this._data.z);
    }

    public set vector3(value: Vector3) {
        if (this._data.x != value.x || this._data.y != value.y || this._data.z != value.z) {
            this._data.x = value.x;
            this._data.y = value.y;
            this._data.z = value.z;
            this.onChange();
        }
    }

    public get vector4(): Vector4 {
        // this.onChange();
        return new Vector4(this._data.x, this._data.y, this._data.z, this._data.w);
    }

    public set vector4(value: Vector4) {
        if (this._data.x != value.x || this._data.y != value.y || this._data.z != value.z || this._data.w != value.w) {
            this._data.x = value.x;
            this._data.y = value.y;
            this._data.z = value.z;
            this._data.w = value.w;
            this.onChange();
        }
    }

    public onChange() {
        if (this.bindOnChange) {
            this.bindOnChange();
        }
    }

    public float32Array(value: Float32Array) {
        this._data.set(value);
        this.onChange();
    }

    public update() {
        switch (this._type) {
            case UniformType.Number:
                this.memoryInfo.dataBytes.setFloat32(0 * Float32Array.BYTES_PER_ELEMENT, this._data, true);
                break;
            case UniformType.Vector2:
                this.memoryInfo.setVector2(0, this._data);
                break;
            case UniformType.Vector3:
                this.memoryInfo.setVector3(0, this._data);
                break;
            case UniformType.Vector4:
                this.memoryInfo.setVector4(0, this._data);
                break;
            case UniformType.Color:
                this.memoryInfo.setColor(0, this._data);
                break;
            case UniformType.Float32Array:
                this.memoryInfo.setFloat32Array(0, this._data);
                break;
        }
    }
}

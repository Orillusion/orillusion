import { Color } from '../../../math/Color';
import { Quaternion } from '../../../math/Quaternion';
import { Vector2 } from '../../../math/Vector2';
import { Vector3 } from '../../../math/Vector3';
import { Vector4 } from '../../../math/Vector4';

/**
 * @internal
 * @group Core
 */
export class MemoryInfo {
    public byteOffset: number;
    public byteSize: number;
    public offset: number = 0;
    public dataBytes: DataView;

    public get x(): number {
        return this.dataBytes.getFloat32(0 * Float32Array.BYTES_PER_ELEMENT, true);
    }

    public set x(v: number) {
        this.dataBytes.setFloat32(0 * Float32Array.BYTES_PER_ELEMENT, v, true);
    }

    public get y(): number {
        return this.dataBytes.getFloat32(1 * Float32Array.BYTES_PER_ELEMENT, true);
    }

    public set y(v: number) {
        this.dataBytes.setFloat32(1 * Float32Array.BYTES_PER_ELEMENT, v, true);
    }

    public get z(): number {
        return this.dataBytes.getFloat32(2 * Float32Array.BYTES_PER_ELEMENT, true);
    }

    public set z(v: number) {
        this.dataBytes.setFloat32(2 * Float32Array.BYTES_PER_ELEMENT, v, true);
    }

    public get w(): number {
        return this.dataBytes.getFloat32(3 * Float32Array.BYTES_PER_ELEMENT, true);
    }

    public set w(v: number) {
        this.dataBytes.setFloat32(3 * Float32Array.BYTES_PER_ELEMENT, v, true);
    }

    public setX(x: number) {
        this.x = x;
    }

    public setXY(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public setXYZ(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public setXYZW(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public setVector2Array(vs: Vector2[]) {
        for (let i = 0; i < vs.length; i++) {
            const element = vs[i];
            this.dataBytes.setFloat32((i * 2 + 0) * Float32Array.BYTES_PER_ELEMENT, element.x, true);
            this.dataBytes.setFloat32((i * 2 + 1) * Float32Array.BYTES_PER_ELEMENT, element.y, true);
        }
    }

    public setVector3Array(vs: Vector3[]) {
        for (let i = 0; i < vs.length; i++) {
            const element = vs[i];
            this.dataBytes.setFloat32((i * 3 + 0) * Float32Array.BYTES_PER_ELEMENT, element.x, true);
            this.dataBytes.setFloat32((i * 3 + 1) * Float32Array.BYTES_PER_ELEMENT, element.y, true);
            this.dataBytes.setFloat32((i * 3 + 2) * Float32Array.BYTES_PER_ELEMENT, element.z, true);
        }
    }

    public setVector4Array(vs: Vector4[] | Quaternion[]) {
        for (let i = 0; i < vs.length; i++) {
            const element = vs[i];
            this.dataBytes.setFloat32((i * 4 + 0) * Float32Array.BYTES_PER_ELEMENT, element.x, true);
            this.dataBytes.setFloat32((i * 4 + 1) * Float32Array.BYTES_PER_ELEMENT, element.y, true);
            this.dataBytes.setFloat32((i * 4 + 2) * Float32Array.BYTES_PER_ELEMENT, element.z, true);
            this.dataBytes.setFloat32((i * 4 + 3) * Float32Array.BYTES_PER_ELEMENT, element.w, true);
        }
    }

    public setColorArray(colorArray: Color[]) {
        for (let i = 0; i < colorArray.length; i++) {
            const element = colorArray[i];
            this.dataBytes.setFloat32((i * 4 + 0) * Float32Array.BYTES_PER_ELEMENT, element.r, true);
            this.dataBytes.setFloat32((i * 4 + 1) * Float32Array.BYTES_PER_ELEMENT, element.g, true);
            this.dataBytes.setFloat32((i * 4 + 2) * Float32Array.BYTES_PER_ELEMENT, element.b, true);
            this.dataBytes.setFloat32((i * 4 + 3) * Float32Array.BYTES_PER_ELEMENT, element.a, true);
        }
    }

    public setInt8(v: number, index: number = 0) {
        this.dataBytes.setInt8(index * Int8Array.BYTES_PER_ELEMENT, v);
    }

    public getInt8(index: number = 0): number {
        return this.dataBytes.getInt8(index * Int8Array.BYTES_PER_ELEMENT);
    }

    public setInt16(v: number, index: number = 0) {
        this.dataBytes.setInt16(index * Int16Array.BYTES_PER_ELEMENT, v, true);
    }

    public getInt16(index: number = 0): number {
        return this.dataBytes.getInt16(index * Int16Array.BYTES_PER_ELEMENT, true);
    }

    public setInt32(v: number, index: number = 0) {
        this.dataBytes.setInt32(index * Int32Array.BYTES_PER_ELEMENT, v, true);
    }

    public getInt32(index: number = 0): number {
        return this.dataBytes.getInt32(index * Int32Array.BYTES_PER_ELEMENT, true);
    }

    public setFloat(v: number, index: number = 0) {
        this.dataBytes.setFloat32(index * Float32Array.BYTES_PER_ELEMENT, v, true)
    }

    public getFloat(index: number = 0): number {
        return this.dataBytes.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
    }

    public setUint8(v: number, index: number = 0) {
        this.dataBytes.setUint8(index * Uint8Array.BYTES_PER_ELEMENT, v);
    }

    public getUint8(index: number = 0): number {
        return this.dataBytes.getUint8(index * Uint8Array.BYTES_PER_ELEMENT);
    }

    public setUint16(v: number, index: number = 0) {
        this.dataBytes.setUint16(index * Uint16Array.BYTES_PER_ELEMENT, v, true);
    }



    public getUint16(index: number = 0): number {
        return this.dataBytes.getUint16(index * Uint16Array.BYTES_PER_ELEMENT, true);
    }

    public setUint32(v: number, index: number = 0) {
        this.dataBytes.setUint32(index * Uint32Array.BYTES_PER_ELEMENT, v, true);
    }

    public getUint32(index: number = 0): number {
        return this.dataBytes.getUint32(index * Uint32Array.BYTES_PER_ELEMENT, true);
    }

    public setArray(index: number, data: number[]) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            this.dataBytes.setFloat32((index + i) * Float32Array.BYTES_PER_ELEMENT, element, true);
        }
    }

    public setFloat32Array(index: number, data: Float32Array) {
        // let buffer = this.dataBytes.buffer.slice(this.dataBytes.byteOffset, this.dataBytes.byteOffset + data.length * Float32Array.BYTES_PER_ELEMENT);
        // let tmp = new Float32Array(buffer, index * Float32Array.BYTES_PER_ELEMENT);
        // tmp.set(data);

        let tmp = new Float32Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Float32Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setArrayBuffer(index: number, arrayBuffer: ArrayBuffer) {
        if (arrayBuffer instanceof Uint8Array) {
            this.setUint8Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Uint16Array) {
            this.setUint16Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Uint32Array) {
            this.setUint32Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Int8Array) {
            this.setInt8Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Int16Array) {
            this.setInt16Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Int32Array) {
            this.setInt32Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Float32Array) {
            this.setFloat32Array(index, arrayBuffer);
        } else if (arrayBuffer instanceof Float64Array) {

        }
    }

    public setInt8Array(index: number, data: Int8Array) {
        let tmp = new Int8Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Int8Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setInt16Array(index: number, data: Int16Array) {
        let tmp = new Int16Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Int16Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setInt32Array(index: number, data: Int32Array) {
        let tmp = new Int32Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Int32Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setUint8Array(index: number, data: Uint8Array) {
        let tmp = new Uint8Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Uint8Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setUint16Array(index: number, data: Uint16Array) {
        let tmp = new Uint16Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Uint16Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setUint32Array(index: number, data: Uint32Array) {
        let tmp = new Uint32Array(this.dataBytes.buffer, this.dataBytes.byteOffset + index * Uint32Array.BYTES_PER_ELEMENT);
        tmp.set(data);
    }

    public setData(index: number, data: number) {
        this.dataBytes.setFloat32(index * Float32Array.BYTES_PER_ELEMENT, data, true);
    }

    public setVector2(index: number, data: Vector2) {
        this.dataBytes.setFloat32((index) * Float32Array.BYTES_PER_ELEMENT, data.x, true);
        this.dataBytes.setFloat32((index + 1) * Float32Array.BYTES_PER_ELEMENT, data.y, true);
    }

    public setVector3(index: number, data: Vector3) {
        this.dataBytes.setFloat32((index) * Float32Array.BYTES_PER_ELEMENT, data.x, true);
        this.dataBytes.setFloat32((index + 1) * Float32Array.BYTES_PER_ELEMENT, data.y, true);
        this.dataBytes.setFloat32((index + 2) * Float32Array.BYTES_PER_ELEMENT, data.z, true);
    }

    public setVector4(index: number, data: Vector4) {
        this.dataBytes.setFloat32((index) * Float32Array.BYTES_PER_ELEMENT, data.x, true);
        this.dataBytes.setFloat32((index + 1) * Float32Array.BYTES_PER_ELEMENT, data.y, true);
        this.dataBytes.setFloat32((index + 2) * Float32Array.BYTES_PER_ELEMENT, data.z, true);
        this.dataBytes.setFloat32((index + 3) * Float32Array.BYTES_PER_ELEMENT, data.w, true);
    }

    public setColor(index: number, data: Color) {
        this.dataBytes.setFloat32((index) * Float32Array.BYTES_PER_ELEMENT, data.r, true);
        this.dataBytes.setFloat32((index + 1) * Float32Array.BYTES_PER_ELEMENT, data.g, true);
        this.dataBytes.setFloat32((index + 2) * Float32Array.BYTES_PER_ELEMENT, data.b, true);
        this.dataBytes.setFloat32((index + 3) * Float32Array.BYTES_PER_ELEMENT, data.a, true);
    }

    public getData(index: number): number {
        return this.dataBytes.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
    }

    public writeFloat(v: number) {
        this.dataBytes.setFloat32(this.offset, v, true);
        this.offset += Float32Array.BYTES_PER_ELEMENT;
    }

    public writeInt8(v: number) {
        this.dataBytes.setInt8(this.offset, v);
        this.offset += Int8Array.BYTES_PER_ELEMENT;
    }

    public writeInt16(v: number) {
        this.dataBytes.setInt16(this.offset, v, true);
        this.offset += Int16Array.BYTES_PER_ELEMENT;
    }

    public writeInt32(v: number) {
        this.dataBytes.setInt32(this.offset, v, true);
        this.offset += Int32Array.BYTES_PER_ELEMENT;
    }

    public writeUint8(v: number) {
        this.dataBytes.setUint8(this.offset, v);
        this.offset += Uint8Array.BYTES_PER_ELEMENT;
    }

    public writeUint16(v: number) {
        this.dataBytes.setUint16(this.offset, v, true);
        this.offset += Uint16Array.BYTES_PER_ELEMENT;
    }

    public writeUint32(v: number) {
        this.dataBytes.setUint32(this.offset, v, true);
        this.offset += Uint32Array.BYTES_PER_ELEMENT;
    }

    public writeVector2(v: Vector2) {
        this.writeFloat(v.x);
        this.writeFloat(v.y);
    }

    public writeVector3(v: Vector3) {
        this.writeFloat(v.x);
        this.writeFloat(v.y);
        this.writeFloat(v.z);
    }

    public writeVector4(v: Vector4) {
        this.writeFloat(v.x);
        this.writeFloat(v.y);
        this.writeFloat(v.z);
        this.writeFloat(v.w);
    }

    public writeRGBColor(v: Color) {
        this.writeFloat(v.r);
        this.writeFloat(v.g);
        this.writeFloat(v.b);
        // this.writeFloat(v.a);
    }

    public writeArray(v: number[]) {
        for (let i = 0; i < v.length; i++) {
            const d = v[i];
            this.writeFloat(d);
        }
    }

    public writeFloat32Array(v: Float32Array) {
        new Float32Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public writeInt8Array(v: Int8Array) {
        new Int8Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public writeInt16Array(v: Int16Array) {
        new Int16Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public writeInt32Array(v: Int32Array) {
        new Int32Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public writeUint8Array(v: Uint8Array) {
        new Uint8Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public writeUint16Array(v: Uint16Array) {
        new Uint16Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public writeUint32Array(v: Uint32Array) {
        new Uint32Array(this.dataBytes.buffer, this.dataBytes.byteOffset + this.offset).set(v);
        this.offset += v.byteLength;
    }

    public reset() {
        this.offset = 0;
    }
}

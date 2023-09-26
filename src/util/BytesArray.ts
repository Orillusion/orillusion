import { Color, Matrix4, Quaternion, StringUtil, Vector2, Vector3, Vector4 } from "..";

/**
 * @internal
 * @group Util
 */
export class BytesArray extends DataView {

    public position: number = 0;
    public littleEndian?: boolean = true;
    constructor(buffer: ArrayBufferLike, byteOffset?: number, byteLength?: number) {
        super(buffer, byteOffset, byteLength);
        this.position = 0;
        this.position += this.byteOffset;
    }

    //TODO Improve read/write byte
    public readUTF() {
        let len = this.readInt32();

        let b = len % 4;
        if (b > 0 && b < 4) {
            b = 4 - b;
        }

        let ret = "";
        // let count = Math.floor(len / 65535) + 1;
        // for (let i = 0; i < count; i++) {
        let strBuffer = new Int8Array(this.buffer, this.position, len);
        this.position += len * Int8Array.BYTES_PER_ELEMENT;
        ret += String.fromCharCode.apply(null, strBuffer);
        // }

        this.position += b * Int8Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readStringArray() {
        let ret: string[] = [];
        let len = this.readInt32();
        for (let i = 0; i < len; i++) {
            ret.push(this.readUTF());
        }
        return ret;
    }

    public readByte(): number {
        let ret = this.buffer[this.position];
        this.position += 1;
        return ret;
    }

    public readBoolean(): boolean {
        let ret = this.readInt32();
        this.position += 4;
        return ret == 1 ? true : false;
    }

    public readBytes(byteLen: number) {
        let bufferView = new DataView(this.buffer, this.position, byteLen);
        this.position += byteLen;
        return bufferView.buffer;
    }

    public readBytesArray() {
        let byteLen = this.readInt32();
        let bufferView = new BytesArray(this.buffer.slice(this.position, this.position + byteLen));
        this.position += byteLen;
        return bufferView;
    }

    public readUnit8(): number {
        let ret = this.getUint8(this.position);
        this.position += Uint8Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readUnit16(): number {
        let ret = this.getUint16(this.position);
        this.position += Uint16Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readUnit32(): number {
        let ret = this.getUint32(this.position);
        this.position += Uint32Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readInt8(): number {
        let ret = this.getInt8(this.position);
        this.position += Int8Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readInt16(): number {
        let ret = this.getInt16(this.position, this.littleEndian);
        this.position += Int16Array.BYTES_PER_ELEMENT;
        return ret;
    }


    public readInt32(): number {
        let ret = this.getInt32(this.position, this.littleEndian);
        this.position += Int32Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readFloat32(): number {
        let ret = this.getFloat32(this.position, this.littleEndian);
        this.position += Float32Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readFloat64(): number {
        let ret = this.getFloat64(this.position, this.littleEndian);
        this.position += Float64Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public readInt32Array(): Int32Array {
        let len = this.readInt32();
        let ret = new Int32Array(this.buffer, this.position, len);
        ret = ret.slice(0, len);
        this.position += ret.byteLength;
        return ret;
    }

    public readInt32List(): number[] {
        let len = this.readInt32();
        let ret = [];
        for (let i = 0; i < len; i++) {
            ret.push(this.readInt32());
        }
        return ret;
    }

    public readFloatArray(): number[] {
        let len = this.readInt32();
        let ret = [];
        for (let i = 0; i < len; i++) {
            let v = this.readFloat32();
            ret.push(v);
        }
        return ret;
    }

    public readIntArray(): number[] {
        let len = this.readInt32();
        let ret = [];
        for (let i = 0; i < len; i++) {
            let v = this.readInt32();
            ret.push(v);
        }
        return ret;
    }

    public readVector2int() {
        let v = new Vector2();
        v.x = this.readInt32();
        v.y = this.readInt32();
        return v;
    }

    public readVector2() {
        let v = new Vector2();
        v.x = this.readFloat32();
        v.y = this.readFloat32();
        return v;
    }

    public readVector3() {
        let v = new Vector3();
        v.x = this.readFloat32();
        v.y = this.readFloat32();
        v.z = this.readFloat32();
        return v;
    }

    public readVector3Array() {
        let list = [];
        let len = this.readInt32();
        for (let i = 0; i < len; i++) {
            list.push(this.readVector3());
        }
        return list;
    }

    public readVector4() {
        let v = new Vector4();
        v.x = this.readFloat32();
        v.y = this.readFloat32();
        v.z = this.readFloat32();
        v.w = this.readFloat32();
        return v;
    }

    public readVector4Array() {
        let list = [];
        let len = this.readInt32();
        for (let i = 0; i < len; i++) {
            list.push(this.readVector4());
        }
        return list;
    }


    public readColor() {
        let v = new Color();
        v.r = this.readFloat32();
        v.g = this.readFloat32();
        v.b = this.readFloat32();
        v.a = this.readFloat32();
        return v;
    }

    public readColorArray() {
        let list = [];
        let len = this.readInt32();
        for (let i = 0; i < len; i++) {
            list.push(this.readColor());
        }
        return list;
    }

    public readQuaternion() {
        let v = new Quaternion();
        v.x = this.readFloat32();
        v.y = this.readFloat32();
        v.z = this.readFloat32();
        v.w = this.readFloat32();
        return v;
    }

    public readQuaternionArray() {
        let list = [];
        let len = this.readInt32();
        for (let i = 0; i < len; i++) {
            list.push(this.readQuaternion());
        }
        return list;
    }

    public readMatrix44(): Matrix4 {
        let m = new Matrix4();
        let rawData = m.rawData;
        rawData[0] = this.readFloat32();
        rawData[1] = this.readFloat32();
        rawData[2] = this.readFloat32();
        rawData[3] = this.readFloat32();
        rawData[4] = this.readFloat32();
        rawData[5] = this.readFloat32();
        rawData[6] = this.readFloat32();
        rawData[7] = this.readFloat32();
        rawData[8] = this.readFloat32();
        rawData[9] = this.readFloat32();
        rawData[10] = this.readFloat32();
        rawData[11] = this.readFloat32();
        rawData[12] = this.readFloat32();
        rawData[13] = this.readFloat32();
        rawData[14] = this.readFloat32();
        rawData[15] = this.readFloat32();
        return m;
    }

    public readMatrix44Array(): Matrix4[] {
        let len = this.readInt32();
        let list = [];
        for (let i = 0; i < len; i++) {
            let m = this.readMatrix44();
            list.push(m);
        }
        return list;
    }

    public readFloat32Array(len: number): Float32Array {
        let ret = new Float32Array(this.buffer, this.position, len);
        ret = ret.slice(0, this.byteLength);
        this.position += len * Float32Array.BYTES_PER_ELEMENT;
        return ret;
    }

    public getFloat32Array(): Float32Array {
        let ret = new Float32Array(this.buffer, this.byteOffset, this.byteLength / Float32Array.BYTES_PER_ELEMENT);
        ret = ret.slice(0, this.byteLength);
        return ret;
    }


}

import { ArrayBufferData } from "./ArrayBufferData";
import { GPUBufferType } from "./GPUBufferType";
import { Color } from "../../../../../math/Color";
import { Matrix4 } from "../../../../../math/Matrix4";
import { Quaternion } from "../../../../../math/Quaternion";
import { Vector2 } from "../../../../../math/Vector2";
import { Vector3 } from "../../../../../math/Vector3";
import { Vector4 } from "../../../../../math/Vector4";
import { Struct } from "../../../../../util/struct/Struct";

import { webGPUContext } from "../../Context3D";
import { MemoryDO } from "../../../../../core/pool/memory/MemoryDO";
import { MemoryInfo } from "../../../../../core/pool/memory/MemoryInfo";

/**
 * @internal
 * @group GFX
 */
export class GPUBufferBase {
    public bufferType: GPUBufferType;
    public buffer: GPUBuffer;
    public memory: MemoryDO;
    public memoryNodes: Map<string | number, MemoryInfo>;
    public seek: number;
    public outFloat32Array: Float32Array;
    public byteSize: number;
    public usage: GPUBufferUsageFlags;
    public visibility: number = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
    private _readBuffer: GPUBuffer;

    constructor() {
        this.memory = new MemoryDO();
        this.memoryNodes = new Map<string | number, MemoryInfo>();
    }

    public debug() {
    }

    public reset(clean: boolean = false, size: number = 0, data?: Float32Array) {
        this.seek = 0;
        this.memory.reset();
        if (clean) {
            this.createBuffer(this.usage, size, data);
        }
    }

    public setBoolean(name: string, v: boolean) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setX(v ? 1 : 0);
    }

    public setFloat(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setX(v);
    }

    public setInt8(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 1);
            this.memoryNodes.set(name, node);
        }
        node.setInt8(v);
    }

    public setInt16(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 2);
            this.memoryNodes.set(name, node);
        }
        node.setInt16(v);
    }

    public setInt32(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setInt32(v);
    }

    public setUint8(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 1);
            this.memoryNodes.set(name, node);
        }
        node.setUint8(v);
    }

    public setUint16(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 2);
            this.memoryNodes.set(name, node);
        }
        node.setUint16(v);
    }

    public setUint32(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setUint32(v);
    }

    public setVector2(name: string, v2: Vector2) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(2 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXY(v2.x, v2.y);
    }

    public setVector3(name: string, v3: Vector3) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(3 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXYZ(v3.x, v3.y, v3.z);
    }

    public setVector4(name: string, v4: Vector4 | Quaternion) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(4 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXYZW(v4.x, v4.y, v4.z, v4.w);
    }

    public setVector4Array(name: string, v4Array: Vector4[] | Quaternion[]) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(4 * 4 * v4Array.length);
            this.memoryNodes.set(name, node);
        }
        node.setVector4Array(v4Array);
    }

    public setColor(name: string, color: Color) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(4 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXYZW(color.r, color.g, color.b, color.a);
    }

    public setColorArray(name: string, colorArray: Color[]) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(4 * 4 * colorArray.length);
            this.memoryNodes.set(name, node);
        }
        node.setColorArray(colorArray);
    }

    public setMatrix(name: string, mat: Matrix4) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(16 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setFloat32Array(0, mat.rawData);
    }

    public setMatrixArray(name: string, mats: Matrix4[]) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(16 * 4 * mats.length);
            this.memoryNodes.set(name, node);
        }
        for (let i = 0; i < mats.length; i++) {
            const mat = mats[i];
            node.setFloat32Array(i * 16, mat.rawData);
        }
    }

    public setArray(name: string, data: number[]) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(data.length * 4);
            this.memoryNodes.set(name, node);
        }
        node.setArray(0, data);
    }

    public setFloat32Array(name: string, data: Float32Array) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(data.length * 4);
            this.memoryNodes.set(name, node);
        }
        node.setFloat32Array(0, data);
    }

    public setInt32Array(name: string, data: Int32Array) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(data.length * 4);
            this.memoryNodes.set(name, node);
        }
        node.setInt32Array(0, data);
    }

    public setStruct<T extends Struct>(c: { new(): T }, index: number, data: any, property?: string) {
        let ref = Struct.Ref(c);
        let size = Struct.GetSize(c);

        let name = index;
        let node = this.memoryNodes.get(name);
        node.reset();

        let obj = data;
        if (property) {
            obj = obj[property];
        }

        for (let i = 0; i < ref.length; i++) {
            const att = ref[i];
            let value = obj[att.name];

            switch (att.type) {
                case `Boolean`:
                    node.writeFloat(value);
                    break;

                case `Number`:
                    node.writeFloat(value);
                    break;

                case `Float32Array`:
                    node.writeFloat32Array(value);
                    break;

                case `Vector2`:
                    node.writeVector2(value);
                    break;

                case `Vector3`:
                    node.writeVector3(value);
                    break;

                case `Vector4`:
                    node.writeVector4(value);
                    break;

                case `Color`:
                    node.writeRGBColor(value);
                    break;

                case `Array`:
                    node.writeArray(value);
                    break;
            }
        }
    }

    public setStructArray<T extends Struct>(c: { new(): T }, dataList: any[], property?: string) {
        let len = dataList.length;
        for (let i = 0; i < len; i++) {
            const data = dataList[i];
            this.setStruct(c, i, data, property);
        }
    }

    // public writeFloat(v: number) {
    //     this.memory.shareFloat32Array[this.seek] = v;
    //     this.seek += 1;
    // }

    public apply() {
        webGPUContext.device.queue.writeBuffer(this.buffer, 0, this.memory.shareDataBuffer);//, this.memory.shareFloat32Array.byteOffset, this.memory.shareFloat32Array.byteLength);
    }

    public destroy() {
        this.outFloat32Array = null;
        this.buffer.destroy();
        this.memory.destroy();
    }

    protected createBuffer(usage: GPUBufferUsageFlags, size: number, data?: ArrayBufferData) {
        let device = webGPUContext.device;
        this.byteSize = size * 4;
        this.usage = usage;
        if (this.buffer) {
            this.destroy();
        }
        this.buffer = device.createBuffer({
            size: this.byteSize,
            usage: usage,
            mappedAtCreation: false,
        });

        this.memory.allocation(this.byteSize);
        if (data) {
            let m = this.memory.allocation_node(data.length * 4);
            m.setArrayBuffer(0, data);
            this.apply();
        }

        this.outFloat32Array = new Float32Array(size);
    }

    protected createBufferByStruct<T extends Struct>(usage: GPUBufferUsageFlags, struct: { new(): T }, count: number) {
        let structSize = Struct.GetSize(struct);
        let totalLength = structSize * count;

        let device = webGPUContext.device;
        this.buffer = device.createBuffer({
            size: totalLength,
            // size: totalLength * 4,
            usage: usage,
            mappedAtCreation: false,
        });

        this.memory.allocation(totalLength);
        for (let i = 0; i < count; i++) {
            let name = i;

            let node = this.memoryNodes.get(name);
            if (!node) {
                node = this.memory.allocation_node(structSize);
                this.memoryNodes.set(name, node);
            }
        }
    }

    private _readFlag: boolean = false;
    public readBuffer() {
        if (!this._readBuffer) {
            this._readBuffer = webGPUContext.device.createBuffer({
                size: this.memory.shareDataBuffer.byteLength,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
                mappedAtCreation: false,
            });
        }

        if (!this._readFlag) {
            this.read();
        }
        return this.outFloat32Array;
    }

    private async read() {
        this._readFlag = true;

        let command = webGPUContext.device.createCommandEncoder();;
        command.copyBufferToBuffer(this.buffer, 0, this._readBuffer, 0, this.memory.shareDataBuffer.byteLength);
        webGPUContext.device.queue.submit([command.finish()]);

        await this._readBuffer.mapAsync(GPUMapMode.READ);
        const copyArrayBuffer = this._readBuffer.getMappedRange();
        this.outFloat32Array.set(new Float32Array(copyArrayBuffer), 0);
        // this.memory.shareDataBuffer.set(new Float32Array(copyArrayBuffer), 0);
        this._readBuffer.unmap();
        this._readFlag = false;
    }
}

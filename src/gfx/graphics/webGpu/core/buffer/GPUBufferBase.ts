import { ArrayBufferData } from "./ArrayBufferData";
import { GPUBufferType } from "./GPUBufferType";
import { Color } from "../../../../../math/Color";
import { Matrix4 } from "../../../../../math/Matrix4";
import { Quaternion } from "../../../../../math/Quaternion";
import { Vector2 } from "../../../../../math/Vector2";
import { Vector3 } from "../../../../../math/Vector3";
import { Vector4 } from "../../../../../math/Vector4";
import { Struct } from "../../../../../util/struct/Struct";

import { Context3D, bindCtx } from "../../Context3D";
import { MemoryDO } from "../../../../../core/pool/memory/MemoryDO";
import { MemoryInfo } from "../../../../../core/pool/memory/MemoryInfo";
import { FloatArray } from "../../../../../components/matrix/WasmMatrix";

/**
 * CPU-authoritative GPU buffer (Plan B).
 *
 * The CPU-side memory (`memory`, `memoryNodes`) is the single source of
 * truth. The GPU buffer is a **single field** materialized lazily the
 * first time this object is used; from that point on, this buffer is
 * bound to exactly one Context3D. Attempting to use it with a different
 * engine throws via `bindCtx()`.
 *
 * Constructors do NOT allocate on the GPU.
 *
 * @internal
 * @group GFX
 */
export class GPUBufferBase {
    public bufferType: GPUBufferType;
    public memory: MemoryDO;
    public memoryNodes: Map<string | number, MemoryInfo>;
    public seek: number;
    public outFloat32Array: Float32Array;
    public byteSize: number;
    public usage: GPUBufferUsageFlags;
    public visibility: number = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
    protected mapAsyncBuffersOutstanding = 0;
    protected mapAsyncReady: GPUBuffer[];
    private _warnedPendingStaging = false;
    private _dataView: Float32Array;

    /** The Context3D this buffer is bound to. Set on first GPU use via `bindCtx`. */
    public _boundCtx: Context3D | null = null;
    /** The single GPU buffer. Null until first materialize. */
    private _buffer: GPUBuffer | null = null;
    /** Single readback staging buffer. Null until first `readBuffer`. */
    private _readBuffer: GPUBuffer | null = null;
    private _label?: string;

    constructor() {
        this.mapAsyncReady = [];
    }

    /**
     * Ensure this buffer is bound to a Context3D and return it. A ctx must
     * be available either by explicit arg or via prior `bindCtx()` — there
     * is no ambient fallback.
     */
    protected _ensureBound(ctx?: Context3D): Context3D {
        if (ctx) { bindCtx(this, ctx); return ctx; }
        if (this._boundCtx) return this._boundCtx;
        throw new Error(`GPUBuffer(${this.constructor.name}) used before bindCtx — thread a Context3D from the owning Engine3D.`);
    }

    /**
     * Return the GPU buffer. Materializes lazily on first access.
     * Callers must have bound this buffer to a Context3D via `bindCtx()`
     * before touching `.buffer`.
     */
    public get buffer(): GPUBuffer {
        this._ensureBound();
        if (!this._buffer) this._materialize(this._boundCtx!);
        return this._buffer!;
    }

    /**
     * Materialize this buffer on its bound Context3D. Uploads any CPU-side
     * initial data via queue.writeBuffer.
     */
    private _materialize(ctx: Context3D): void {
        if (!this.usage || !this.byteSize) {
            throw new Error(`GPUBufferBase._materialize: usage/byteSize not set (call createBuffer() first)`);
        }
        this._buffer = ctx.device.createBuffer({
            label: this._label,
            size: this.byteSize,
            usage: this.usage,
            mappedAtCreation: false,
        });
        if (this.memory && this.memory.shareDataBuffer) {
            ctx.device.queue.writeBuffer(this._buffer, 0, this.memory.shareDataBuffer);
        }
    }

    /** Destroy the materialized GPU buffer, forcing re-materialization on next access. */
    private _invalidateGpu() {
        if (this._buffer) {
            try { this._buffer.destroy(); } catch { /* ignore */ }
            this._buffer = null;
        }
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


    public readBoole(name: string): boolean {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getFloat() == 0 ? false : true;
        }
        return null;
    }

    public setFloat(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setX(v);
    }

    public getFloat(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getFloat();
        }
        return null;
    }

    public setInt8(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 1);
            this.memoryNodes.set(name, node);
        }
        node.setInt8(v);
    }

    public getInt8(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getInt8();
        }
        return null;
    }

    public setInt16(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 2);
            this.memoryNodes.set(name, node);
        }
        node.setInt16(v);
    }

    public getInt16(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getInt16();
        }
        return null;
    }

    public setInt32(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setInt32(v);
    }

    public getInt32(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getInt32();
        }
        return null;
    }

    public setUint8(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 1);
            this.memoryNodes.set(name, node);
        }
        node.setUint8(v);
    }

    public getUint8(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getUint8();
        }
        return null;
    }


    public setUint16(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 2);
            this.memoryNodes.set(name, node);
        }
        node.setUint16(v);
    }

    public getUint16(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getUint16();
        }
        return null;
    }

    public setUint32(name: string, v: number) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(1 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setUint32(v);
    }

    public getUint32(name: string): number {
        let node = this.memoryNodes.get(name);
        if (node) {
            return node.getUint32();
        }
        return null;
    }

    public setVector2(name: string, v2: Vector2) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(2 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXY(v2.x, v2.y);
    }

    public getVector2(name: string): Vector2 {
        let node = this.memoryNodes.get(name);
        if (node) {
            return new Vector2(node.x, node.y);
        }
        return null;
    }

    public setVector3(name: string, v3: Vector3) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(3 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXYZ(v3.x, v3.y, v3.z);
    }

    public getVector3(name: string): Vector3 {
        let node = this.memoryNodes.get(name);
        if (node) {
            return new Vector3(node.x, node.y, node.z);
        }
        return null;
    }

    public setVector4(name: string, v4: Vector4 | Quaternion) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(4 * 4);
            this.memoryNodes.set(name, node);
        }
        node.setXYZW(v4.x, v4.y, v4.z, v4.w);
    }

    public getVector4(name: string): Vector4 {
        let node = this.memoryNodes.get(name);
        if (node) {
            return new Vector4(node.x, node.y, node.z, node.w);
        }
        return null;
    }

    public setVector4Array(name: string, v4Array: Vector3[] | Vector4[] | Quaternion[]) {
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

    public getColor(name: string): Color {
        let node = this.memoryNodes.get(name);
        if (node) {
            return new Color(node.x, node.y, node.z, node.w);
        }
        return null;
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

        node.setFloatArray(0, mat.rawData);
    }

    public setMatrixArray(name: string, mats: Matrix4[]) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(16 * 4 * mats.length);
            this.memoryNodes.set(name, node);
        }
        for (let i = 0; i < mats.length; i++) {
            const mat = mats[i];
            node.setFloatArray(i * 16, mat.rawData);
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


    public setUint32Array(name: string, data: Uint32Array) {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(data.length * 4);
            this.memoryNodes.set(name, node);
        }
        node.setUint32Array(0, data);
    }

    public allocMemoryNode(name: string, byteSize: number): MemoryInfo {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(byteSize);
            this.memoryNodes.set(name, node);
        }
        return node;
    }

    public getMemoryNode(name: string): MemoryInfo {
        return this.memoryNodes.get(name);
    }

    public setStruct<T extends Struct>(c: { new(): T }, index: number, data: any, property?: string) {
        let ref = Struct.Ref(c);

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
            this.writeValue(node, att, value);
        }
    }

    private writeValue(node: MemoryInfo, att: { name: string, type: string }, value: any) {
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

            case `Float64Array`:
                node.writeFloat32Array(new Float32Array(value));
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

    public setStructArray<T extends Struct>(c: { new(): T }, dataList: any[], property?: string) {
        let len = dataList.length;
        for (let i = 0; i < len; i++) {
            const data = dataList[i];
            this.setStruct(c, i, data, property);
        }
    }

    public clean() {
        this._dataView.fill(0, 0, this._dataView.length);
    }

    /**
     * Upload CPU-side memory to the GPU buffer. Lazy-materializes when a
     * Context3D is available. If called with no ctx and the buffer is not
     * yet bound, the upload is DEFERRED: CPU data remains in
     * `shareDataBuffer` and flows to the GPU automatically when `.buffer`
     * is first accessed with a real ctx (via `_materialize`).
     */
    public apply(ctx?: Context3D) {
        if (!this.memory || !this.memory.shareDataBuffer) return;
        if (!ctx && !this._boundCtx) return; // defer until first GPU use
        const bound = this._ensureBound(ctx);
        if (!this._buffer && this.usage && this.byteSize) {
            this._materialize(bound);
            return;
        }
        if (this._buffer) {
            bound.device.queue.writeBuffer(this._buffer, 0, this.memory.shareDataBuffer);
        }
    }

    /** Max idle staging buffers kept in `mapAsyncReady`; extras are destroyed
     *  when their mapAsync resolves so a burst of slow frames (asset parsing,
     *  hidden tab, GPU stall) cannot pin dozens of full-size copies forever. */
    protected static readonly MAX_IDLE_STAGING = 3;
    /** In-flight `mapAsync` count above which we warn — a real "GPU has not
     *  handed the staging buffer back" signal, not the total pool size. */
    protected static readonly WARN_PENDING_STAGING = 60;

    public mapAsyncWrite(floatArray: FloatArray, len: number) {
        let mapAsyncArray: Float32Array;
        if (floatArray instanceof Float64Array) {
            mapAsyncArray = new Float32Array(floatArray);
        } else {
            mapAsyncArray = floatArray as Float32Array;
        }
        // Upload data using mapAsync and a queue of staging buffers.
        this._ensureBound();
        const ctx = this._boundCtx!;
        const device = ctx.device;
        const destBuffer = this.buffer; // ensures materialized
        if (mapAsyncArray.length > 0) {
            let tBuffer: GPUBuffer = null;
            while (this.mapAsyncReady.length) {
                tBuffer = this.mapAsyncReady.shift();
                if (tBuffer['usedSize'] == mapAsyncArray.byteLength)
                    break;
                tBuffer.destroy();
                tBuffer = null;
            }
            if (!tBuffer) {
                tBuffer = device.createBuffer({
                    size: mapAsyncArray.byteLength,
                    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
                    mappedAtCreation: true,
                });
                tBuffer['usedSize'] = mapAsyncArray.byteLength;

                // `mapAsyncBuffersOutstanding` counts staging buffers whose
                // mapAsync has not resolved yet. It used to count every buffer
                // ever created (never decremented on reuse), so after one slow
                // startup burst it stayed above the threshold and this warning
                // fired on every frame for the rest of the session.
                // Warn once per backlog episode (pipeline compilation on the
                // first frames routinely stalls map callbacks for 20+ frames),
                // then stay quiet until the backlog has drained.
                if (this.mapAsyncBuffersOutstanding > GPUBufferBase.WARN_PENDING_STAGING && !this._warnedPendingStaging) {
                    this._warnedPendingStaging = true;
                    const mb = (this.mapAsyncBuffersOutstanding * mapAsyncArray.byteLength / (1024 * 1024)).toFixed(2);
                    console.warn(`[GPUBufferBase] ${this.mapAsyncBuffersOutstanding} mapAsync staging uploads still pending (${mb} MB); the GPU is falling behind CPU-side matrix uploads.`);
                }
            }
            let a = new Float32Array(mapAsyncArray.buffer, mapAsyncArray.byteOffset, len);
            let b = new Float32Array(tBuffer.getMappedRange(0, len * 4))
            b.set(a);
            tBuffer.unmap();
            const commandEncoder = device.createCommandEncoder();
            commandEncoder.copyBufferToBuffer(tBuffer, 0, destBuffer, 0, len * 4);
            device.queue.submit([commandEncoder.finish()]);
            this.mapAsyncBuffersOutstanding++;
            tBuffer.mapAsync(GPUMapMode.WRITE).then(
                () => {
                    this.mapAsyncBuffersOutstanding--;
                    if (this.mapAsyncBuffersOutstanding === 0) this._warnedPendingStaging = false;
                    // Buffer was destroyed (or pool is already full) → release
                    // instead of hoarding a full-size copy.
                    if (!this.mapAsyncReady || this.mapAsyncReady.length >= GPUBufferBase.MAX_IDLE_STAGING) {
                        tBuffer.unmap();
                        tBuffer.destroy();
                    } else {
                        this.mapAsyncReady.push(tBuffer);
                    }
                },
                (err) => {
                    this.mapAsyncBuffersOutstanding--;
                    // device.destroy() during dispose rejects pending mapAsync with AbortError.
                    if (err?.name !== 'AbortError') throw err;
                },
            );
        }
    }

    public destroy() {
        if (this.memoryNodes) {
            this.memoryNodes.forEach((v) => {
                v.destroy();
            })
        }

        this.bufferType = null;
        this.seek = null;
        this.byteSize = null;
        this.usage = null;
        this.visibility = null;

        this.outFloat32Array = null;
        this._invalidateGpu();

        if (this.memory) {
            this.memory.destroy();
        }
        this.memory = null;

        if (this._readBuffer) {
            try { this._readBuffer.destroy(); } catch { /* ignore */ }
            this._readBuffer = null;
        }
        if (this.mapAsyncReady) {
            for (const b of this.mapAsyncReady) {
                try { b.unmap(); b.destroy(); } catch { /* ignore */ }
            }
            // Null (not []) so in-flight mapAsync resolutions release their
            // buffer instead of re-populating a pool nobody will drain.
            this.mapAsyncReady = null;
        }
        this._boundCtx = null;
    }

    /**
     * Configure this buffer. Does NOT allocate a GPU buffer — that happens
     * lazily per context in `get buffer`.
     */
    protected createBuffer(usage: GPUBufferUsageFlags, size: number, data?: ArrayBufferData, debugLabel?: string) {
        this._invalidateGpu();

        this.byteSize = size * 4;
        this.usage = usage;
        this._label = debugLabel;

        this.memory = new MemoryDO();
        this.memoryNodes = new Map<string | number, MemoryInfo>();
        this._dataView = new Float32Array(this.memory.shareDataBuffer);
        this.memory.allocation(this.byteSize);
        if (data) {
            let m = this.memory.allocation_node(data.length * 4);
            m.setArrayBuffer(0, data as unknown as ArrayBuffer);
        }
    }

    public resizeBuffer(size: number, data?: ArrayBufferData) {
        this.createBuffer(this.usage, size, data);
    }

    protected createNewBuffer(usage: GPUBufferUsageFlags, size: number): GPUBuffer {
        this._ensureBound();
        let device = this._boundCtx!.device;
        let tByteSize = size * 4;
        let tUsage = usage;
        this._invalidateGpu();
        let buffer = device.createBuffer({
            size: tByteSize,
            usage: tUsage,
            mappedAtCreation: false,
        });
        return buffer;
    }

    protected createBufferByStruct<T extends Struct>(usage: GPUBufferUsageFlags, struct: { new(): T }, count: number) {
        let structSize = Struct.GetSize(struct);
        let totalLength = structSize * count;

        this._invalidateGpu();
        this.byteSize = totalLength;
        this.usage = usage;
        this._label = "StructStorageGPUBuffer";

        this.memory = new MemoryDO();
        this.memoryNodes = new Map<string | number, MemoryInfo>();
        this._dataView = new Float32Array(this.memory.shareDataBuffer);
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

    public readBuffer(): Float32Array
    public readBuffer(promise: false) : Float32Array
    public readBuffer(promise: true) : Promise<Float32Array>
    public readBuffer(promise = false) {
        this.outFloat32Array ||= new Float32Array(this.memory.shareDataBuffer.byteLength / 4);

        const ctx = this._ensureBound();
        if (!this._readBuffer) {
            this._readBuffer = ctx.device.createBuffer({
                size: this.memory.shareDataBuffer.byteLength,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
                mappedAtCreation: false,
            });
        }

        let p = this.read(ctx, this._readBuffer);
        return promise ? p : this.outFloat32Array;
    }

    private _readFlag: boolean = false;
    private async read(ctx: Context3D, rb: GPUBuffer) {
        if (!this._readFlag) {
            this._readFlag = true;

            let command = ctx.device.createCommandEncoder();
            command.copyBufferToBuffer(this.buffer, 0, rb, 0, this.memory.shareDataBuffer.byteLength);
            ctx.device.queue.submit([command.finish()]);

            await rb.mapAsync(GPUMapMode.READ);
            const copyArrayBuffer = rb.getMappedRange();
            this.outFloat32Array.set(new Float32Array(copyArrayBuffer), 0);
            rb.unmap();
            this._readFlag = false;
        }
        return this.outFloat32Array;
    }
}

import { MemoryInfo } from './MemoryInfo';

/**
 * @internal
 * @group Core
 */
export class MemoryDO {
    public shareDataBuffer: ArrayBuffer;
    private _byteOffset: number = 0;

    public allocation(byteSize: number) {
        if (this.shareDataBuffer && this.shareDataBuffer.byteLength < byteSize) {
            this._byteOffset = 0;
        } else {
            this.shareDataBuffer = new ArrayBuffer(byteSize);
        }
    }

    public allocation_node(byteSize: number): MemoryInfo {
        if (this._byteOffset + byteSize > this.shareDataBuffer.byteLength) {
            console.error('memory not enough!', this._byteOffset, byteSize, this.shareDataBuffer.byteLength);
            return null;
        }

        let memoryInfo = new MemoryInfo();
        memoryInfo.byteOffset = this._byteOffset;
        memoryInfo.byteSize = byteSize;
        memoryInfo.dataBytes = new DataView(this.shareDataBuffer, this._byteOffset, memoryInfo.byteSize);
        this._byteOffset += memoryInfo.byteSize;
        return memoryInfo;
    }

    public allocation_memory(memoryInfo: MemoryInfo): MemoryInfo {
        if (this._byteOffset + memoryInfo.byteSize > this.shareDataBuffer.byteLength) {
            console.error('memory not enough!', this._byteOffset, memoryInfo.byteSize, this.shareDataBuffer.byteLength);
            return null;
        }

        memoryInfo.byteOffset = this._byteOffset;
        memoryInfo.dataBytes = new DataView(this.shareDataBuffer, this._byteOffset, memoryInfo.byteSize);
        this._byteOffset += memoryInfo.byteSize;
        return memoryInfo;
    }

    public reset() {
        this._byteOffset = 0;
    }

    public destroy() {
        this.shareDataBuffer = null;
        this._byteOffset = 0;
    }
}

// export let MemoryPool = new _MemoryPool();

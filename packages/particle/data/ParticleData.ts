import { MemoryInfo } from "@orillusion/core";

/**
 * @internal
 * particle data
 * @group Plugin
 */
export class ParticleData {
    constructor() { }

    public totalCount: number = 0;
    public memoryList: MemoryInfo[] = [];

    public getUint32(): MemoryInfo {
        let info = new MemoryInfo();
        info.byteSize = 1 * 4;
        this.totalCount += info.byteSize / 4;
        this.memoryList.push(info);
        return info;
    }

    public getFloat(): MemoryInfo {
        let info = new MemoryInfo();
        info.byteSize = 1 * 4;
        this.totalCount += info.byteSize / 4;
        this.memoryList.push(info);
        return info;
    }

    public getVec2(): MemoryInfo {
        let info = new MemoryInfo();
        info.byteSize = 2 * 4;
        this.totalCount += info.byteSize / 4;
        this.memoryList.push(info);
        return info;
    }

    public getVec3(): MemoryInfo {
        let info = new MemoryInfo();
        info.byteSize = 4 * 4;
        this.totalCount += info.byteSize / 4;
        this.memoryList.push(info);
        return info;
    }

    public getVec4(): MemoryInfo {
        let info = new MemoryInfo();
        info.byteSize = 4 * 4;
        this.totalCount += info.byteSize / 4;
        this.memoryList.push(info);
        return info;
    }
}

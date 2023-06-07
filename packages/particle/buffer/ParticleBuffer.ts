import { MemoryInfo, GPUBufferBase } from "@orillusion/core";

/**
 * Basic class of particle memory data
 * @group Particle 
 */
export class ParticleBuffer extends GPUBufferBase {
    constructor(size: number, data?: Float32Array) {
        super();
        if (size > 0) {
            this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST, size, data);
        }
    }

    public alloc(name: string, byte: number): MemoryInfo {
        let node = this.memoryNodes.get(name);
        if (!node) {
            node = this.memory.allocation_node(byte);
            this.memoryNodes.set(name, node);
        }
        return node;
    }

    public allocInt8(name: string): MemoryInfo {
        return this.alloc(name, 1);
    }

    public allocUint8(name: string): MemoryInfo {
        return this.alloc(name, 1);
    }

    public allocInt16(name: string): MemoryInfo {
        return this.alloc(name, 2);
    }

    public allocUint16(name: string): MemoryInfo {
        return this.alloc(name, 2);
    }

    public allocInt32(name: string): MemoryInfo {
        return this.alloc(name, 4);
    }

    public allocUint32(name: string): MemoryInfo {
        return this.alloc(name, 4);
    }

    public allocFloat32(name: string): MemoryInfo {
        return this.alloc(name, 4);
    }

    public allocVec2(name: string): MemoryInfo {
        return this.alloc(name, 4 * 2);
    }

    public allocVec3(name: string): MemoryInfo {
        return this.alloc(name, 4 * 3);
    }

    public allocVec4(name: string): MemoryInfo {
        return this.alloc(name, 4 * 4);
    }
}
import { Ctor } from "@orillusion/core";
import { ParticleData } from '../data/ParticleData';
import { ParticleBuffer } from './ParticleBuffer';

/**
 * @internal
 * particle data for each quad
 * @group Plugin
 */
export class ParticleLocalMemory extends ParticleBuffer {
    public particlesData: ParticleData[] = [];

    public onChange: boolean = false;

    public allocationParticle<T extends ParticleData>(count: number, c: Ctor<T>): void {
        if (this.particlesData.length >= count) {
            return
        }

        for (let i = this.particlesData.length; i < count; i++) {
            let pd = c[`generateParticleData`]();
            this.particlesData.push(pd);
        }
        let singleCount = this.particlesData.length > 0 ? this.particlesData[0].totalCount : 0;

        let byteSize = Math.max(singleCount * count * 4, 32);
        if (this.byteSize == undefined || this.byteSize < byteSize) {
            this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC, byteSize);
        }
        this.reset();

        for (let i = 0; i < count; i++) {
            const pd = this.particlesData[i];
            pd.memoryList.forEach((v) => {
                this.memory.allocation_memory(v);
            });
            // pd.memoryList.length = 0;
            // pd.memoryList = null;
        }

        this.onChange = true;
    }
}

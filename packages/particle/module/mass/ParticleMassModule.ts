import { ComputeGPUBuffer } from "@orillusion/core";
import { ParticleModuleBase } from '../stand/ParticleModuleBase';
/**
 * @internal
 * @group Plugin
 */
export class ParticleMassModule extends ParticleModuleBase {
    protected init(): void { }

    public calculateParticle(globalBuffer: ComputeGPUBuffer, localData: ComputeGPUBuffer) {
        // let count = this.simulator.maxParticle;
        // localModule.allocationParticle(count, ParticleMassData);
        // let particlesDate: ParticleMassData[] = localModule.particlesDate as ParticleMassData[];
        // {
        //     const SPH_PARTICLE_RADIUS = 0.005;
        //     // const scale = -0.625;
        //     const scale = -0.325;
        //     for (let i = 0, x = 0, y = 0; i < count; i++) {
        //         let px = scale + SPH_PARTICLE_RADIUS * 2 * x;
        //         let py = 1 + SPH_PARTICLE_RADIUS * 2 * y;
        //         let pz = scale + SPH_PARTICLE_RADIUS * 2 * x;
        //         particlesDate[i].position.setXYZ(px, py, pz);
        //         x++;
        //         if (x >= 125) {
        //             x = 0;
        //             y--;
        //         }
        //     }
        // }
    }
}

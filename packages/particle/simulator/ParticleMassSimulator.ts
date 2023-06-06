import { ParticleMassModule } from '../module/mass/ParticleMassModule';
import { ParticleSimulator } from './ParticleSimulator';
/**
 * @internal
 * @group Particle
 */
export class ParticleMassSimulator extends ParticleSimulator {
    constructor() {
        super();
        this.addModule(ParticleMassModule);
    }

    protected initPipeline() {
        // this.computes = [
        //     new ParticleCompute(compute_density_pressure_compute, [this.particleBufferEntries, this.particleGlobalBufferEntries]),
        //     new ParticleCompute(compute_force_compute, [this.particleBufferEntries, this.particleGlobalBufferEntries]),
        //     new ParticleCompute(integrate_compute, [this.particleBufferEntries, this.particleGlobalBufferEntries]),
        // ];
    }

    protected generateGlobalParticleData() {
        // {
        //     // SMOOTHING_LENGTH:f32,
        //     // PARTICLE_MASS:f32,
        //     // PI_FLOAT:f32,
        //     // PARTICLE_STIFFNESS:f32,
        //     // PARTICLE_RESTING_DENSITY:f32,
        //     // PARTICLE_VISCOSITY:f32,
        //     // TIME_STEP:f32,
        //     // WALL_DAMPING:f32
        //     this.particleGlobalMemory.allocationParticle([
        //         { name: `maxParticle`, data: [this.maxParticle] },
        //         { name: `time`, data: [0] },
        //         { name: `timeDelta`, data: [0] },

        //         { name: `gravity`, data: [0.0, 9.8, 0.0] },
        //         { name: `spaceDamping`, data: [0.0] },

        //         { name: `cameraPos`, data: [0, 0, 0, 0] },

        //         { name: `SMOOTHING_LENGTH`, data: [4 * 0.005] },
        //         { name: `PARTICLE_MASS`, data: [0.02] },
        //         { name: `PI_FLOAT`, data: [3.1415927410125732421875] },
        //         { name: `PARTICLE_STIFFNESS`, data: [2000] },
        //         { name: `PARTICLE_RESTING_DENSITY`, data: [1000] },
        //         { name: `PARTICLE_VISCOSITY`, data: [3000] },
        //         { name: `TIME_STEP`, data: [0.0001] },
        //         { name: `WALL_DAMPING`, data: [0.3] },
        //     ]);
        // }
        // {
        //     let globalData = this.particleGlobalMemory;
        //     // globalUniform.particleGlobalData['gravity'].setXYZ(0, -9806.65, 0);
        //     // globalUniform.particleGlobalData['SMOOTHING_LENGTH'].setX(4 * 0.005);
        //     // globalUniform.particleGlobalData['PARTICLE_MASS'].setX(0.25);
        //     // globalUniform.particleGlobalData['PI_FLOAT'].setX(3.1415927410125732421875);
        //     // globalUniform.particleGlobalData['PARTICLE_STIFFNESS'].setX(2000);
        //     // globalUniform.particleGlobalData['PARTICLE_RESTING_DENSITY'].setX(1000);
        //     // globalUniform.particleGlobalData['PARTICLE_VISCOSITY'].setX(3000);
        //     // globalUniform.particleGlobalData['TIME_STEP'].setX(0.0001);
        //     // globalUniform.particleGlobalData['WALL_DAMPING'].setX(0.3);

    }

    public compute(command: GPUCommandEncoder) {
        // for (let i = 0; i < this.computes.length; i++) {
        //     const element = this.computes[i];
        //     element.compute(command, Math.ceil(this.maxParticle / 128), 1);
        // }
    }
}

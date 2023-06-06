import { Vector4 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * Particle module of size scale over life time
 * @group Particle 
 */
export class ParticleOverLifeScaleModule extends ParticleModuleBase {
    /**
    * Describe the size scale change of particles from birth to end
    */
    public scaleSegments: Vector4[] = [new Vector4(1.0, 1.0, 1.0, 1), new Vector4(2.0, 2.0, 2.0, 1)];

    /**
     * Genarate particle size scale module with type over life time 
     * @param globalMemory
     * @param localMemory
     */
    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        globalMemory.setVector4Array(`overLife_scale`, this.scaleSegments);
    }
}

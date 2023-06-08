import { Vector4 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * Particle module of move speed over life time
 * @group Particle 
 */
export class ParticleOverLifeSpeedModule extends ParticleModuleBase {

    /**
    * Describe the velocity change of particles from birth to end
    */
    public speedSegments: Vector4[] = [new Vector4(0, 0, 0, 0), new Vector4(0, 0, 0, 0)];


    /**
     * Genarate particle move speed module with type over life time 
     * @param globalMemory
     * @param localMemory
     * 
     */
    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        globalMemory.setVector4Array(`overLife_speed`, this.speedSegments);
    }
}

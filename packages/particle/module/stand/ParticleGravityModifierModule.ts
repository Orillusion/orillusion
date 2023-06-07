import { Vector3 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * Particle module of gravity modifier
 * @group Particle 
 */
export class ParticleGravityModifierModule extends ParticleModuleBase {

    /**
     * Set gravity
     */
    public set gravity(value: Vector3) {
        this._gravity = value;
        const globalMemory = this._simulator.particleGlobalMemory;
        globalMemory.setVector3(`gravity`, this.gravity);
    }

    /**
     * Get gravity
     */
    public get gravity(): Vector3 {
        return this._gravity;
    }


    private _gravity: Vector3 = new Vector3(0, -9.8, 0);

    /**
     * Genarate particle gravity module
     * @param globalMemory
     * @param localMemory
     */
    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        globalMemory.setVector3(`gravity`, this.gravity);
    }
}

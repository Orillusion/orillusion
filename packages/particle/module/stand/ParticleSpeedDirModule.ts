import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * @internal
 * @group Particle
 */
export class ParticleSpeedDirModule extends ParticleModuleBase {
    private _enable: boolean = true;

    public get enable(): boolean {
        return this._enable;
    }

    public set enable(value: boolean) {
        this._enable = value;
        const globalMemory = this._simulator.particleGlobalMemory;
        globalMemory.setFloat(`enable_dirBySpeed`, this.enable ? 1 : 0);
    }

    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        globalMemory.setFloat(`enable_dirBySpeed`, this.enable ? 1 : 0);
    }
}

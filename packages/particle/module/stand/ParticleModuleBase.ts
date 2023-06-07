import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleSimulator } from '../../simulator/ParticleSimulator';
/**
 * @internal
 * @group Plugin
 */
export class ParticleModuleBase {
    protected _simulator: ParticleSimulator;

    private __init() {
        this.init();
    }

    protected init() { }

    public set needReset(v: boolean) {
        this._simulator.needReset = v;
    }

    public get needReset(): boolean {
        return this._simulator.needReset;
    }

    public setSimulator(simulator: ParticleSimulator) {
        this._simulator = simulator;
    }

    public calculateParticle(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
    }

    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
    }
}

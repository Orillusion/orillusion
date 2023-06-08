import { MemoryInfo } from "@orillusion/core";
import { ParticleData } from './ParticleData';

/**
 * @internal
 * particle mass data
 * @group Plugin
 */
export class ParticleMassData extends ParticleData {
    public position: MemoryInfo;
    public velocity: MemoryInfo;
    public force: MemoryInfo;
    public density: MemoryInfo;
    public pressure: MemoryInfo;

    public data1: MemoryInfo;
    public data2: MemoryInfo;

    constructor() {
        super();
    }

    public static generateParticleData(): ParticleMassData {
        let pd = new ParticleMassData();
        pd.position = pd.getVec4();
        pd.velocity = pd.getVec4();
        pd.force = pd.getVec4();

        pd.density = pd.getFloat();
        pd.pressure = pd.getFloat();
        pd.data1 = pd.getFloat();
        pd.data2 = pd.getFloat();
        return pd;
    }
}

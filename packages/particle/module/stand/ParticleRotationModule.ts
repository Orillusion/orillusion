import { MinMaxCurve } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleStandardData } from '../../data/ParticleStandardData';
import { ParticleStandardSimulator } from '../../simulator/ParticleStandardSimulator';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * Particle Module of rotate quad
 * @group Particle 
 */
export class ParticleRotationModule extends ParticleModuleBase {

    /**
     * Returns angular velocity X-axis component of each quad
     */
    public get angularVelocityX(): MinMaxCurve {
        return this.angularVelocityXYZ[0]
    }

    /**
     * Set angular velocity X-axis component of each quad
     */
    public set angularVelocityX(value: MinMaxCurve) {
        this.angularVelocityXYZ[0] = value;
    }

    /**
     * Returns angular velocity Y-axis component of each quad
     */
    public get angularVelocityY(): MinMaxCurve {
        return this.angularVelocityXYZ[1]
    }

    /**
     * Set angular velocity Y-axis component of each quad
     */
    public set angularVelocityY(value: MinMaxCurve) {
        this.angularVelocityXYZ[1] = value;
    }

    /**
     * Returns angular velocity Z-axis component of each quad
     */
    public get angularVelocityZ(): MinMaxCurve {
        return this.angularVelocityXYZ[2]
    }

    /**
     * Get angular velocity Z-axis component of each quad
     */
    public set angularVelocityZ(value: MinMaxCurve) {
        this.angularVelocityXYZ[2] = value;
    }

    /**
     * angular velocity of each quad
     */
    public angularVelocityXYZ: MinMaxCurve[] = [new MinMaxCurve(0), new MinMaxCurve(0), new MinMaxCurve(0)];

    /**
     * Genarate particle rotate module, init angular velocity of each quad
     * @param globalMemory
     * @param localMemory
     * 
     */
    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        let maxCount = (this._simulator as ParticleStandardSimulator).maxActiveParticle;

        let particlesData = localMemory.particlesData as ParticleStandardData[];
        {
            for (let i = 0; i < maxCount; i++) {
                const pd = particlesData[i];

                pd.start_angularVelocity.setXYZ(
                    MinMaxCurve.evaluate(this.angularVelocityX, Math.random()),
                    MinMaxCurve.evaluate(this.angularVelocityY, Math.random()),
                    MinMaxCurve.evaluate(this.angularVelocityZ, Math.random())
                );
            }
        }
    }
}

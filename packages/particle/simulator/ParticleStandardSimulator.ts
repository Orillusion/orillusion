import { View3D, ComputeShader, Vector3, Vector4 } from "@orillusion/core";
import { ParticleEmitterModule } from "../module/stand/ParticleEmitterModule";
import { ParticleComputeShader } from "../shader/Particle_shader";
import { ParticleSimulator } from "./ParticleSimulator";

/**
 * Standard particle simulator
 * @group Particle 
 */
export class ParticleStandardSimulator extends ParticleSimulator {

    protected _emitterModule: ParticleEmitterModule;

    constructor() {
        super();
        this._emitterModule = this.addModule(ParticleEmitterModule);
    }

    /**
     * Get maximum number of active particles(read only)
     */
    public get maxActiveParticle(): number {
        return Math.min(
            Math.max(
                Math.ceil(this._emitterModule.emissionRate * this._emitterModule.duration),
                this._emitterModule.emissionRate
            ),
            this.maxParticle
        );
    }

    protected generateParticleGlobalData() {
        const globalData = this.particleGlobalMemory;
        {
            globalData.setVector3(`gravity`, new Vector3(0, 0, 0));
            globalData.setFloat(`spaceDamping`, 0);

            globalData.setFloat(`enable_dirBySpeed`, 0);
            globalData.setFloat(`enable_dirBySpeed1`, 0);
            globalData.setFloat(`enable_dirBySpeed2`, 0);
            globalData.setFloat(`enable_dirBySpeed3`, 0);

            globalData.setVector4Array(`overLife_scale`, [Vector4.ONE.clone(), Vector4.ONE.clone()]);
            globalData.setVector4Array(`overLife_colors`, [Vector4.ONE.clone(), Vector4.ONE.clone()]);
            globalData.setVector4Array(`overLife_rotations`, [Vector4.ZERO.clone(), Vector4.ZERO.clone()]);

            globalData.setVector4(`cameraPos`, Vector4.ZERO.clone());

            globalData.setUint32(`textureSheet_ClipCol`, 1);
            globalData.setUint32(`textureSheet_TotalClip`, 1);
            globalData.setFloat(`textureSheet_PlayRate`, 1.0);
            globalData.setUint32(`textureSheet_TextureWidth`, 1);
            globalData.setUint32(`textureSheet_TextureHeight`, 1);
            globalData.setFloat(`textureSheet_retain0`, 0);
            globalData.setFloat(`textureSheet_retain1`, 0);
            globalData.setFloat(`textureSheet_retain2`, 0);

            globalData.apply();
        }
    }

    protected generateParticleLocalData() {
    }

    protected initPipeline() {
        this._computes = [];
        let particleStandCompute = new ComputeShader(ParticleComputeShader);
        particleStandCompute.setStorageBuffer(`globalData`, this.particleGlobalMemory);
        particleStandCompute.setStorageBuffer(`particles`, this.particleLocalMemory);
        particleStandCompute.workerSizeX = Math.ceil(this.maxParticle / 64);
        this._computes.push(particleStandCompute);
        this.updateBuffer(0);
    }
}

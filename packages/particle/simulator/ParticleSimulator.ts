import { View3D, ComputeShader, GPUContext, Ctor } from "@orillusion/core";
import { ParticleSystem } from '../ParticleSystem';
import { ParticleGlobalMemory } from '../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from '../module/stand/ParticleModuleBase';

/**
 * enumerate particle simulator space.
 */
export enum SimulatorSpace {
    Local,
    World,
}

/**
 * @internal
 * @group Particle
 */
export class ParticleSimulator {
    public maxParticle: number = 1000;
    public needReset: boolean = true;

    /**
     * preheat time
     */
    public preheatTime: number = 0.0;

    protected _simulatorSpace: SimulatorSpace = SimulatorSpace.Local;

    /**
     * Set particle simulator space. see {@link SimulatorSpace}
     */
    public set simulatorSpace(v: SimulatorSpace) {
        this._simulatorSpace = v;
        this.particleGlobalMemory.setSimulatorSpace(this._simulatorSpace);
    }

    /**
     * Get particle simulator space.
     */
    public get simulatorSpace(): SimulatorSpace {
        return this._simulatorSpace;
    }

    /**
     * particle data for each quad
     */
    public particleLocalMemory: ParticleLocalMemory;

    /**
     * global particle data for all quad
     */
    public particleGlobalMemory: ParticleGlobalMemory;

    protected _particleModules: Map<string, ParticleModuleBase>;
    protected _computes: ComputeShader[];
    protected _looping: boolean = false;
    protected _particleSystem: ParticleSystem;

    constructor() {
        this._computes = [];
        this._particleModules = new Map<string, ParticleModuleBase>();
    }

    /**
     * Set need to loop animation
     */
    public set looping(value: boolean) {
        this._looping = value;
        this.particleGlobalMemory.setFloat(`isLoop`, value ? 1 : 0);
    }

    /**
     * Get need to loop animation
     */
    public get looping(): boolean {
        return this._looping;
    }

    /**
     * add a particle module
     * @param c class of particle module
     */
    public addModule<T extends ParticleModuleBase>(c: Ctor<T>) {
        if (!this._particleModules.has(c.prototype)) {
            let ret = new c();
            ret.setSimulator(this);
            ret[`__init`]();
            this._particleModules.set(c.prototype, ret);
            return ret;
        }
        return this.getModule(c);
    }

    /**
     * Get particle module
     * @param c class of particle module
     */
    public getModule<T extends ParticleModuleBase>(c: Ctor<T>): T {
        return this._particleModules.get(c.prototype) as T;
    }

    /**
     * Remove particle module
     * @param c class of particle module
     */
    public removeModule<T extends ParticleModuleBase>(c: Ctor<T>) {
        if (this._particleModules.has(c.prototype)) {
            this._particleModules.delete(c.prototype);
        }
    }

    protected initBuffer(ps: ParticleSystem) {
        this.particleLocalMemory = new ParticleLocalMemory(0);
        this.particleGlobalMemory = new ParticleGlobalMemory(64);
        this.particleGlobalMemory.setInstanceID(ps.transform._worldMatrix.index);
        this._particleSystem = ps;
        this.looping = true;
    }

    public build() {
        this.needReset = false;
        this.generateParticleGlobalData();
        this.generateParticleLocalData();
        this._particleModules.forEach((v, k) => {
            v.generateParticleModuleData(this.particleGlobalMemory, this.particleLocalMemory);
        });
        this.initPipeline();
    }

    protected generateParticleGlobalData() {
    }

    protected generateParticleLocalData() {
    }

    protected initPipeline() {
    }

    public compute(command: GPUCommandEncoder) {
        if (this._computes && this._computes.length > 0) {
            GPUContext.computeCommand(command, this._computes);
        }
    }

    public updateBuffer(delta: number) {
        if (this.needReset) {
            this.build();
        }

        {
            this.particleGlobalMemory.setTime(this.preheatTime);
            this.particleGlobalMemory.setTimeDelta(delta);

            // let pos = view.camera.transform.worldPosition;
            // this.particleGlobalMemory.setVector3(`cameraPos`, pos);

            let pos = this._particleSystem.transform.worldPosition;
            this.particleGlobalMemory.setVector3(`emitterPos`, pos);

            if (this.particleLocalMemory.onChange) {
                this.particleLocalMemory.onChange = false;
                this.particleLocalMemory.apply();
            }

            if (this.particleGlobalMemory.onChange) {
                this.particleGlobalMemory.onChange = false;
                this.particleGlobalMemory.apply();
            }
        }
    }

    public debug() {
    }
}

import { MemoryInfo, Vector3 } from "@orillusion/core";
import { ParticleBuffer } from './ParticleBuffer';

/**
 * @internal
 * global particle data for all quad
 * @group Plugin
 */
export class ParticleGlobalMemory extends ParticleBuffer {
    protected _instanceID: MemoryInfo;
    protected _maxParticles: MemoryInfo;
    protected _time: MemoryInfo;
    protected _timeDelta: MemoryInfo;
    protected _duration: MemoryInfo;
    protected _isLoop: MemoryInfo;
    protected _simulatorSpace: MemoryInfo;
    protected _retain1: MemoryInfo;
    protected _emitterPos: MemoryInfo;
    public onChange: boolean = false;

    constructor(size: number, data?: Float32Array) {
        super(size, data);
        this._instanceID = this.allocUint32(`instance_index`);
        this._maxParticles = this.allocUint32(`maxParticles`);
        this._time = this.allocFloat32(`time`);
        this._timeDelta = this.allocFloat32(`timeDelta`);
        this._duration = this.allocFloat32(`duration`);
        this._isLoop = this.allocFloat32(`isLoop`);
        this._simulatorSpace = this.allocUint32(`simulatorSpace`);
        this._retain1 = this.allocFloat32(`retain1`);
        this._emitterPos = this.allocVec4(`emitterPos`);
    }

    public setInstanceID(v: number) {
        this._instanceID.setUint32(v);
        this.onChange = true;
    }

    public getInstanceID(): number {
        return this._instanceID.getUint32();
    }

    public setMaxParticles(v: number) {
        this._maxParticles.setUint32(v);
        this.onChange = true;
    }

    public getMaxParticles(): number {
        return this._maxParticles.getUint32();
    }

    public setTime(v: number) {
        this._time.setFloat(v);
    }

    public getTime(): number {
        return this._time.getFloat()
    }

    public setTimeDelta(v: number) {
        this._timeDelta.setFloat(v);
        this.onChange = true;
    }

    public getTimeDelta(): number {
        return this._timeDelta.getFloat();
    }

    public setDuration(v: number) {
        this._duration.setFloat(v);
        this.onChange = true;
    }

    public getDuration(): number {
        return this._duration.getFloat();
    }

    public setSimulatorSpace(v: number) {
        this._simulatorSpace.setUint32(v);
        this.onChange = true;
    }

    public getSimulatorSpace(): number {
        return this._simulatorSpace.getUint32();
    }

    public setEmitterPos(pos: Vector3) {
        this._emitterPos.setXYZ(pos.x, pos.y, pos.z);
        this.onChange = true;
    }
}

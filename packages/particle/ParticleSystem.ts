import { ShaderLib, RenderNode, RendererMask, GeometryBase, Ctor, PlaneGeometry, Vector3, View3D, Time, Material, PassType } from "@orillusion/core";
import { ParticleMaterial } from "./material/ParticleMaterial";
import { ParticleSimulator } from "./simulator/ParticleSimulator";
import { ParticleDataStructShader } from "./shader/ParticleDataStruct";

/**
 * A particle system can simulate and render many small images or geometries, it called particles to produce visual effects
 * @group Particle 
 */
export class ParticleSystem extends RenderNode {
    /**
     * whether the animation will auto play
     */
    public autoPlay: boolean = true;

    /**
     * the simulator of particle.
     */
    public particleSimulator: ParticleSimulator;

    /**
     * playing status
     */
    public playing: boolean = false;

    /**
     * animation playing speed
     */
    public playSpeed: number = 1.0;

    constructor() {
        super();
        this.alwaysRender = true;
        this.renderOrder = 3001;
        this._rendererMask = RendererMask.Particle;
        ShaderLib.register('ParticleDataStruct', ParticleDataStructShader);
    }

    /**
     * material
     */
    public get material(): Material {
        return this._materials[0];
    }

    public set material(value: Material) {
        this.materials = [value];
    }

    /**
     * The geometry of the mesh determines its shape
     */
    public get geometry(): GeometryBase {
        return this._geometry;
    }

    public set geometry(value: GeometryBase) {
        //this must use super geometry has reference in super
        super.geometry = value;
        this.object3D.bound = this._geometry.bounds.clone();
        if (this._readyPipeline) {
            this.initPipeline();
        }
    }

    /**
     * Set preheat time(second)
     */
    public set preheatTime(value: number) {
        this.particleSimulator.preheatTime = value;
    }

    /**
     * Get preheat time(second)
     */
    public get preheatTime(): number {
        return this.particleSimulator.preheatTime;
    }

    /**
     * Set particle simulator's looping
     */
    public set looping(value: boolean) {
        this.particleSimulator.looping = value;
    }

    /**
     * Get particle simulator's looping
     */
    public get looping(): boolean {
        return this.particleSimulator.looping;
    }

    public init(): void {
        super.init();
    }

    /**
     * Set to use the specified particle emulator
     * @param c class of particle emulator
     */
    public useSimulator<T extends ParticleSimulator>(c: Ctor<T>) {
        this.particleSimulator = new c();
        this.particleSimulator[`initBuffer`](this);
        return this.particleSimulator;
    }

    /**
     * start to play animation, with a speed value
     * @param speed playSpeed, see{@link playSpeed}
     */
    public play(speed: number = 1.0) {
        this.playing = true;
        this.playSpeed = speed;
    }

    /**
     * stop playing
     */
    public stop(): void {
        this.playing = false;
    }

    public start(): void {
        if (!this.geometry) {
            this.geometry = new PlaneGeometry(1, 1, 1, 1, Vector3.Z_AXIS);
        }

        if (!this.material) {
            this.material = new ParticleMaterial();
        }

        this.particleSimulator.build();

        if (this.autoPlay) {
            this.playing = true;
        }

        let renderShader = this.material.getPass(PassType.COLOR)[0];
        renderShader.setStorageBuffer(`particleGlobalData`, this.particleSimulator.particleGlobalMemory);
        renderShader.setStorageBuffer(`particleLocalDatas`, this.particleSimulator.particleLocalMemory);
        this.instanceCount = this.particleSimulator.maxParticle;
    }

    private _frame: number = -1;
    private _time: number = 0;
    public onCompute(view: View3D, command: GPUCommandEncoder) {
        if (this._frame == -1) {
            this._frame = Time.frame;
            this._time += this.preheatTime;
            this.particleSimulator.updateBuffer(this.preheatTime);
            this.particleSimulator.compute(command);
            return;
        }

        if (this.playing) {
            this._frame = Time.frame;
            let delta = Time.delta * 0.001;
            delta *= this.playSpeed;
            this._time += delta;
            this.particleSimulator.updateBuffer(delta);
            this.particleSimulator.compute(command);
        }
    }
}

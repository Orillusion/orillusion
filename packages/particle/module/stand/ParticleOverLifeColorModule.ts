import { Color } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';


/**
 * Particle module of color change over life time
 * @group Particle 
 */
export class ParticleOverLifeColorModule extends ParticleModuleBase {

    /**
     * Set start color
     */
    public set startColor(v: Color) {
        this._colorSegments[0].copyFrom(v);
        this.needReset = true;
    }

    /**
     * Get start color
     */
    public get startColor(): Color {
        return this._colorSegments[0];
    }

    /**
     * Set start alpha
     */
    public set startAlpha(v: number) {
        this._colorSegments[0].a = v;
        this.needReset = true;
    }

    /**
     * Get start alpha
     */
    public get startAlpha(): number {
        return this._colorSegments[0].a;
    }

    /**
     * Set end color
     */
    public set endColor(v: Color) {
        this._colorSegments[1].copyFrom(v);
        this.needReset = true;
    }

    /**
     * Get end color
     */
    public get endColor(): Color {
        return this._colorSegments[1];
    }

    /**
    * Set end alpha
    */
    public set endAlpha(v: number) {
        this._colorSegments[1].a = v;
        this.needReset = true;
    }

    /**
     * Get end alpha
     */
    public get endAlpha(): number {
        return this._colorSegments[1].a;
    }

    private _colorSegments: Color[] = [new Color(1, 1, 1, 1), new Color(1, 1, 1, 1)];

    /**
     * Genarate particle color module with type over life time 
     * @param globalMemory
     * @param localMemory
     */
    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        globalMemory.setColorArray(`overLife_colors`, this._colorSegments);
    }
}

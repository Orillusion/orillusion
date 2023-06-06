import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';

/**
 * Particle Module of texture sheet
 * @group Particle 
 */
export class ParticleTextureSheetModule extends ParticleModuleBase {

    /**
     * The number of columns in the texture sheet
     */
    public clipCol: number = 1;

    /**
     * The total number of clips texture sheet
     */
    public totalClip: number = 1;

    /**
     * playing speed
     */
    public playRate: number = 1.0;

    /**
     * Texture width
     */
    public textureWidth: number = 1;

    /**
     * Texture Height
     */
    public textureHeight: number = 1;

    /**
     * play mode
     */
    public playMode: number = 0;

    /**
    * Genarate particle texture sheet module: such as clip col, total clip, play speed. 
    * @param globalMemory
    * @param localMemory
    * 
    */
    public generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory) {
        globalMemory.setUint32(`textureSheet_ClipCol`, this.clipCol);
        globalMemory.setUint32(`textureSheet_TotalClip`, this.totalClip);
        globalMemory.setFloat(`textureSheet_PlayRate`, this.playRate);
        globalMemory.setUint32(`textureSheet_TextureWidth`, this.textureWidth);
        globalMemory.setUint32(`textureSheet_TextureHeight`, this.textureHeight);
    }
}

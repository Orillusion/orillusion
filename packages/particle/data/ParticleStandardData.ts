import { MemoryInfo } from "@orillusion/core";
import { ParticleData } from './ParticleData';

/**
 * @internal
 * standard struct of standard particle
 * @group Plugin
 */
export class ParticleStandardData extends ParticleData {
    //transform storage
    public particleLifeDuration: MemoryInfo; // 3
    public start_time: MemoryInfo;
    public life_time: MemoryInfo;
    public hide: MemoryInfo;

    public vPos: MemoryInfo;
    public vRot: MemoryInfo;
    public vScale: MemoryInfo;
    public vColor: MemoryInfo;
    public vSpeed: MemoryInfo;

    public vForce_pos: MemoryInfo;
    public vForce_Rot: MemoryInfo;
    public vForce_Scale: MemoryInfo;

    // public vUvRectangle: MemoryInfo;

    // public vPosVelocity: MemoryInfo;
    // public vRotVelocity: MemoryInfo;
    // public vScaleVelocity: MemoryInfo;

    //source
    public start_pos: MemoryInfo;
    public start_size: MemoryInfo;
    public start_rotation: MemoryInfo;

    public start_velocity: MemoryInfo;
    public start_acceleration: MemoryInfo;

    public start_rotVelocity: MemoryInfo;
    public start_rotAcceleration: MemoryInfo;

    public start_scaleVelocity: MemoryInfo;
    public start_scaleAcceleration: MemoryInfo;

    public start_color: MemoryInfo;

    public start_angularVelocity: MemoryInfo;

    public textureSheet_Frame: MemoryInfo;
    protected retain0: MemoryInfo;
    protected retain1: MemoryInfo;
    protected retain2: MemoryInfo;

    public static generateParticleData(): ParticleStandardData {
        let pd = new ParticleStandardData();
        pd.particleLifeDuration = pd.getFloat();
        pd.start_time = pd.getFloat();
        pd.life_time = pd.getFloat();
        pd.hide = pd.getFloat();

        pd.vPos = pd.getVec4();
        pd.vRot = pd.getVec4();
        pd.vScale = pd.getVec4();
        pd.vColor = pd.getVec4();
        pd.vSpeed = pd.getVec4();

        pd.vForce_pos = pd.getVec4();
        pd.vForce_Rot = pd.getVec4();
        pd.vForce_Scale = pd.getVec4();

        //   pd.posVelocity = pd.getVec4();
        //   pd.rotVelocity = pd.getVec3();
        //   pd.scaleVelocity = pd.getVec3();

        pd.start_pos = pd.getVec4();
        pd.start_size = pd.getVec4();
        pd.start_rotation = pd.getVec4();

        pd.start_velocity = pd.getVec4();
        pd.start_acceleration = pd.getVec4();

        pd.start_rotVelocity = pd.getVec4();
        pd.start_rotAcceleration = pd.getVec4();

        pd.start_scaleVelocity = pd.getVec4();
        pd.start_scaleAcceleration = pd.getVec4();

        pd.start_color = pd.getVec4();

        pd.start_angularVelocity = pd.getVec4();

        pd.textureSheet_Frame = pd.getUint32();
        pd.retain0 = pd.getFloat();
        pd.retain1 = pd.getFloat();
        pd.retain2 = pd.getFloat();
        return pd;
    }
}

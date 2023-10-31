import { Matrix4 } from "../../../../math/Matrix4";
import { Vector3 } from "../../../../math/Vector3";
import { Probe } from "./Probe";
import { GlobalIlluminationSetting } from "../../../../setting/GlobalIlluminationSetting";
import { StorageGPUBuffer } from "../../../graphics/webGpu/core/buffer/StorageGPUBuffer";
import { UniformGPUBuffer } from "../../../..";
/**
 * @internal
 * @group Post
 */
export class DDGIIrradianceVolume {
    public setting: GlobalIlluminationSetting;
    public probesBufferData: Float32Array; //offset xyz frame
    public probesBuffer: StorageGPUBuffer;
    public isVolumeFrameChange: boolean = true;
    private randomOrientation: Matrix4;
    private startPosition: Vector3 = new Vector3();
    private isVolumeChange: boolean = true;
    public irradianceVolumeBuffer: UniformGPUBuffer;

    //__make random direction
    private readonly directionDistance: number = 20;
    private readonly randomSeedCount: number = 3;
    private useRandomIndex: number = 0;
    private centerDirection: Vector3 = new Vector3(0, 0, this.directionDistance).normalize(1.0);
    private arroundPositions: Vector3[] = [];
    //__end

    public updateOrientation(): Matrix4 {
        this.useRandomIndex++;
        if (this.useRandomIndex >= this.arroundPositions.length)
            this.useRandomIndex = 0;
        Matrix4.fromToRotation(this.centerDirection, this.arroundPositions[this.useRandomIndex], this.randomOrientation);
        return this.randomOrientation;
    }

    public init(setting: GlobalIlluminationSetting): void {
        this.setting = setting;
        this.randomOrientation = new Matrix4(false);
        this.randomOrientation.identity();
        this.irradianceVolumeBuffer = new UniformGPUBuffer(80);
        this.createFramesBuffer();
        //center
        this.arroundPositions.push(this.centerDirection.clone());
        //random seed
        for (let i = 0; i < this.randomSeedCount; i++) {
            let angle = (Math.PI * 2 * i) / this.randomSeedCount;
            let v = new Vector3(Math.sin(angle), Math.cos(angle), this.directionDistance).normalize(1.0);
            this.arroundPositions.push(v);
        }
    }

    public setVolumeDataChange() {
        this.isVolumeChange = true;
    }

    public updateProbes(probes: Probe[]): void {
        let frameArray = this.probesBufferData;
        for (let probe of probes) {
            let offset = probe.index * 4;
            frameArray[offset + 3] = probe.drawCallFrame;
        }
    }

    private createFramesBuffer(): void {
        if (!this.probesBufferData) {
            let size: number = this.setting.probeXCount * this.setting.probeYCount * this.setting.probeZCount;
            this.probesBufferData = new Float32Array(size * 4);
            this.probesBufferData.fill(-1);
            this.probesBuffer = new StorageGPUBuffer(size * 4, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
        }
    }

    public uploadBuffer(): void {
        if (this.isVolumeChange) {
            this.fillIrradianceData();
            this.isVolumeChange = false;
            this.isVolumeFrameChange = true;
        }
        this.probesBuffer.setFloat32Array("uniformFramesBuffer", this.probesBufferData);
    }

    public calcPosition(x: number, y: number, z: number, result?: Vector3): Vector3 {
        let setting = this.setting;
        let space: number = this.setting.probeSpace;

        result = result || new Vector3();
        result.x = x * space - space * (setting.probeXCount - 1) * 0.5 + setting.offsetX;
        result.y = y * space - space * (setting.probeYCount - 1) * 0.5 + setting.offsetY;
        result.z = z * space - space * (setting.probeZCount - 1) * 0.5 + setting.offsetZ;
        return result;
    }

    private debugX: number = 0;
    private debugY: number = 0;
    private debugZ: number = 0;
    private fillIrradianceData(): void {
        let setting = this.setting;

        let start = this.calcPosition(0, 0, 0, this.startPosition);
        this.irradianceVolumeBuffer.setFloat("orientationIndex", this.randomOrientation.index);
        this.irradianceVolumeBuffer.setFloat("hysteresis", setting.hysteresis);
        this.irradianceVolumeBuffer.setFloat("OctRTSideSize", setting.octRTSideSize);
        this.irradianceVolumeBuffer.setFloat("OctRTMaxSize", setting.octRTMaxSize);
        this.irradianceVolumeBuffer.setFloat("startX", start.x);
        this.irradianceVolumeBuffer.setFloat("startY", start.y);
        this.irradianceVolumeBuffer.setFloat("startZ", start.z);
        this.irradianceVolumeBuffer.setFloat("ProbeSpace", setting.probeSpace);
        this.irradianceVolumeBuffer.setFloat("probeXCount", setting.probeXCount);
        this.irradianceVolumeBuffer.setFloat("probeYCount", setting.probeYCount);
        this.irradianceVolumeBuffer.setFloat("probeZCount", setting.probeZCount);
        this.irradianceVolumeBuffer.setFloat("maxDistance", setting.probeSpace * 1.732); //maxDistance = space * sqrt(3.0);
        this.irradianceVolumeBuffer.setFloat("depthSharpness", setting.depthSharpness);
        this.irradianceVolumeBuffer.setFloat("ProbeSourceTextureSize", setting.probeSourceTextureSize);
        this.irradianceVolumeBuffer.setFloat("ProbeSize", setting.probeSize);
        this.irradianceVolumeBuffer.setFloat("bounceIntensity", setting.bounceIntensity);
        this.irradianceVolumeBuffer.setFloat("probeRoughness", setting.probeRoughness);

        this.irradianceVolumeBuffer.setFloat("normalBias", setting.normalBias);
        this.irradianceVolumeBuffer.setFloat("irradianceChebyshevBias", setting.irradianceChebyshevBias);
        this.irradianceVolumeBuffer.setFloat("rayNumber", setting.rayNumber);
        this.irradianceVolumeBuffer.setFloat("irradianceDistanceBias", setting.irradianceDistanceBias);
        this.irradianceVolumeBuffer.setFloat("indirectIntensity", setting.indirectIntensity);
        this.irradianceVolumeBuffer.setFloat("ddgiGamma", setting.ddgiGamma);
        this.irradianceVolumeBuffer.setFloat("lerpHysteresis", setting.lerpHysteresis);

        this.irradianceVolumeBuffer.setFloat("debugX", this.debugX);
        this.irradianceVolumeBuffer.setFloat("debugY", this.debugY);
        this.irradianceVolumeBuffer.setFloat("debugZ", this.debugZ);

        this.irradianceVolumeBuffer.apply();
    }
}

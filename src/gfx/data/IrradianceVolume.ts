import { StorageGPUBuffer } from "../graphics/webGpu/core/buffer/StorageGPUBuffer";

/**
 * @internal
 * @group Post
 */
export class IrradianceVolume {
    private debugX: number = 0;
    private debugY: number = 0;
    private debugZ: number = 0;
    public probesBufferData: Float32Array; //offset xyz frame
    public probesBuffer: StorageGPUBuffer;
    public isVolumeFrameChange: boolean = true;
    public irradianceVolumeBuffer: StorageGPUBuffer;

    public constructor() {
        this.irradianceVolumeBuffer = new StorageGPUBuffer(80);
        this.fillIrradianceData();
    }

    private fillIrradianceData(): void {
        this.irradianceVolumeBuffer.setFloat("orientationIndex", 0);
        this.irradianceVolumeBuffer.setFloat("hysteresis", 0);
        this.irradianceVolumeBuffer.setFloat("OctRTSideSize", 0);
        this.irradianceVolumeBuffer.setFloat("OctRTMaxSize", 0);
        this.irradianceVolumeBuffer.setFloat("startX", 0);
        this.irradianceVolumeBuffer.setFloat("startY", 0);
        this.irradianceVolumeBuffer.setFloat("startZ", 0);
        this.irradianceVolumeBuffer.setFloat("ProbeSpace", 0);
        this.irradianceVolumeBuffer.setFloat("probeXCount", 0);
        this.irradianceVolumeBuffer.setFloat("probeYCount", 0);
        this.irradianceVolumeBuffer.setFloat("probeZCount", 0);
        this.irradianceVolumeBuffer.setFloat("maxDistance", 0);
        this.irradianceVolumeBuffer.setFloat("depthSharpness", 0);
        this.irradianceVolumeBuffer.setFloat("ProbeSourceTextureSize", 0);
        this.irradianceVolumeBuffer.setFloat("ProbeSize", 0);
        this.irradianceVolumeBuffer.setFloat("bounceIntensity", 0);
        this.irradianceVolumeBuffer.setFloat("probeRoughness", 0);

        this.irradianceVolumeBuffer.setFloat("normalBias", 0);
        this.irradianceVolumeBuffer.setFloat("irradianceChebyshevBias", 0);
        this.irradianceVolumeBuffer.setFloat("rayNumber", 0);
        this.irradianceVolumeBuffer.setFloat("irradianceDistanceBias", 0);
        this.irradianceVolumeBuffer.setFloat("indirectIntensity", 0);
        this.irradianceVolumeBuffer.setFloat("ddgiGamma", 0);
        this.irradianceVolumeBuffer.setFloat("lerpHysteresis", 0);

        this.irradianceVolumeBuffer.setFloat("debugX", this.debugX);
        this.irradianceVolumeBuffer.setFloat("debugY", this.debugY);
        this.irradianceVolumeBuffer.setFloat("debugZ", this.debugZ);

        this.irradianceVolumeBuffer.apply();
    }


}

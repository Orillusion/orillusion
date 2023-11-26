import { ComputeGPUBuffer, webGPUContext } from '@orillusion/core';
import { FlowImgSimulatorConfig } from "./FlowImgSimulatorConfig";

export class FlowImgSimulatorBuffer {
    // protected mInputData: Float32Array;
    protected mInputBuffer: ComputeGPUBuffer;
    protected mPositionData: Float32Array;
    protected mPositionBuffer: ComputeGPUBuffer;
    protected mNewPositionBuffer: ComputeGPUBuffer;
    protected mSpawnData: Float32Array;
    protected mSpawnBuffer: ComputeGPUBuffer;
    protected mColorData: Float32Array;
    protected mColorBuffer: ComputeGPUBuffer;
    protected mConfig: FlowImgSimulatorConfig;

    constructor(config: FlowImgSimulatorConfig, imagedata: any) {
        this.mConfig = config;
        this.initGPUBuffer(config, imagedata);
        this.reinitGPUBuffer(config, imagedata);
    }

    public updateInputData() {
        const { INITIAL_TURBULENCE, NOISE_OCTAVES, directionX, directionY, directionZ } = this.mConfig;

        this.mInputBuffer.setFloat("persistence", INITIAL_TURBULENCE);
        this.mInputBuffer.setFloat("OCTAVES", NOISE_OCTAVES);
        this.mInputBuffer.setFloat("directionX", directionX);
        this.mInputBuffer.setFloat("directionY", directionY);
        this.mInputBuffer.setFloat("directionZ", directionZ);
        this.mInputBuffer.apply();

        this.mColorBuffer.setFloat32Array("", this.mColorData);
        this.mColorBuffer.apply();
    }

    public reinitGPUBuffer(config: FlowImgSimulatorConfig, imagedata: any) {
        const { NUM, SPAWN_RADIUS, BASE_LIFETIME, MAX_ADDITIONAL_LIFETIME } = config;

        var imageindex: any = [];
        for (let i = 0; i < NUM; ++i) {
            imageindex[i] = Math.floor(Math.random() * imagedata.positions.length / 4);
        }
        
        for (let i = 0; i < NUM; ++i) {
            this.mPositionData[i * 4 + 0] = (imagedata.positions[imageindex[i] * 4] * 2.0 - 1.0) // x
            this.mPositionData[i * 4 + 1] = -(imagedata.positions[imageindex[i] * 4 + 1] * 2.0 - 1.0) // y
            this.mPositionData[i * 4 + 2] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * (Math.random() * 2.0 - 1.0) // z
            this.mPositionData[i * 4 + 3] = BASE_LIFETIME * Math.random() // w
        }
        this.mPositionBuffer.setFloat32Array("", this.mPositionData);
        this.mPositionBuffer.apply();

        for (let i = 0; i < NUM; ++i) {
            this.mSpawnData[i * 4 + 0] = (imagedata.positions[imageindex[i] * 4] * 2.0 - 1.0) // x
            this.mSpawnData[i * 4 + 1] = -(imagedata.positions[imageindex[i] * 4 + 1] * 2.0 - 1.0) // y
            this.mSpawnData[i * 4 + 2] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * (Math.random() * 2.0 - 1.0) // z
            this.mSpawnData[i * 4 + 3] = BASE_LIFETIME + Math.random() * MAX_ADDITIONAL_LIFETIME
        }
        this.mSpawnBuffer.setFloat32Array("", this.mSpawnData);
        this.mSpawnBuffer.apply();

        for (let i = 0; i < NUM; ++i) {
            this.mColorData[i * 4 + 0] = imagedata.colors[imageindex[i] * 4] / 256.0//0.5 // r
            this.mColorData[i * 4 + 1] = imagedata.colors[imageindex[i] * 4 + 1] / 256.0//0.5 // g
            this.mColorData[i * 4 + 2] = imagedata.colors[imageindex[i] * 4 + 2] / 256.0//0.5 // b
            this.mColorData[i * 4 + 3] = imagedata.colors[imageindex[i] * 4 + 3]//1 // a
        }
        this.mColorBuffer.setFloat32Array("", this.mColorData);
        this.mColorBuffer.apply();

        const { PRESIMULATION_DELTA_TIME, INITIAL_TURBULENCE, NOISE_OCTAVES, directionX, directionY, directionZ } = config;
        this.mInputBuffer.setFloat("count", NUM);
        this.mInputBuffer.setFloat("time", PRESIMULATION_DELTA_TIME);
        this.mInputBuffer.setFloat("deltatime", PRESIMULATION_DELTA_TIME);
        this.mInputBuffer.setFloat("persistence", INITIAL_TURBULENCE);
        this.mInputBuffer.setFloat("OCTAVES", NOISE_OCTAVES);
        this.mInputBuffer.setFloat("directionX", directionX);
        this.mInputBuffer.setFloat("directionY", directionY);
        this.mInputBuffer.setFloat("directionZ", directionZ);
        this.mInputBuffer.apply();
    }

    protected initGPUBuffer(config: FlowImgSimulatorConfig, imagedata: any) {
        const { NUM } = config;

        this.mPositionData = new Float32Array(4 * NUM);
        this.mPositionBuffer = new ComputeGPUBuffer(this.mPositionData.length);
        this.mNewPositionBuffer = new ComputeGPUBuffer(this.mPositionData.length);

        this.mSpawnData = new Float32Array(4 * NUM);
        this.mSpawnBuffer = new ComputeGPUBuffer(this.mSpawnData.length);

        this.mColorData = new Float32Array(4 * NUM);
        this.mColorBuffer = new ComputeGPUBuffer(this.mColorData.length);
        
        this.mInputBuffer = new ComputeGPUBuffer(8);
    }
}

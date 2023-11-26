import { ComputeGPUBuffer } from '@orillusion/core';
import { FlowSimulatorConfig } from "./FlowSimulatorConfig";

export class FlowSimulatorBuffer {
    protected mPositionBuffer: ComputeGPUBuffer
    protected mNewPositionBuffer: ComputeGPUBuffer
    protected mSpawnBuffer: ComputeGPUBuffer
    protected mInputData: Float32Array;
    protected mInputBuffer: ComputeGPUBuffer
    protected mConfig: FlowSimulatorConfig;

    constructor(config: FlowSimulatorConfig) {
        this.mConfig = config;
        this.initGPUBuffer(config);
    }

    public updateInputData() {
        const { INITIAL_TURBULENCE, NOISE_OCTAVES, directionX, directionY, directionZ } = this.mConfig;

        this.mInputBuffer.setFloat("persistence", INITIAL_TURBULENCE);
        this.mInputBuffer.setFloat("OCTAVES", NOISE_OCTAVES);
        this.mInputBuffer.setFloat("directionX", directionX);
        this.mInputBuffer.setFloat("directionY", directionY);
        this.mInputBuffer.setFloat("directionZ", directionZ);
        this.mInputBuffer.apply();
    }

    public initGPUBuffer(config: FlowSimulatorConfig) {
        const { NUM, SPAWN_RADIUS, BASE_LIFETIME, MAX_ADDITIONAL_LIFETIME } = config

        const position = new Float32Array(4 * NUM)
        for (let i = 0; i < NUM; ++i) {
            position[i * 4 + 0] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * Math.sqrt(1.0 - Math.pow(Math.random() * 2.0 - 1.0, 2)) * Math.cos(Math.random() * 2.0 * Math.PI) // x
            position[i * 4 + 1] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * Math.sqrt(1.0 - Math.pow(Math.random() * 2.0 - 1.0, 2)) * Math.sin(Math.random() * 2.0 * Math.PI) // y
            position[i * 4 + 2] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * (Math.random() * 2.0 - 1.0) // z
            position[i * 4 + 3] = BASE_LIFETIME * Math.random() // w
        }
        this.mPositionBuffer = new ComputeGPUBuffer(position.length);
        this.mPositionBuffer.setFloat32Array("", position);
        this.mPositionBuffer.apply();

        this.mNewPositionBuffer = new ComputeGPUBuffer(position.length);
        this.mNewPositionBuffer.setFloat32Array("", position);
        this.mNewPositionBuffer.apply();

        const spawn = new Float32Array(4 * NUM)
        for (let i = 0; i < NUM; ++i) {
            spawn[i * 4 + 0] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * Math.sqrt(1.0 - Math.pow(Math.random() * 2.0 - 1.0, 2)) * Math.cos(Math.random() * 2.0 * Math.PI) // x
            spawn[i * 4 + 1] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * Math.sqrt(1.0 - Math.pow(Math.random() * 2.0 - 1.0, 2)) * Math.sin(Math.random() * 2.0 * Math.PI) // y
            spawn[i * 4 + 2] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * (Math.random() * 2.0 - 1.0) // z
            spawn[i * 4 + 3] = BASE_LIFETIME + Math.random() * MAX_ADDITIONAL_LIFETIME
        }
        this.mSpawnBuffer = new ComputeGPUBuffer(spawn.length);
        this.mSpawnBuffer.setFloat32Array("", spawn);
        this.mSpawnBuffer.apply();

        const { PRESIMULATION_DELTA_TIME, INITIAL_TURBULENCE, NOISE_OCTAVES, directionX, directionY, directionZ } = config;
        this.mInputBuffer = new ComputeGPUBuffer(8);
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
}

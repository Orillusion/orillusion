import { ComputeGPUBuffer, webGPUContext } from '@orillusion/core';
import { FlameSimulatorConfig } from './FlameSimulatorConfig';

export class FlameSimulatorBuffer {
    protected mPositionBuffer: ComputeGPUBuffer;
    protected mNewPositionBuffer: ComputeGPUBuffer;
    protected mBonePositionsBuffer: ComputeGPUBuffer;
    protected mBoneIndicesBuffer: ComputeGPUBuffer;
    protected mBoneWeightsBuffer: ComputeGPUBuffer;
    protected mBoneMatrixBuffer: ComputeGPUBuffer;
    protected mBoneMatricesBuffer: ComputeGPUBuffer;
    protected mInputBuffer: ComputeGPUBuffer;
    // protected mInputData: Float32Array;

    constructor(config: FlameSimulatorConfig) {
        this.initGPUBuffer(config);
    }

    protected initGPUBuffer(config: FlameSimulatorConfig) {
        let device = webGPUContext.device;

        const { NUM, SPAWN_RADIUS, BASE_LIFETIME, MAX_ADDITIONAL_LIFETIME, NUMBER_OF_BONES } = config;

        const position = new Float32Array(4 * NUM);
        for (let i = 0; i < NUM; ++i) {
            position[i * 4 + 0] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * Math.sqrt(1.0 - Math.pow(Math.random() * 2.0 - 1.0, 2)) * Math.cos(Math.random() * 2.0 * Math.PI); // x
            position[i * 4 + 1] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * Math.sqrt(1.0 - Math.pow(Math.random() * 2.0 - 1.0, 2)) * Math.sin(Math.random() * 2.0 * Math.PI); // y
            position[i * 4 + 2] = SPAWN_RADIUS * Math.pow(Math.random(), 1 / 3) * (Math.random() * 2.0 - 1.0); // z
            position[i * 4 + 3] = BASE_LIFETIME * Math.random(); // w
            // console.log(position[i * 4 + 0], position[i * 4 + 1], position[i * 4 + 2]);
        }
        this.mPositionBuffer = new ComputeGPUBuffer(position.length);
        this.mPositionBuffer.setFloat32Array("", position);
        this.mPositionBuffer.apply();

        this.mNewPositionBuffer = new ComputeGPUBuffer(position.length);
        
        const initbonePositions = new Float32Array(4 * NUM);
        this.mBonePositionsBuffer = new ComputeGPUBuffer(initbonePositions.length);

        const initboneIndices = new Float32Array(4 * NUM);
        this.mBoneIndicesBuffer = new ComputeGPUBuffer(initboneIndices.length);

        const initboneWeights = new Float32Array(4 * NUM);
        this.mBoneWeightsBuffer = new ComputeGPUBuffer(initboneWeights.length);
        
        const initboneMatrices = new Float32Array(4 * NUMBER_OF_BONES * 3);
        this.mBoneMatricesBuffer = new ComputeGPUBuffer(initboneMatrices.length);

        const { PRESIMULATION_DELTA_TIME, INITIAL_TURBULENCE, NOISE_OCTAVES, SCALE } = config;
        this.mInputBuffer = new ComputeGPUBuffer(8);
        this.mInputBuffer.setFloat("count", NUM);
        this.mInputBuffer.setFloat("time", PRESIMULATION_DELTA_TIME);
        this.mInputBuffer.setFloat("deltatime", PRESIMULATION_DELTA_TIME);
        this.mInputBuffer.setFloat("persistence", INITIAL_TURBULENCE);
        this.mInputBuffer.setFloat("OCTAVES", NOISE_OCTAVES);
        this.mInputBuffer.setFloat("SCALE", SCALE);
        this.mInputBuffer.apply();
    }

    public updateInput(time: number, deltaTime: number) {
        this.mInputBuffer.setFloat("time", time);
        this.mInputBuffer.setFloat("deltatime", deltaTime);
    }

    public updateInputData() {
        this.mInputBuffer.apply();
    }
}

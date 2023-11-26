import { ComputeGPUBuffer, clamp, Time, Vector3 } from '@orillusion/core';
import { FluidSimulatorConfig } from './FluidSimulatorConfig';

export class FluidSimulatorBuffer {
    protected mPositionData: Float32Array;
    protected mPositionBuffer: ComputeGPUBuffer;
    protected mVelocityBuffer: ComputeGPUBuffer;
    protected mTempvelocityBuffer: ComputeGPUBuffer;
    protected mGridvelocityBuffer: ComputeGPUBuffer;
    protected mOrivelocityBuffer: ComputeGPUBuffer;
    protected mAtomicvelocityBuffer: ComputeGPUBuffer;
    protected mMarkBuffer: ComputeGPUBuffer;
    protected mWeightBuffer: ComputeGPUBuffer;
    protected mTempweightBuffer: ComputeGPUBuffer;
    protected mAtomicweightBuffer: ComputeGPUBuffer;
    protected mDivergenceBuffer: ComputeGPUBuffer;
    protected mPressureBuffer: ComputeGPUBuffer;
    protected mTemppressureBuffer: ComputeGPUBuffer;
    protected mColorData: Float32Array;
    protected mColorBuffer: ComputeGPUBuffer;
    protected mInputBuffer: ComputeGPUBuffer;
    protected mOutput0Buffer: ComputeGPUBuffer;
    protected mOutput1Buffer: ComputeGPUBuffer;
    protected mOutput2Buffer: ComputeGPUBuffer;
    protected mTimeoutId: any;
    constructor(config: FluidSimulatorConfig) {
        this.initGPUBuffer(config);
    }

    protected initGPUBuffer(config: FluidSimulatorConfig) {
        const { NUM, XMIN, XMAX, YMIN, YMAX, ZMIN, ZMAX, GRIDNUM, CELLNUM } = config;

        // core position buffer
        const position = new Float32Array(4 * NUM);
        for (let i = 0; i < NUM; ++i) {
            position[i * 4 + 0] = Math.random() * (XMAX - XMIN) + XMIN; // x
            position[i * 4 + 1] = Math.random() * (YMAX - YMIN) + YMIN; // y
            position[i * 4 + 2] = Math.random() * (ZMAX - ZMIN) + ZMIN; // z
            position[i * 4 + 3] = 0; // w
        }
        this.mPositionData = position;
        this.mPositionBuffer = new ComputeGPUBuffer(this.mPositionData.length);
        this.mPositionBuffer.setFloat32Array("", this.mPositionData);
        this.mPositionBuffer.apply();

        // velocity for computing position
        this.mVelocityBuffer = new ComputeGPUBuffer(4 * NUM);
        this.mTempvelocityBuffer = new ComputeGPUBuffer(4 * NUM);
        this.mGridvelocityBuffer = new ComputeGPUBuffer(4 * GRIDNUM);
        this.mOrivelocityBuffer = new ComputeGPUBuffer(4 * GRIDNUM);
        this.mAtomicvelocityBuffer = new ComputeGPUBuffer(4 * GRIDNUM);
        
        this.mMarkBuffer = new ComputeGPUBuffer(CELLNUM);
        
        // weight for transfer particle velocities to grid
        this.mWeightBuffer = new ComputeGPUBuffer(4 * GRIDNUM);
        this.mTempweightBuffer = new ComputeGPUBuffer(4 * NUM);
        this.mAtomicweightBuffer = new ComputeGPUBuffer(4 * GRIDNUM);
       
        this.mDivergenceBuffer = new ComputeGPUBuffer(CELLNUM);
        
        this.mPressureBuffer = new ComputeGPUBuffer(CELLNUM);
        this.mTemppressureBuffer = new ComputeGPUBuffer(CELLNUM);
        
        const color = new Float32Array(4 * NUM);
        for (let i = 0; i < NUM; ++i) {
            color[i * 4 + 0] = 1; // r
            color[i * 4 + 1] = 0; // g
            color[i * 4 + 2] = 0; // b
            color[i * 4 + 3] = 1; // a
        }
        this.mColorData = color;
        this.mColorBuffer = new ComputeGPUBuffer(this.mColorData.length);
        this.mColorBuffer.setFloat32Array("", this.mColorData);
        this.mColorBuffer.apply();

        const { gridResolutionX, gridResolutionY, gridResolutionZ, gridSizeX, gridSizeY, gridSizeZ, timeStep, flipness, maxDensity } = config;
        this.mInputBuffer = new ComputeGPUBuffer(24);
        this.mInputBuffer.setFloat("NUM", NUM);
        this.mInputBuffer.setFloat("GRIDNUM", GRIDNUM);
        this.mInputBuffer.setFloat("CELLNUM", CELLNUM);
        this.mInputBuffer.setFloat("gridResolutionX", gridResolutionX);
        this.mInputBuffer.setFloat("gridResolutionY", gridResolutionY);
        this.mInputBuffer.setFloat("gridResolutionZ", gridResolutionZ);
        this.mInputBuffer.setFloat("gridSizeX", gridSizeX);
        this.mInputBuffer.setFloat("gridSizeY", gridSizeY);
        this.mInputBuffer.setFloat("gridSizeZ", gridSizeZ);
        this.mInputBuffer.setFloat("timeStep", timeStep);
        this.mInputBuffer.setFloat("flipness", flipness);
        this.mInputBuffer.setFloat("maxDensity", maxDensity);
        this.mInputBuffer.apply();

        // DEBUG BUFFERS
        this.mOutput0Buffer = new ComputeGPUBuffer(4 * (NUM + 10));
        this.mOutput1Buffer = new ComputeGPUBuffer(4 * (CELLNUM + 10));
        this.mOutput2Buffer = new ComputeGPUBuffer(4 * (GRIDNUM + 10));
    }

    public resetGPUBuffer(config: FluidSimulatorConfig) {}

    public updateInput(origin: Vector3, direction: Vector3, velocity: Vector3) {
        clearTimeout(this.mTimeoutId);
        this.mInputBuffer.setFloat("timeStep", Time.delta);
        this.mInputBuffer.setFloat("mouseVelocityX", velocity.x / 2.0);
        this.mInputBuffer.setFloat("mouseVelocityY", velocity.y / 2.0);
        this.mInputBuffer.setFloat("mouseVelocityZ", velocity.z / 2.0);
        this.mInputBuffer.setFloat("mouseOriginX", origin.x);
        this.mInputBuffer.setFloat("mouseOriginY", origin.y);
        this.mInputBuffer.setFloat("mouseOriginZ", origin.z);
        this.mInputBuffer.setFloat("mouseDirectionX", direction.x);
        this.mInputBuffer.setFloat("mouseDirectionY", direction.y);
        this.mInputBuffer.setFloat("mouseDirectionZ", direction.z);
        this.mTimeoutId = setTimeout(() => {
            this.mInputBuffer.setFloat("mouseVelocityX", 0.0);
            this.mInputBuffer.setFloat("mouseVelocityY", 0.0);
            this.mInputBuffer.setFloat("mouseVelocityZ", 0.0);
        }, 100);
    }

    public updateInputData() {
        this.mInputBuffer.setFloat("timeStep", clamp(Time.delta * 0.001,0,1/60));
        this.mInputBuffer.apply();
    }
}

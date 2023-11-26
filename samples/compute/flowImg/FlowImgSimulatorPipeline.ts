import { ComputeGPUBuffer, ComputeShader, Time } from '@orillusion/core';
import { FlowImgSimulatorBuffer } from "./FlowImgSimulatorBuffer";
import { FlowImgSimulatorConfig } from "./FlowImgSimulatorConfig";
import { Copy } from "./shader/copy.wgsl";
import { Simulation } from "./shader/simulation.wgsl";

export class FlowImgSimulatorPipeline extends FlowImgSimulatorBuffer {
    protected mSimulationComputeShader: ComputeShader;
    protected mDataCopyComputeShader: ComputeShader;
    protected mFirstFrame: boolean = false;
    constructor(config: FlowImgSimulatorConfig, imagedata: any) {
        super(config, imagedata);
        this.initPipeline();
    }

    public get positionBuffer(): ComputeGPUBuffer {
        return this.mPositionBuffer;
    }

    public get colorBuffer(): ComputeGPUBuffer {
        return this.mColorBuffer;
    }

    public reset(config: FlowImgSimulatorConfig, imagedata: any) {
        this.mFirstFrame = true;
        this.reinitGPUBuffer(config, imagedata);
    }

    public compute(command: GPUCommandEncoder) {
        const { BASE_LIFETIME, PRESIMULATION_DELTA_TIME, NUM, GROUP_SIZE, INITIAL_SPEED } = this.mConfig;

        if (this.mFirstFrame) {
            this.mInputBuffer.setFloat("time", PRESIMULATION_DELTA_TIME);
            this.mInputBuffer.setFloat("deltatime", PRESIMULATION_DELTA_TIME);
        } else {
            this.mInputBuffer.setFloat("time", Time.time / 1000.0);
            this.mInputBuffer.setFloat("deltatime", INITIAL_SPEED * (Time.delta / 1000.0));
        }
        this.updateInputData();

        let computePass = command.beginComputePass();

        for (var i = 0; i < (this.mFirstFrame ? BASE_LIFETIME / PRESIMULATION_DELTA_TIME : 1); ++i) {
            this.mSimulationComputeShader.compute(computePass);
            this.mDataCopyComputeShader.compute(computePass);
        }

        computePass.end();

        this.mFirstFrame = false;
    }

    protected initPipeline() {
        const { NUM, GROUP_SIZE } = this.mConfig;

        this.mSimulationComputeShader = new ComputeShader(Simulation.cs);
        this.mSimulationComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`spawn`, this.mSpawnBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`color`, this.mColorBuffer);
        this.mSimulationComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);

        this.mDataCopyComputeShader = new ComputeShader(Copy.cs);
        this.mDataCopyComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mDataCopyComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mDataCopyComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mDataCopyComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);
    }
}

import { ComputeGPUBuffer, ComputeShader, Vector3 } from '@orillusion/core';
import { HairSimulatorBuffer } from "./HairSimulatorBuffer";
import { HairSimulatorConfig } from "./HairSimulatorConfig";
import { constraint } from "./shader/constraint.wgsl";
import { simulation } from "./shader/simulation.wgsl";
import { update } from "./shader/update.wgsl";

export class HairSimulatorPipeline extends HairSimulatorBuffer {
    protected mUpdateComputeShader: ComputeShader;
    protected mSimulationComputeShader: ComputeShader;
    protected mConstraintComputeShader: ComputeShader;

    constructor(config: HairSimulatorConfig) {
        super(config);
        this.initPipeline(config);
    }

    public get positionBuffer(): ComputeGPUBuffer {
        return this.mPositionBuffer;
    }

    public get anchorPositionBuffer(): ComputeGPUBuffer {
        return this.mAnchorPositionBuffer;
    }

    // public updateInputData() {
    //     // this.mInputData[2] = Time.delta / 1000;
    //     // webGPUContext.device.queue.writeBuffer(this.mInputBuffer, 0, this.mInputData);
    // }

    public compute(command: GPUCommandEncoder, pos: Vector3, newpos: Vector3) {

        let computePass = command.beginComputePass();

        this.updateInputData(pos,newpos);
        this.mSimulationComputeShader.compute(computePass);
        this.mConstraintComputeShader.compute(computePass);
        this.mUpdateComputeShader.compute(computePass);

        computePass.end();
    }

    protected initPipeline(config: HairSimulatorConfig) {
        const { NUM, GROUP_SIZE } = this.mConfig;

        this.mSimulationComputeShader = new ComputeShader(simulation.cs);
        this.mSimulationComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`anchorposition`, this.mAnchorPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`tmpposition`, this.mTempPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mSimulationComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);

        this.mConstraintComputeShader = new ComputeShader(constraint.cs);
        this.mConstraintComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mConstraintComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mConstraintComputeShader.setStorageBuffer(`tmpposition`, this.mTempPositionBuffer);
        this.mConstraintComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mConstraintComputeShader.setStorageBuffer(`anchorposition`, this.mAnchorPositionBuffer);
        this.mConstraintComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mConstraintComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mConstraintComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);

        this.mUpdateComputeShader = new ComputeShader(update.cs);
        this.mUpdateComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mUpdateComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mUpdateComputeShader.setStorageBuffer(`anchorposition`, this.mAnchorPositionBuffer);
        this.mUpdateComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mUpdateComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mUpdateComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mUpdateComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);
    }
}

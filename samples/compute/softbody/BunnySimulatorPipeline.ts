import { ComputeShader, Time, Vector3, webGPUContext } from '@orillusion/core';
import { BunnySimulatorBuffer } from "./BunnySimulatorBuffer";
import { BunnySimulatorConfig } from "./BunnySimulatorConfig";
import { edgeconstraint } from "./shader/edgeconstraint.wgsl";
import { volumeconstraint } from "./shader/volumeconstraint.wgsl";
import { computenormal } from "./shader/computenormal.wgsl";
import { normalupdate } from "./shader/normalupdate.wgsl";
import { positionupdate } from "./shader/positionupdate.wgsl";
import { postprocess } from "./shader/postprocess.wgsl";
import { preprocess } from "./shader/preprocess.wgsl";

import { updatevertexbuffer } from "./shader/updatevertexbuffer.wgsl";

export class BunnySimulatorPipeline extends BunnySimulatorBuffer {
    protected mConfig: BunnySimulatorConfig;
    protected mPreProcessComputeShader: ComputeShader;
    protected mEdgeConstraintComputeShader: ComputeShader;
    protected mVolumeConstraintComputeShader: ComputeShader;
    protected mPositionUpdateComputeShader: ComputeShader;
    protected mPostProcessComputeShader: ComputeShader;
    protected mComputeNormalComputeShader: ComputeShader;
    protected mNormalUpdateComputeShader: ComputeShader;
    protected mUpdateVertexBufferComputeShader: ComputeShader;

    constructor(config: BunnySimulatorConfig) {
        super(config);
        this.mConfig = config;
        this.initPipeline(this.mConfig);
    }

    public compute(command: GPUCommandEncoder, pos: Vector3) {
        let computePass = command.beginComputePass();

        const { NUMSUBSTEPS } = this.mConfig;

        this.updateInputData(pos);

        for (let i = 0; i < NUMSUBSTEPS; i++) {
            this.mPreProcessComputeShader.compute(computePass);
            this.mEdgeConstraintComputeShader.compute(computePass);
            this.mVolumeConstraintComputeShader.compute(computePass);
            this.mPositionUpdateComputeShader.compute(computePass);
            this.mPostProcessComputeShader.compute(computePass);
        }
        this.mComputeNormalComputeShader.compute(computePass);
        this.mNormalUpdateComputeShader.compute(computePass);
        this.mUpdateVertexBufferComputeShader.compute(computePass);

        computePass.end();
    }

    protected initPipeline(config: BunnySimulatorConfig) {
        const { NUMPARTICLES, NUMTETS, NUMTEDGES, NUMTSURFACES } = this.mConfig;

        this.mPreProcessComputeShader = new ComputeShader(preprocess.cs);
        this.mPreProcessComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`position`, this.mVertexPositionBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mPreProcessComputeShader.workerSizeX = Math.ceil(NUMPARTICLES / 128);

        this.mEdgeConstraintComputeShader = new ComputeShader(edgeconstraint.cs);
        this.mEdgeConstraintComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mEdgeConstraintComputeShader.setStorageBuffer(`inposition`, this.mNewPositionBuffer);
        this.mEdgeConstraintComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mEdgeConstraintComputeShader.setStorageBuffer(`atomicposition`, this.mAtomicPositionBuffer);
        this.mEdgeConstraintComputeShader.setStorageBuffer(`edgeinfo`, this.mEdgeInfosBuffer);
        this.mEdgeConstraintComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mEdgeConstraintComputeShader.workerSizeX = Math.ceil(NUMTEDGES / 128);
       
        this.mVolumeConstraintComputeShader = new ComputeShader(volumeconstraint.cs);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`inposition`, this.mNewPositionBuffer);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`atomicposition`, this.mAtomicPositionBuffer);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`tetids`, this.mTetIdsBuffer);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`restvol`, this.mRestVolBuffer);
        this.mVolumeConstraintComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mVolumeConstraintComputeShader.workerSizeX = Math.ceil(NUMTETS / 128);

        this.mPositionUpdateComputeShader = new ComputeShader(positionupdate.cs);
        this.mPositionUpdateComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mPositionUpdateComputeShader.setStorageBuffer(`atomicposition`, this.mAtomicPositionBuffer);
        this.mPositionUpdateComputeShader.setStorageBuffer(`outposition`, this.mNewPositionBuffer);
        this.mPositionUpdateComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mPositionUpdateComputeShader.workerSizeX = Math.ceil(NUMPARTICLES / 128);
        
        this.mPostProcessComputeShader = new ComputeShader(postprocess.cs);
        this.mPostProcessComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mPostProcessComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mPostProcessComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mPostProcessComputeShader.setStorageBuffer(`position`, this.mVertexPositionBuffer);
        this.mPostProcessComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mPostProcessComputeShader.workerSizeX = Math.ceil(NUMPARTICLES / 128);

        this.mComputeNormalComputeShader = new ComputeShader(computenormal.cs);
        this.mComputeNormalComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mComputeNormalComputeShader.setStorageBuffer(`position`, this.mVertexPositionBuffer);
        this.mComputeNormalComputeShader.setStorageBuffer(`surfaceinfo`, this.mSurfaceInfosBuffer);
        this.mComputeNormalComputeShader.setStorageBuffer(`atomicnormal`, this.mAtomicNormalBuffer);
        this.mComputeNormalComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mComputeNormalComputeShader.workerSizeX = Math.ceil(NUMTSURFACES / 128);

        this.mNormalUpdateComputeShader = new ComputeShader(normalupdate.cs);
        this.mNormalUpdateComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mNormalUpdateComputeShader.setStorageBuffer(`atomicnormal`, this.mAtomicNormalBuffer);
        this.mNormalUpdateComputeShader.setStorageBuffer(`normal`, this.mNormalBuffer);
        this.mNormalUpdateComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mNormalUpdateComputeShader.workerSizeX = Math.ceil(NUMPARTICLES / 128);

        this.mUpdateVertexBufferComputeShader = new ComputeShader(updatevertexbuffer.cs);
        this.mUpdateVertexBufferComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mUpdateVertexBufferComputeShader.setStorageBuffer(`position`, this.mVertexPositionBuffer);
        this.mUpdateVertexBufferComputeShader.setStorageBuffer(`normal`, this.mNormalBuffer);
        this.mUpdateVertexBufferComputeShader.setStorageBuffer(`vertexBuffer`, config.bunnyVertexBuffer);
        this.mUpdateVertexBufferComputeShader.workerSizeX = Math.ceil(NUMTSURFACES / 128);
    }
}

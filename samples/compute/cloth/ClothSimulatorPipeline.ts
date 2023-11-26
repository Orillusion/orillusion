import { ComputeShader, Time, Vector3, webGPUContext } from '@orillusion/core';
import { ClothSimulatorBuffer } from "./ClothSimulatorBuffer";
import { ClothSimulatorConfig } from "./ClothSimulatorConfig";
import { bending } from "./shader/bending.wgsl";
import { computenormal } from "./shader/computenormal.wgsl";
import { normalupdate } from "./shader/normalupdate.wgsl";
import { positionupdate } from "./shader/positionupdate.wgsl";
import { postprocess } from "./shader/postprocess.wgsl";
import { preprocess } from "./shader/preprocess.wgsl";
import { stretching } from "./shader/stretching.wgsl";
import { updatevertexbuffer } from "./shader/updatevertexbuffer.wgsl";

export class ClothSimulatorPipeline extends ClothSimulatorBuffer {
    protected mConfig: ClothSimulatorConfig;
    protected mPreProcessComputeShader: ComputeShader;
    protected mStretchingComputeShader: ComputeShader;
    protected mBendingComputeShader: ComputeShader;
    protected mPositionUpdateComputeShader: ComputeShader;
    protected mPostProcessComputeShader: ComputeShader;
    protected mComputeNormalComputeShader: ComputeShader;
    protected mNormalUpdateComputeShader: ComputeShader;
    protected mUpdateVertexBufferComputeShader: ComputeShader;

    constructor(config: ClothSimulatorConfig) {
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
            this.mStretchingComputeShader.compute(computePass);
            this.mBendingComputeShader.compute(computePass);
            this.mPositionUpdateComputeShader.compute(computePass);
            this.mPostProcessComputeShader.compute(computePass);
        }
        this.mComputeNormalComputeShader.compute(computePass);
        this.mNormalUpdateComputeShader.compute(computePass);
        this.mUpdateVertexBufferComputeShader.compute(computePass);

        computePass.end();
    }

    protected initPipeline(config: ClothSimulatorConfig) {
        const { NUMPARTICLES, NUMTSURFACES, NUMTEDGES, NUMTBENDS } = this.mConfig;

        this.mPreProcessComputeShader = new ComputeShader(preprocess.cs);
        this.mPreProcessComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`position`, this.mVertexPositionBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mPreProcessComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mPreProcessComputeShader.workerSizeX = Math.ceil(NUMPARTICLES / 128);

        this.mStretchingComputeShader = new ComputeShader(stretching.cs);
        this.mStretchingComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mStretchingComputeShader.setStorageBuffer(`inposition`, this.mNewPositionBuffer);
        this.mStretchingComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mStretchingComputeShader.setStorageBuffer(`atomicposition`, this.mAtomicPositionBuffer);
        this.mStretchingComputeShader.setStorageBuffer(`stretchinfo`, this.mStretchInfosBuffer);
        this.mStretchingComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mStretchingComputeShader.workerSizeX = Math.ceil(NUMTEDGES / 128);
       
        this.mBendingComputeShader = new ComputeShader(bending.cs);
        this.mBendingComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mBendingComputeShader.setStorageBuffer(`inposition`, this.mNewPositionBuffer);
        this.mBendingComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mBendingComputeShader.setStorageBuffer(`atomicposition`, this.mAtomicPositionBuffer);
        this.mBendingComputeShader.setStorageBuffer(`bendinfo`, this.mBendInfosBuffer);
        this.mBendingComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mBendingComputeShader.workerSizeX = Math.ceil(NUMTBENDS / 128);

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
        this.mUpdateVertexBufferComputeShader.setStorageBuffer(`vertexBuffer`, config.clothVertexBuffer);
        this.mUpdateVertexBufferComputeShader.workerSizeX = Math.ceil(NUMTSURFACES / 128);
    }
}

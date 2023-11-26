import { FluidSimulatorConfig } from './FluidSimulatorConfig';
import { FluidSimulatorBuffer } from './FluidSimulatorBuffer';
import { ComputeGPUBuffer, ComputeShader } from '@orillusion/core';
import { addforce } from './shader/addforce.wgsl';
import { transferToGrid } from './shader/transferToGrid.wgsl';
import { normalizegrid } from './shader/normalizegrid.wgsl';
import { enforceboundaries } from './shader/enforceboundaries.wgsl';
import { divergence } from './shader/divergence.wgsl';
import { jacobi } from './shader/jacobi.wgsl';
import { copybuffer } from './shader/copybuffer.wgsl';
import { subtract } from './shader/subtract.wgsl';
import { transferToParticles } from './shader/transferToParticles.wgsl';
import { advect } from './shader/advect.wgsl';
import { clearState } from './shader/clearState.wgsl';
import { computeMatrix } from './shader/computeMatrix.wgsl';

export class FluidSimulatorPipeline extends FluidSimulatorBuffer {
    protected mConfig: FluidSimulatorConfig;
    protected mTransferToGridComputeShader: ComputeShader;
    protected mNormalizegridComputeShader: ComputeShader;
    protected mAddforceComputeShader: ComputeShader;
    protected mEnforceboundariesComputeShader: ComputeShader;
    protected mDivergenceComputeShader: ComputeShader;
    protected mJacobiComputeShader: ComputeShader;
    protected mCopyComputeShader: ComputeShader;
    protected mSubtractComputeShader: ComputeShader;
    protected mTransferToParticlesComputeShader: ComputeShader;
    protected mAdvectComputeShader: ComputeShader;
    protected mClearStateComputeShader: ComputeShader;
    protected mComputeMatrixComputeShader: ComputeShader;

    constructor(config: FluidSimulatorConfig) {
        super(config);
        this.mConfig = config;
        this.initPipeline(config);
    }

    public get positionBuffer(): ComputeGPUBuffer {
        return this.mPositionBuffer;
    }

    public get colorBuffer(): ComputeGPUBuffer {
        return this.mColorBuffer;
    }

    public compute(command: GPUCommandEncoder) {
        let computePass = command.beginComputePass();

        this.mTransferToGridComputeShader.compute(computePass);
        this.mNormalizegridComputeShader.compute(computePass);
        this.mAddforceComputeShader.compute(computePass);
        this.mEnforceboundariesComputeShader.compute(computePass);
        this.mDivergenceComputeShader.compute(computePass);

        for (var i = 0; i < this.mConfig.PRESSURE_JACOBI_ITERATIONS; ++i) {
            this.mJacobiComputeShader.compute(computePass);
            this.mCopyComputeShader.compute(computePass);
        }

        this.mSubtractComputeShader.compute(computePass);
        this.mTransferToParticlesComputeShader.compute(computePass);
        this.mAdvectComputeShader.compute(computePass);
        this.mClearStateComputeShader.compute(computePass);
        // this.mComputeMatrixComputeShader.compute(computePass);

        computePass.end();
    }

    protected initPipeline(config: FluidSimulatorConfig) {

        this.mTransferToGridComputeShader = new ComputeShader(transferToGrid.cs);
        this.mTransferToGridComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mTransferToGridComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mTransferToGridComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mTransferToGridComputeShader.setStorageBuffer(`mark`, this.mMarkBuffer);
        this.mTransferToGridComputeShader.setStorageBuffer(`atomicweight`, this.mAtomicweightBuffer);
        this.mTransferToGridComputeShader.setStorageBuffer(`atomicvelocity`, this.mAtomicvelocityBuffer);
        this.mTransferToGridComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mTransferToGridComputeShader.workerSizeX = this.mConfig.dispatchNUM;

        this.mNormalizegridComputeShader = new ComputeShader(normalizegrid.cs);
        this.mNormalizegridComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mNormalizegridComputeShader.setStorageBuffer(`weight`, this.mWeightBuffer);
        this.mNormalizegridComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mNormalizegridComputeShader.setStorageBuffer(`orivelocity`, this.mOrivelocityBuffer);
        this.mNormalizegridComputeShader.setStorageBuffer(`atomicweight`, this.mAtomicweightBuffer);
        this.mNormalizegridComputeShader.setStorageBuffer(`atomicvelocity`, this.mAtomicvelocityBuffer);
        this.mNormalizegridComputeShader.setStorageBuffer(`output`, this.mOutput2Buffer);
        this.mNormalizegridComputeShader.workerSizeX = this.mConfig.dispatchGRID;
    
        this.mAddforceComputeShader = new ComputeShader(addforce.cs);
        this.mAddforceComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mAddforceComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mAddforceComputeShader.setStorageBuffer(`output`, this.mOutput2Buffer);
        this.mAddforceComputeShader.workerSizeX = this.mConfig.dispatchGRID;

        this.mEnforceboundariesComputeShader = new ComputeShader(enforceboundaries.cs);
        this.mEnforceboundariesComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mEnforceboundariesComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mEnforceboundariesComputeShader.setStorageBuffer(`output`, this.mOutput2Buffer);
        this.mEnforceboundariesComputeShader.workerSizeX = this.mConfig.dispatchGRID;

        this.mDivergenceComputeShader = new ComputeShader(divergence.cs);
        this.mDivergenceComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mDivergenceComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mDivergenceComputeShader.setStorageBuffer(`divergence`, this.mDivergenceBuffer);
        this.mDivergenceComputeShader.setStorageBuffer(`weight`, this.mWeightBuffer);
        this.mDivergenceComputeShader.setStorageBuffer(`mark`, this.mMarkBuffer);
        this.mDivergenceComputeShader.setStorageBuffer(`output`, this.mOutput1Buffer);
        this.mDivergenceComputeShader.workerSizeX = this.mConfig.dispatchCELL;
        
        this.mJacobiComputeShader = new ComputeShader(jacobi.cs);
        this.mJacobiComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mJacobiComputeShader.setStorageBuffer(`divergence`, this.mDivergenceBuffer);
        this.mJacobiComputeShader.setStorageBuffer(`pressure`, this.mPressureBuffer);
        this.mJacobiComputeShader.setStorageBuffer(`temppressure`, this.mTemppressureBuffer);
        this.mJacobiComputeShader.setStorageBuffer(`mark`, this.mMarkBuffer);
        this.mJacobiComputeShader.setStorageBuffer(`output`, this.mOutput1Buffer);
        this.mJacobiComputeShader.workerSizeX = this.mConfig.dispatchCELL;
    
        this.mCopyComputeShader = new ComputeShader(copybuffer.cs);
        this.mCopyComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mCopyComputeShader.setStorageBuffer(`pressure`, this.mPressureBuffer);
        this.mCopyComputeShader.setStorageBuffer(`temppressure`, this.mTemppressureBuffer);
        this.mCopyComputeShader.setStorageBuffer(`output`, this.mOutput1Buffer);
        this.mCopyComputeShader.workerSizeX = this.mConfig.dispatchCELL;
        
        this.mSubtractComputeShader = new ComputeShader(subtract.cs);
        this.mSubtractComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mSubtractComputeShader.setStorageBuffer(`pressure`, this.mPressureBuffer);
        this.mSubtractComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mSubtractComputeShader.setStorageBuffer(`output`, this.mOutput2Buffer);
        this.mSubtractComputeShader.workerSizeX = this.mConfig.dispatchGRID;

        this.mTransferToParticlesComputeShader = new ComputeShader(transferToParticles.cs);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`orivelocity`, this.mOrivelocityBuffer);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`color`, this.mColorBuffer);
        this.mTransferToParticlesComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mTransferToParticlesComputeShader.workerSizeX = this.mConfig.dispatchNUM;
       
        this.mAdvectComputeShader = new ComputeShader(advect.cs);
        this.mAdvectComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mAdvectComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mAdvectComputeShader.setStorageBuffer(`velocity`, this.mVelocityBuffer);
        this.mAdvectComputeShader.setStorageBuffer(`gridvelocity`, this.mGridvelocityBuffer);
        this.mAdvectComputeShader.setStorageBuffer(`output`, this.mOutput0Buffer);
        this.mAdvectComputeShader.workerSizeX = this.mConfig.dispatchNUM;
        
        this.mClearStateComputeShader = new ComputeShader(clearState.cs);
        this.mClearStateComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`mark`, this.mMarkBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`atomicweight`, this.mAtomicweightBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`atomicvelocity`, this.mAtomicvelocityBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`weight`, this.mWeightBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`divergence`, this.mDivergenceBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`pressure`, this.mPressureBuffer);
        this.mClearStateComputeShader.setStorageBuffer(`temppressure`, this.mTemppressureBuffer);
        this.mClearStateComputeShader.workerSizeX = this.mConfig.dispatchGRID;
        
        // this.mComputeMatrixComputeShader = new ComputeShader(computeMatrix.cs);
        // this.mComputeMatrixComputeShader.setStorageBuffer(`_modelView`, this.mModelViewBuffer);
        // this.mComputeMatrixComputeShader.setStorageBuffer(`projection`, this.mProjectionBuffer);
        // this.mComputeMatrixComputeShader.setStorageBuffer(`mvp`, this.mMVPBuffer);
        // this.mComputeMatrixComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        // this.mComputeMatrixComputeShader.workerSizeX = this.mConfig.dispatchNUM;
    }
}

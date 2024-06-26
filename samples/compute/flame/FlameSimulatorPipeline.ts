import { AnimatorComponent, ComputeGPUBuffer, ComputeShader, GPUContext, GlobalBindGroup, SkeletonAnimationComponent, SkinnedMeshRenderer, SkinnedMeshRenderer2, VertexAttributeData, VertexAttributeName } from '@orillusion/core';
import { FlameSimulatorBuffer } from './FlameSimulatorBuffer';
import { FlameSimulatorConfig } from './FlameSimulatorConfig';
import { Copy } from './shader/copy.wgsl';
import { Simulation } from './shader/simulation.wgsl';
import { CopyBoneMatrix } from './shader/copyBoneMatrix.wgsl';

export class FlameSimulatorPipeline extends FlameSimulatorBuffer {
    protected mConfig: FlameSimulatorConfig;
    protected mCopyBoneMatrixComputeShader: ComputeShader;
    protected mSimulationComputeShader: ComputeShader;
    protected mCopyComputeShader: ComputeShader;
    protected mFirstFrame: boolean = false;
    protected mAnimatorComponent: AnimatorComponent;
    protected mSkinnedMeshRenderer: SkinnedMeshRenderer2;
    constructor(config: FlameSimulatorConfig, skeletonAnimation: AnimatorComponent, skinnedMeshRenderer: SkinnedMeshRenderer2) {
        super(config);
        this.mConfig = config;
        this.mAnimatorComponent = skeletonAnimation;
        this.mSkinnedMeshRenderer = skinnedMeshRenderer;
    }

    public get positionBuffer(): ComputeGPUBuffer {
        return this.mPositionBuffer;
    }

    public initParticle(attributeArrays: Map<string, VertexAttributeData>) {
        const { NUM } = this.mConfig;

        let indicesAttr = attributeArrays.get(VertexAttributeName.indices);
        let positionAttr = attributeArrays.get(VertexAttributeName.position);
        let jointsAttr = attributeArrays.get(VertexAttributeName.joints0);
        let weightAttr = attributeArrays.get(VertexAttributeName.weights0);

        var bonePositions = new Float32Array(NUM * 4);
        var boneIndices = new Float32Array(NUM * 4);
        var boneWeights = new Float32Array(NUM * 4);

        for (var i = 0; i < NUM; ++i) {
            let triangleCount = indicesAttr.data.length / 3;
            let index = i % triangleCount; // Math.floor(Math.random() * triangleCount);

            let vertexIndexA = indicesAttr.data[index + 0];
            let vertexIndexB = indicesAttr.data[index + 1];
            let vertexIndexC = indicesAttr.data[index + 2];

            let vertexPositionA = [positionAttr.data[vertexIndexA * 3 + 0], positionAttr.data[vertexIndexA * 3 + 1], positionAttr.data[vertexIndexA * 3 + 2]];
            let vertexPositionB = [positionAttr.data[vertexIndexB * 3 + 0], positionAttr.data[vertexIndexB * 3 + 1], positionAttr.data[vertexIndexB * 3 + 2]];
            let vertexPositionC = [positionAttr.data[vertexIndexC * 3 + 0], positionAttr.data[vertexIndexC * 3 + 1], positionAttr.data[vertexIndexC * 3 + 2]];

            let vertexJointIndexA = [jointsAttr.data[vertexIndexA * 4 + 0], jointsAttr.data[vertexIndexA * 4 + 1], jointsAttr.data[vertexIndexA * 4 + 2], jointsAttr.data[vertexIndexA * 4 + 3]];
            let vertexJointIndexB = [jointsAttr.data[vertexIndexB * 4 + 0], jointsAttr.data[vertexIndexB * 4 + 1], jointsAttr.data[vertexIndexB * 4 + 2], jointsAttr.data[vertexIndexB * 4 + 3]];
            let vertexJointIndexC = [jointsAttr.data[vertexIndexC * 4 + 0], jointsAttr.data[vertexIndexC * 4 + 1], jointsAttr.data[vertexIndexC * 4 + 2], jointsAttr.data[vertexIndexC * 4 + 3]];

            let vertexJointWeightA = [weightAttr.data[vertexIndexA * 4 + 0], weightAttr.data[vertexIndexA * 4 + 1], weightAttr.data[vertexIndexA * 4 + 2], weightAttr.data[vertexIndexA * 4 + 3]];
            let vertexJointWeightB = [weightAttr.data[vertexIndexB * 4 + 0], weightAttr.data[vertexIndexB * 4 + 1], weightAttr.data[vertexIndexB * 4 + 2], weightAttr.data[vertexIndexB * 4 + 3]];
            let vertexJointWeightC = [weightAttr.data[vertexIndexC * 4 + 0], weightAttr.data[vertexIndexC * 4 + 1], weightAttr.data[vertexIndexC * 4 + 2], weightAttr.data[vertexIndexC * 4 + 3]];

            var u = Math.random(),
                v = Math.random();
            var tmp = Math.sqrt(u);
            var a = 1 - tmp;
            var b = v * tmp;
            var c = 1 - a - b;

            var weightsByIndex: { [key: number]: any } = {};

            for (var n = 0; n < 4; ++n) {
                if (weightsByIndex[vertexJointIndexA[n]] === undefined) {
                    weightsByIndex[vertexJointIndexA[n]] = vertexJointWeightA[n] * a;
                } else {
                    weightsByIndex[vertexJointIndexA[n]] += vertexJointWeightA[n] * a;
                }
            }

            for (var n = 0; n < 4; ++n) {
                if (weightsByIndex[vertexJointIndexB[n]] === undefined) {
                    weightsByIndex[vertexJointIndexB[n]] = vertexJointWeightB[n] * b;
                } else {
                    weightsByIndex[vertexJointIndexB[n]] += vertexJointWeightB[n] * b;
                }
            }

            for (var n = 0; n < 4; ++n) {
                if (weightsByIndex[vertexJointIndexC[n]] === undefined) {
                    weightsByIndex[vertexJointIndexC[n]] = vertexJointWeightC[n] * c;
                } else {
                    weightsByIndex[vertexJointIndexC[n]] += vertexJointWeightC[n] * c;
                }
            }

            var j = 0;
            for (let index in weightsByIndex) {
                boneIndices[i * 4 + j] = parseInt(index);
                boneWeights[i * 4 + j] = weightsByIndex[index];
                j++;
            }

            var point = this.barycentricToCartesian(vertexPositionA, vertexPositionB, vertexPositionC, a, b, c);

            bonePositions[i * 4] = point[0];
            bonePositions[i * 4 + 1] = point[1];
            bonePositions[i * 4 + 2] = point[2];
            bonePositions[i * 4 + 3] = 0;
        }

        this.mBonePositionsBuffer = new ComputeGPUBuffer(bonePositions.length);
        this.mBonePositionsBuffer.setFloat32Array("", bonePositions);
        this.mBonePositionsBuffer.apply();
        this.mBoneIndicesBuffer = new ComputeGPUBuffer(boneIndices.length);
        this.mBoneIndicesBuffer.setFloat32Array("", boneIndices);
        this.mBoneIndicesBuffer.apply();
        this.mBoneWeightsBuffer = new ComputeGPUBuffer(boneWeights.length);
        this.mBoneWeightsBuffer.setFloat32Array("", boneWeights);
        this.mBoneWeightsBuffer.apply();

        this.initPipeline();
    }

    public compute(command: GPUCommandEncoder) {
        const { BASE_LIFETIME, PRESIMULATION_DELTA_TIME, NUM, GROUP_SIZE } = this.mConfig;

        let compute_command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(compute_command, [this.mCopyBoneMatrixComputeShader]);

        for (var i = 0; i < (this.mFirstFrame ? BASE_LIFETIME / PRESIMULATION_DELTA_TIME : 1); ++i) {
            GPUContext.computeCommand(compute_command, [this.mSimulationComputeShader, this.mCopyComputeShader]);
            // GPUContext.computeCommand(compute_command, [this.mSimulationComputeShader]);
        }

        GPUContext.endCommandEncoder(command);

        this.mFirstFrame = false;
    }

    protected initPipeline() {

        this.mBoneMatrixBuffer = new ComputeGPUBuffer(16 * this.mAnimatorComponent.numJoint);

        this.mCopyBoneMatrixComputeShader = new ComputeShader(CopyBoneMatrix.cs);
        this.mCopyBoneMatrixComputeShader.setStorageBuffer(`matrixs`, GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
        this.mCopyBoneMatrixComputeShader.setStorageBuffer(`jointsMatrixIndexTable`, this.mAnimatorComponent.jointMatrixIndexTableBuffer);
        this.mCopyBoneMatrixComputeShader.setStorageBuffer(`bonesTransformMatrix`, this.mBoneMatrixBuffer);
        this.mCopyBoneMatrixComputeShader.workerSizeX = Math.ceil(this.mAnimatorComponent.numJoint / 16);

        const { NUM, GROUP_SIZE } = this.mConfig;
        this.mSimulationComputeShader = new ComputeShader(Simulation.cs);
        this.mSimulationComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`boneposition`, this.mBonePositionsBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`boneindices`, this.mBoneIndicesBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`boneweights`, this.mBoneWeightsBuffer);

        this.mSimulationComputeShader.setStorageBuffer(`bonesTransform`, this.mBoneMatrixBuffer);
        this.mSimulationComputeShader.setStorageBuffer(`bonesInverseMatrix`, this.mSkinnedMeshRenderer.inverseBindMatrixBuffer);

        this.mSimulationComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);

        this.mCopyComputeShader = new ComputeShader(Copy.cs);
        this.mCopyComputeShader.setStorageBuffer(`input`, this.mInputBuffer);
        this.mCopyComputeShader.setStorageBuffer(`position`, this.mPositionBuffer);
        this.mCopyComputeShader.setStorageBuffer(`newposition`, this.mNewPositionBuffer);
        this.mCopyComputeShader.workerSizeX = Math.ceil(NUM / GROUP_SIZE);
    }

    protected barycentricToCartesian(vertexA: number[], vertexB: number[], vertexC: number[], a: number, b: number, c: number) {
        var result = [vertexA[0] * a + vertexB[0] * b + vertexC[0] * c, vertexA[1] * a + vertexB[1] * b + vertexC[1] * c, vertexA[2] * a + vertexB[2] * b + vertexC[2] * c];
        return result;
    }
}

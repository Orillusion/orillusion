import { AnimatorComponent, ClusterLightingBuffer, ComputeGPUBuffer, GeometryBase, MeshRenderer, PassType, RendererMask, RendererPassState, SkeletonAnimationComponent, SkinnedMeshRenderer, SkinnedMeshRenderer2, Time, View3D } from '@orillusion/core';
import { FlameSimulatorConfig } from './FlameSimulatorConfig';
import { FlameSimulatorPipeline } from './FlameSimulatorPipeline';

export class FlameSimulator extends MeshRenderer {
    protected mConfig: FlameSimulatorConfig;
    protected mFlameComputePipeline: FlameSimulatorPipeline;
    protected mGlobalArgs: ComputeGPUBuffer;
    constructor() {
        super();
        this.addRendererMask(RendererMask.Particle)
        this.mConfig = {
            GROUP_SIZE: 128,
            NUM: 60000,
            SPAWN_RADIUS: 0.1,
            BASE_LIFETIME: 0.7,
            MAX_ADDITIONAL_LIFETIME: 5,
            PRESIMULATION_DELTA_TIME: 0.2,
            INITIAL_SPEED: 1,
            INITIAL_TURBULENCE: 0.4,
            NOISE_OCTAVES: 3,
            SCALE: 10,
            NUMBER_OF_BONES: 57,
            ANIMATION_FPS: 30,
            ANIMATION_LENGTH: 0.7333,
            MAX_DELTA_TIME: 2,
        };
    }
    public setConfig(config: FlameSimulatorConfig) {
        this.mConfig = config;
    }

    public start() {
        var globalArgsData = new Float32Array(4);
        this.mGlobalArgs = new ComputeGPUBuffer(globalArgsData.byteLength);
        globalArgsData[0] = this.transform.worldMatrix.index;
        this.mGlobalArgs.setFloat32Array("", globalArgsData);
        this.mGlobalArgs.apply();

        this.instanceCount = this.mConfig.NUM;
    }

    public stop() { }

    public onCompute(view: View3D, command?: GPUCommandEncoder) {
        if (this.mFlameComputePipeline) {
            this.mFlameComputePipeline.updateInput(Time.time / 1000.0, Time.delta / 1000.0);
            this.mFlameComputePipeline.updateInputData();
            this.mFlameComputePipeline.compute(command);
        }
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        if (!this.mFlameComputePipeline) {
            let animatorComponent = this.object3D.getComponentsInChild(AnimatorComponent)[0];
            let skinnedMeshRenderer = this.object3D.getComponentsInChild(SkinnedMeshRenderer2)[0];
            let attributeArrays = skinnedMeshRenderer.geometry.vertexAttributeMap;
            this.mFlameComputePipeline = new FlameSimulatorPipeline(this.mConfig, animatorComponent, skinnedMeshRenderer);
            this.mFlameComputePipeline.initParticle(attributeArrays);

            let material = this.materials[0];
            let passes = material.getPass(passType)
            if (passes) {
                for (let i = 0; i < passes.length; i++) {
                    var subs = passes[i];
                    subs.setStorageBuffer(`particlePosition`, this.mFlameComputePipeline.positionBuffer);
                    subs.setStorageBuffer(`particleGlobalData`, this.mGlobalArgs);
                }
            }
        }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }
}

import { PlaneGeometry, RendererPassState, MeshRenderer, Vector3, webGPUContext, PassType, View3D, ComputeGPUBuffer, ClusterLightingBuffer } from '@orillusion/core';
import { FlowSimulatorConfig } from "./FlowSimulatorConfig";
import { FlowSimulatorMaterial } from "./FlowSimulatorMaterial";
import { FlowSimulatorPipeline } from "./FlowSimulatorPipeline";

export class FlowSimulator extends MeshRenderer {
    protected mConfig: FlowSimulatorConfig;
    protected mGlobalArgs: ComputeGPUBuffer;
    protected mFlowComputePipeline: FlowSimulatorPipeline;
    
    constructor() {
        super()
        this.mConfig = {
            GROUP_SIZE: 128,
            NUM: 60000,
            SPAWN_RADIUS: 0.1,
            BASE_LIFETIME: 10,
            MAX_ADDITIONAL_LIFETIME: 5,
            PRESIMULATION_DELTA_TIME: 0.1,
            INITIAL_SPEED: 2,
            INITIAL_TURBULENCE: 0.3,
            NOISE_OCTAVES: 3,
            directionX: 0.0, //X -1~1
            directionY: 0.2000000, //Y -1~1
            directionZ: 0.0, //Z -1~1
        }
    }

    public init() {
        super.init();
        this.alwaysRender = true;
        this.geometry = new PlaneGeometry(0.01, 0.01, 1.0, 1.0, Vector3.Z_AXIS);
        this.material = new FlowSimulatorMaterial();
        let device = webGPUContext.device;

        var globalArgsData = new Float32Array(4);
        this.mGlobalArgs = new ComputeGPUBuffer(globalArgsData.byteLength);
        globalArgsData[0] = this.transform.worldMatrix.index;
        this.mGlobalArgs.setFloat32Array("", globalArgsData);
        this.mGlobalArgs.apply();

        this.mFlowComputePipeline = new FlowSimulatorPipeline(this.mConfig);
        
        this.instanceCount = this.mConfig.NUM;
    }

    public stop() { }

    public onCompute(view: View3D, command?: GPUCommandEncoder) {
        this.mFlowComputePipeline.compute(command);
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        let material = this.materials[0];
        let passes = material.getPass(passType);
        if (passes) {
            for (let i = 0; i < passes.length; i++) {
                var subs = passes[i];
                subs.setStorageBuffer(`particlePosition`, this.mFlowComputePipeline.positionBuffer);
                subs.setStorageBuffer(`particleGlobalData`, this.mGlobalArgs);
                }
            }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }

}

import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { ClusterLightingBuffer, ComputeGPUBuffer, MeshRenderer, PassType, PlaneGeometry, RendererMask, RendererPassState, Vector3, View3D, webGPUContext } from '@orillusion/core';
import { FlowImgSimulatorConfig } from "./FlowImgSimulatorConfig";
import { FlowImgSimulatorMaterial } from "./FlowImgSimulatorMaterial";
import { FlowImgSimulatorPipeline } from "./FlowImgSimulatorPipeline";

export class FlowImgSimulator extends MeshRenderer {
    protected mConfig: FlowImgSimulatorConfig;
    protected mFlowImgComputePipeline: FlowImgSimulatorPipeline;
    protected mGlobalArgs: ComputeGPUBuffer;
    protected mImagedata: any;
    constructor() {
        super();
        this.addRendererMask(RendererMask.Particle);
        this.mConfig = {
            GROUP_SIZE: 128,
            NUM: 200000, //partical number 1W~100W
            PARTICAL_RADIUS: 0, // 1 / Math.sqrt(NUM),
            SPAWN_RADIUS: 0.05, //thickness 0~0.1
            BASE_LIFETIME: 0.01,
            MAX_ADDITIONAL_LIFETIME: 0.5, //lifetime 0~1
            PRESIMULATION_DELTA_TIME: 0.2,
            INITIAL_SPEED: 0.5, // partical speed 0~1
            INITIAL_TURBULENCE: 0.0, // turbulence 0~1
            NOISE_OCTAVES: 3,
            MAX_DELTA_TIME: 1,
            directionX: 0.0, //X -1~1
            directionY: -0.2000000, //Y -1~1
            directionZ: -0.5000000, //Z -1~1
        };
        this.mConfig.PARTICAL_RADIUS = 1 / Math.sqrt(this.mConfig.NUM);
        let time
        let reset = () => {
            clearTimeout(time)
            time = setTimeout(() => {
                this.reset(this.mConfig)
            }, 100)
        }
        GUIHelp.addFolder("FlowImgSimulator");
        GUIHelp.add(this.mConfig, 'PARTICAL_RADIUS', 0.001, 1, 0.001).onChange(reset);
        GUIHelp.add(this.mConfig, 'SPAWN_RADIUS', 0, 0.1, 0.01).onChange(reset);
        GUIHelp.add(this.mConfig, 'MAX_ADDITIONAL_LIFETIME', 0, 2, 0.01).onChange(reset);
        // GUIHelp.addButton("Reset", () => {
        //     this.reset(this.mConfig);
        // });
        GUIHelp.add(this.mConfig, 'INITIAL_SPEED', 0, 1, 0.01);
        GUIHelp.add(this.mConfig, 'INITIAL_TURBULENCE', 0, 1, 0.01);
        GUIHelp.add(this.mConfig, 'directionX', -1, 1, 0.01);
        GUIHelp.add(this.mConfig, 'directionY', -1, 1, 0.01);
        GUIHelp.add(this.mConfig, 'directionZ', -1, 1, 0.01);
        //GUIHelp.endFolder();
    }

    public reset(config?: FlowImgSimulatorConfig) {
        if (config)
            this.mConfig = config;
        this.mFlowImgComputePipeline.reinitGPUBuffer(this.mConfig, this.mImagedata);
    }

    public setImageData(image: any) {
        this.mImagedata = image;
    }

    public init() {
        super.init();
        const { PARTICAL_RADIUS } = this.mConfig;
        this.alwaysRender = true;
        this.geometry = new PlaneGeometry(PARTICAL_RADIUS * 2.0, PARTICAL_RADIUS * 2.0, 1.0, 1.0, Vector3.Z_AXIS);
        this.material = new FlowImgSimulatorMaterial();
        let device = webGPUContext.device;

        var globalArgsData = new Float32Array(4);
        this.mGlobalArgs = new ComputeGPUBuffer(globalArgsData.byteLength);
        globalArgsData[0] = this.transform.worldMatrix.index;
        globalArgsData[1] = this.mConfig.PARTICAL_RADIUS;
        this.mGlobalArgs.setFloat32Array("", globalArgsData);
        this.mGlobalArgs.apply();

        this.instanceCount = this.mConfig.NUM;
    }

    public start() {
        super.start();
        this.mFlowImgComputePipeline = new FlowImgSimulatorPipeline(this.mConfig, this.mImagedata);
    }

    public stop() { }

    public onCompute(view: View3D, command?: GPUCommandEncoder) {
        this.mFlowImgComputePipeline.compute(command);
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        let material = this.materials[0];
        let passes = material.getPass(passType);
        if (passes) {
            for (let i = 0; i < passes.length; i++) {
                var subs = passes[i];
                subs.setStorageBuffer(`particlePosition`, this.mFlowImgComputePipeline.positionBuffer);
                subs.setStorageBuffer(`particleColor`, this.mFlowImgComputePipeline.colorBuffer);
                subs.setStorageBuffer(`particleGlobalData`, this.mGlobalArgs);
                }
            }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }
}

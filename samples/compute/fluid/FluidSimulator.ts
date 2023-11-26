import { ClusterLightingBuffer, ComputeGPUBuffer, MeshRenderer, PassType, RendererMask, RendererPassState, Time, Vector3, View3D, webGPUContext } from '@orillusion/core';
import { FluidSimulatorConfig } from './FluidSimulatorConfig';
import { FluidSimulatorPipeline } from './FluidSimulatorPipeline';

export class FluidEmulation extends MeshRenderer {
    protected mConfig: FluidSimulatorConfig;
    protected mFluidComputePipeline: FluidSimulatorPipeline;
    protected mModelViewBuffer: GPUBuffer;
    protected mGlobalArgs: ComputeGPUBuffer;

    constructor() {
        super();
        this.rendererMask = RendererMask.Particle;
        this.mConfig = {
            GROUP_SIZE: 128,
            XMIN: 0,
            XMAX: 15,
            YMIN: 10,
            YMAX: 20,
            ZMIN: 0,
            ZMAX: 20,
            scaleV: 3,
            scale: 0,
            gridSizeX: 30,
            gridSizeY: 20,
            gridSizeZ: 20,
            gridResolutionX: 0,
            gridResolutionY: 0,
            gridResolutionZ: 0,
            initDensity: 20,
            NUM: 0,
            dispatchNUM: 0,
            GRIDNUM: 0,
            dispatchGRID: 0,
            CELLNUM: 0,
            dispatchCELL: 0,
            maxDensity: 0,
            timeStep: 1.0 / 60.0,
            PRESSURE_JACOBI_ITERATIONS: 100,
            flipness: 0.95,
        };
    }

    public setConfig(config: { [key in keyof FluidSimulatorConfig]?: number }) {
        Object.assign(this.mConfig, config);
    }

    public start() {
        const { initDensity, XMIN, XMAX, YMIN, YMAX, ZMIN, ZMAX, scaleV } = this.mConfig;
        this.mConfig.scale = Math.pow(scaleV, 1.0 / 3.0);
        this.mConfig.gridResolutionX = Math.ceil(this.mConfig.gridSizeX * 1);
        this.mConfig.gridResolutionY = Math.ceil(this.mConfig.gridSizeY * 1);
        this.mConfig.gridResolutionZ = Math.ceil(this.mConfig.gridSizeZ * 1);
        this.mConfig.NUM = Math.ceil(initDensity * (XMAX - XMIN) * (YMAX - YMIN) * (ZMAX - ZMIN) * scaleV);
        this.mConfig.dispatchNUM = Math.ceil(this.mConfig.NUM / this.mConfig.GROUP_SIZE);
        this.mConfig.GRIDNUM = (this.mConfig.gridResolutionX + 1) * (this.mConfig.gridResolutionY + 1) * (this.mConfig.gridResolutionZ + 1);
        this.mConfig.dispatchGRID = Math.ceil(this.mConfig.GRIDNUM / this.mConfig.GROUP_SIZE);
        this.mConfig.CELLNUM = this.mConfig.gridResolutionX * this.mConfig.gridResolutionY * this.mConfig.gridResolutionZ;
        this.mConfig.dispatchCELL = Math.ceil(this.mConfig.CELLNUM / this.mConfig.GROUP_SIZE);
        this.mConfig.maxDensity = this.mConfig.NUM / (this.mConfig.XMAX - this.mConfig.XMIN) / (this.mConfig.YMAX - this.mConfig.YMIN) / (this.mConfig.ZMAX - this.mConfig.ZMIN);

        this.mFluidComputePipeline = new FluidSimulatorPipeline(this.mConfig);
        let device = webGPUContext.device;
        const { NUM } = this.mConfig;

        const modelView = new Float32Array(16 * NUM);
        for (let i = 0; i < NUM; ++i) {
            const offset = i * 16;
            modelView[offset + 0] = 1;
            modelView[offset + 5] = 1;
            modelView[offset + 10] = 1;
            modelView[offset + 15] = 1;
        }
        const modelViewBuffer = device.createBuffer({
            size: modelView.byteLength * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(modelViewBuffer, 0, modelView);

        const mvp = new Float32Array(16 * NUM);
        for (let i = 0; i < NUM; ++i) {
            const offset = i * 16;
            mvp[offset + 0] = 1;
            mvp[offset + 5] = 1;
            mvp[offset + 10] = 1;
            mvp[offset + 15] = 1;
        }
        const mvpBuffer = device.createBuffer({
            size: mvp.byteLength * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(mvpBuffer, 0, mvp);

        var globalArgsData = new Float32Array(4);
        this.mGlobalArgs = new ComputeGPUBuffer(globalArgsData.byteLength);
        globalArgsData[0] = this.transform.worldMatrix.index;
        this.mGlobalArgs.setFloat32Array("", globalArgsData);
        this.mGlobalArgs.apply();

        this.instanceCount = this.mConfig.NUM;
    }

    public stop() { }

    public updateInputInfo(origin: Vector3, direction: Vector3, velocity: Vector3) {
        this.mFluidComputePipeline.updateInput(origin, direction, velocity);
    }

    private _tickTime = 0;

    public onCompute(view: View3D, command?: GPUCommandEncoder) {
        this._tickTime += Time.delta;
        this.mFluidComputePipeline.updateInputData();
        // if(this._tickTime>=10){
        this.mFluidComputePipeline.compute(command);
        this._tickTime = 0;
        // }

    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        let material = this.materials[0];
        let passes = material.getPass(passType);
        if (passes) {
            for (let i = 0; i < passes.length; i++) {
                var subs = passes[i];
                subs.setStorageBuffer(`particlePosition`, this.mFluidComputePipeline.positionBuffer);
                subs.setStorageBuffer(`particleColor`, this.mFluidComputePipeline.colorBuffer);
                subs.setStorageBuffer(`particleGlobalData`, this.mGlobalArgs);
                }
            }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }
}

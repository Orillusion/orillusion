import { webGPUContext } from '../../../gfx/graphics/webGpu/Context3D';

/**
 * Skeletal animation
 * @internal
 * @group Animation
 */
export class SkeletonAnimationCompute {
    private _computePipeline: GPUComputePipeline;
    private _computeBindGroup: GPUBindGroup;

    constructor(computeShader: string, entries: GPUBindGroupEntry[]) {
        let device = webGPUContext.device;
        this._computePipeline = device.createComputePipeline({
            layout: `auto`,
            compute: {
                module: device.createShaderModule({
                    code: computeShader,
                }),
                entryPoint: 'CsMain',
            },
        });

        this._computeBindGroup = device.createBindGroup({
            layout: this._computePipeline.getBindGroupLayout(0),
            entries: entries,
        });
    }

    public compute(command: GPUCommandEncoder, workgroupCountX: GPUSize32, workgroupCountY?: GPUSize32, workgroupCountZ?: GPUSize32): this {
        let computePass = command.beginComputePass();
        computePass.setPipeline(this._computePipeline);
        computePass.setBindGroup(0, this._computeBindGroup);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ);
        computePass.end();
        return this;
    }
}

import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { webGPUContext } from '../../graphics/webGpu/Context3D';

import { TextureCubeUtils } from './TextureCubeUtils';
import { GPUContext } from '../../renderJob/GPUContext';
import { IBLEnvMapCreator_cs } from '../../../assets/shader/compute/IBLEnvMapCreator_cs';

/**
 * @internal
 * @group GFX
 */
export class IBLEnvMapCreator {
    private static configBuffer: GPUBuffer = null;
    private static quaternionBuffer: GPUBuffer = null;
    private static blurSettingBuffer: GPUBuffer = null;
    private static pipeline: GPUComputePipeline;

    static importantSample(image: { width: number; height: number; erpTexture: Texture }, dstSize: number, roughness: number, dstView: GPUTextureView): void {
        const device = webGPUContext.device;
        if (this.pipeline == null) {
            this.pipeline = device.createComputePipeline({
                layout: `auto`,
                compute: {
                    module: device.createShaderModule({
                        code: IBLEnvMapCreator_cs,
                    }),
                    entryPoint: 'main',
                },
            });
        }
        const computePipeline = this.pipeline;

        //config
        const configStride = 4 * 4; //4 float
        this.configBuffer ||= device.createBuffer({
            size: configStride,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.configBuffer, 0, new Uint32Array([image.width, image.height, dstSize, dstSize]));

        const quaternionSize = 4 * 6; ////xyzw * float
        //quaternion
        if (!this.quaternionBuffer) {
            this.quaternionBuffer = device.createBuffer({
                size: quaternionSize * 4 * 6,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });

            let qArray = new Float32Array(4 * 6);
            for (let i = 0; i < 6; i++) {
                let q = TextureCubeUtils.getRotationToFace(i);
                qArray[i * 4 + 0] = q.x;
                qArray[i * 4 + 1] = q.y;
                qArray[i * 4 + 2] = q.z;
                qArray[i * 4 + 3] = q.w;
            }
            device.queue.writeBuffer(this.quaternionBuffer, 0, qArray);
        }

        //roughness
        this.blurSettingBuffer ||= device.createBuffer({
            size: configStride,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.blurSettingBuffer, 0, new Float32Array([roughness, 0, 0, 0]));

        //image
        const inputImageBuffer = image.erpTexture;

        let entries0 = [
            {
                binding: 0,
                resource: {
                    buffer: this.configBuffer,
                    size: 4 * 4,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: this.quaternionBuffer,
                    size: quaternionSize * 4,
                },
            },
            {
                binding: 2,
                resource: inputImageBuffer.gpuSampler,
            },
            {
                binding: 3,
                resource: inputImageBuffer.getGPUView(),
            },
        ];

        let entries1 = [
            {
                binding: 0,
                resource: {
                    buffer: this.blurSettingBuffer,
                    size: 4 * 4,
                },
            },
            {
                binding: 1,
                resource: dstView,
            },
        ];

        const computeBindGroup0 = device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(0),
            entries: entries0,
        });

        const computeBindGroup1 = device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(1),
            entries: entries1,
        });

        const commandEncoder = GPUContext.beginCommandEncoder();
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, computeBindGroup0);
        computePass.setBindGroup(1, computeBindGroup1);
        computePass.dispatchWorkgroups(dstSize / 8, dstSize / 8, 6);

        computePass.end();
        GPUContext.endCommandEncoder(commandEncoder);
    }
}

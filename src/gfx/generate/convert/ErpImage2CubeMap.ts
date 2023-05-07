import { VirtualTexture } from '../../../textures/VirtualTexture';
import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { TextureCubeUtils } from './TextureCubeUtils';
import { GPUContext } from '../../renderJob/GPUContext';
import { ErpImage2CubeMapCreateCube_cs } from '../../../assets/shader/compute/ErpImage2CubeMapCreateCube_cs';
import { ErpImage2CubeMapRgbe2rgba_cs } from '../../../assets/shader/compute/ErpImage2CubeMapRgbe2rgba_cs';
/**
 * @internal
 * @group GFX
 */
export class ErpImage2CubeMap {
    public static convertRGBE2RGBA(image: VirtualTexture, data: Float32Array): void {
        const device = webGPUContext.device;
        const computePipeline = device.createComputePipeline({
            layout: `auto`,
            compute: {
                module: device.createShaderModule({
                    code: ErpImage2CubeMapRgbe2rgba_cs,
                }),
                entryPoint: 'main',
            },
        });

        //config
        const configBuffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(configBuffer, 0, new Uint32Array([image.width, image.height, image.width, image.height]));

        //input
        const input: GPUBuffer = device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });
        device.queue.writeBuffer(input, 0, data);

        //entries0
        let entries0 = [
            {
                binding: 0,
                resource: {
                    buffer: configBuffer,
                    size: 4 * 4,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: input,
                    size: data.byteLength,
                },
            },
            {
                binding: 2,
                resource: image.getGPUView(),
            },
        ];

        const computeBindGroup0 = device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(0),
            entries: entries0,
        });

        const commandEncoder = GPUContext.beginCommandEncoder();
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, computeBindGroup0);
        computePass.dispatchWorkgroups(Math.floor(image.width / 8), Math.floor(image.height / 8));

        computePass.end();

        GPUContext.endCommandEncoder(commandEncoder);

        configBuffer.destroy();
    }

    private static makeFaceTexturePipeline: GPUComputePipeline;
    private static configBuffer: GPUBuffer;
    private static quaternionBuffer: GPUBuffer;

    //Image is the float32 color value converted from rgbe to rgba
    public static makeTextureCube(image: Texture, dstSize: number, dstView: GPUTextureView): void {
        const device = webGPUContext.device;
        ErpImage2CubeMap.makeFaceTexturePipeline ||= device.createComputePipeline({
            layout: `auto`,
            compute: {
                module: device.createShaderModule({
                    code: ErpImage2CubeMapCreateCube_cs,
                }),
                entryPoint: 'main',
            },
        });
        const computePipeline = ErpImage2CubeMap.makeFaceTexturePipeline;

        //config
        const configStride = 4 * 4; //4 float
        ErpImage2CubeMap.configBuffer ||= device.createBuffer({
            size: configStride,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(ErpImage2CubeMap.configBuffer, 0, new Uint32Array([image.width, image.height, dstSize, dstSize]));

        //quaternion
        const quaternionSize = 4 * 6; ////xyzw * float
        if (!ErpImage2CubeMap.quaternionBuffer) {
            ErpImage2CubeMap.quaternionBuffer = device.createBuffer({
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
            device.queue.writeBuffer(ErpImage2CubeMap.quaternionBuffer, 0, qArray);
        }

        //output
        let entries0 = [
            {
                binding: 0,
                resource: {
                    buffer: ErpImage2CubeMap.configBuffer,
                    size: 4 * 4,
                },
            },
            {
                binding: 1,
                resource: {
                    buffer: ErpImage2CubeMap.quaternionBuffer,
                    size: quaternionSize * 4,
                },
            },
            {
                binding: 2,
                resource: image.gpuSampler,
            },
            {
                binding: 3,
                resource: image.getGPUView(),
            },
        ];

        let entries1 = [
            {
                binding: 0,
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

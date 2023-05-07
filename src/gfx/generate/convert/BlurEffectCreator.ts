import { BlurEffectCreatorBlur_cs, BlurEffectCreatorSample_cs } from '../../../assets/shader/compute/BlurEffectCreator_cs';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { GPUContext } from '../../renderJob/GPUContext';
/**
 * @internal
 * @group GFX
 */
export class BlurTexture2DBufferCreator {
    //Image is the texture of converting from rgba8unorm to rgba8unorm
    public static blurImageFromTexture(image: { width: number; height: number; gpuTexture: GPUTexture }, dstWidth: number, dstHeight: number, blur: boolean): GPUTexture {
        const device = webGPUContext.device;
        let code: string = blur ? BlurEffectCreatorBlur_cs : BlurEffectCreatorSample_cs;
        const computePipeline = device.createComputePipeline({
            layout: `auto`,
            compute: {
                module: device.createShaderModule({
                    code: code,
                }),
                entryPoint: 'main',
            },
        });

        //config
        const configStride = 4 * 4; //4 float
        const configBuffer = device.createBuffer({
            size: configStride,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(configBuffer, 0, new Uint32Array([image.width, image.height, dstWidth, dstHeight]));

        //output
        const outputTexture = device.createTexture({
            size: [dstWidth, dstHeight, 1],
            mipLevelCount: 1,
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
            label: `blurImageFromTexture`,
        });

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
                resource: image.gpuTexture.createView({
                    format: 'rgba8unorm',
                    dimension: '2d',
                    baseMipLevel: 0,
                    mipLevelCount: 1,
                }),
            },
            {
                binding: 2,
                resource: outputTexture.createView({
                    format: 'rgba8unorm',
                    dimension: '2d',
                    baseMipLevel: 0,
                    mipLevelCount: 1,
                }),
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
        computePass.dispatchWorkgroups(Math.floor(dstWidth / 8), Math.floor(dstHeight / 8));

        computePass.end();

        GPUContext.endCommandEncoder(commandEncoder);

        configBuffer.destroy();

        return outputTexture;
    }
}

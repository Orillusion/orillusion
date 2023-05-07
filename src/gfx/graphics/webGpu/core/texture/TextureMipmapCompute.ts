import { GPUContext } from '../../../../renderJob/GPUContext';
import { webGPUContext } from '../../Context3D';
import { Texture } from './Texture';

class MipMapData {
    public mipLevel: number;
    public mipmapCount: number;
    public texture: Texture;
    public srcView: GPUTextureView;
    public dstWidth: number;
    public dstHeight: number;
}
/**
 * @internal
 * @group GFX
 */
export class TextureMipmapCompute {
    private static codeMax = `
        @group(0) @binding(0) var inputTexture : texture_2d<f32>;
        @group(0) @binding(1) var inputTextureSampler : sampler;
        @group(0) @binding(2) var outputTexture : texture_storage_2d<rgba8unorm, write>;
        
        @compute @workgroup_size(8, 8)
        fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
            let dstSize = textureDimensions(outputTexture).xy;
            let uv01 = vec2<f32>(f32(GlobalInvocationID.x) / f32(dstSize.x - 1), f32(GlobalInvocationID.y) / f32(dstSize.y - 1));
            var fromColor = textureSampleLevel(inputTexture, inputTextureSampler, uv01, 0.0);
            let dstCoord = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
            
            //fromColor = vec4<f32>(0.0, 0.0, 0.0, 1.0);
            //if(dstSize.x == 512){
            //    fromColor.x = 1.0;
            //}else  if(dstSize.x == 256){
            //    fromColor.y = 1.0;
            //}else if(dstSize.x == 128){
            //    fromColor.z = 1.0;
            //}
            
            textureStore(outputTexture, dstCoord, fromColor);
        }
    `;
    private static codeMin = `
        @group(0) @binding(0) var inputTexture : texture_2d<f32>;
        @group(0) @binding(1) var inputTextureSampler : sampler;
        @group(0) @binding(2) var outputTexture : texture_storage_2d<rgba8unorm, write>;
        
        @compute @workgroup_size(1, 1)
        fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
            let dstSize = textureDimensions(outputTexture).xy;
            let uv01 = vec2<f32>(f32(GlobalInvocationID.x) / f32(dstSize.x - 1), f32(GlobalInvocationID.y) / f32(dstSize.y - 1));
            var fromColor = textureSampleLevel(inputTexture, inputTextureSampler, uv01, 0.0);
            let dstCoord = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
            
            textureStore(outputTexture, dstCoord, fromColor);
        }
    `;

    private static _pipelineMax: GPUComputePipeline;
    private static _pipelineMin: GPUComputePipeline;

    public static createMipmap(texture: Texture, mipmapCount: number): void {
        const device = webGPUContext.device;
        this._pipelineMax ||= device.createComputePipeline({
            layout: `auto`,
            compute: {
                module: device.createShaderModule({
                    code: this.codeMax,
                }),
                entryPoint: 'main',
            },
        });

        this._pipelineMin ||= device.createComputePipeline({
            layout: `auto`,
            compute: {
                module: device.createShaderModule({
                    code: this.codeMin,
                }),
                entryPoint: 'main',
            },
        });

        let dstWidth = Math.ceil(texture.width * 0.5);
        let dstHeight = Math.ceil(texture.height * 0.5);
        let mipmapData: MipMapData = { mipmapCount: mipmapCount, texture: texture, srcView: null, mipLevel: 1, dstHeight: dstHeight, dstWidth: dstWidth };
        mipmapData.srcView = texture.getGPUTexture().createView({
            format: texture.format,
            dimension: '2d',
            baseMipLevel: 0, // Make sure we're getting the right mip level...
            mipLevelCount: 1, // And only selecting one mip level
        });

        let isMax = texture.width > 1024 && texture.height > 1024;
        if (isMax) {
            this.mipmap(this._pipelineMax, mipmapData);
        } else {
            this.mipmap(this._pipelineMin, mipmapData);
        }
    }

    private static mipmap(computePipeline: GPUComputePipeline, data: MipMapData): void {
        const device = webGPUContext.device;
        const commandEncoder = GPUContext.beginCommandEncoder();
        let isCurrentMax = computePipeline == this._pipelineMax;
        let dstView: GPUTextureView;
        let isBreakToMin: boolean;
        for (let i = data.mipLevel; i < data.mipmapCount; i++) {
            let entries = [];
            let binding: number = 0;
            entries.push({
                binding: binding++,
                resource: data.srcView,
            });

            entries.push({
                binding: binding++,
                resource: data.texture.gpuSampler,
            });

            dstView = data.texture.getGPUTexture().createView({
                format: data.texture.format,
                dimension: '2d',
                baseMipLevel: i,
                mipLevelCount: 1,
            });

            entries.push({
                binding: binding++,
                resource: dstView,
            });

            const computeBindGroup = device.createBindGroup({
                layout: computePipeline.getBindGroupLayout(0),
                entries: entries,
            });

            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(computePipeline);
            computePass.setBindGroup(0, computeBindGroup);
            let groupX = data.dstWidth;
            let groupY = data.dstHeight;
            if (isCurrentMax) {
                groupX = Math.max(1, Math.floor(data.dstWidth / 8));
                groupY = Math.max(1, Math.floor(data.dstHeight / 8));
            }
            computePass.dispatchWorkgroups(groupX, groupY);
            data.dstHeight *= 0.5;
            data.dstWidth *= 0.5;
            data.srcView = dstView;
            data.mipLevel = i + 1;
            isBreakToMin = isCurrentMax && (data.dstWidth < 8 || data.dstHeight < 8);
            computePass.end();
            if (isBreakToMin) {
                break;
            }
        }
        GPUContext.endCommandEncoder(commandEncoder);

        if (isBreakToMin) {
            this.mipmap(this._pipelineMin, data);
        }
    }
}

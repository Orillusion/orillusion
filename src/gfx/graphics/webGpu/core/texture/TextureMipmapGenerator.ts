import { GPUContext } from '../../../../renderJob/GPUContext';
import { webGPUContext } from '../../Context3D';
import { GPUFilterMode } from '../../WebGPUConst';
import { Texture } from './Texture';
/**
 * @internal
 * @group GFX
 */
export class TextureMipmapGenerator {
    private static mipmapShader = `
        var<private> pos : array<vec2<f32>, 4> = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0),
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0));

        struct VertexOutput {
        @builtin(position) position : vec4<f32>,
        @location(0) texCoord : vec2<f32>
        };

        @vertex
        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
        var output : VertexOutput;
        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
        return output;
        }

        @binding(0) @group(0) var imgSampler : sampler;
        @binding(1) @group(0) var img : texture_2d<f32>;

        @fragment
        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
        var outColor: vec4<f32> = textureSampleLevel(img, imgSampler, texCoord , 0.0 );
        return outColor;
        }
      `;
    private static pipelineCache: { [key: string]: GPURenderPipeline } = {};
    private static pipeline: any;

    public static getMipmapPipeline(texture: Texture) {
        let gpuDevice = webGPUContext.device;
        let pipeline: GPURenderPipeline = TextureMipmapGenerator.pipelineCache[texture.format];
        if (!pipeline) {
            // Create a simple shader that renders a fullscreen textured quad.
            const mipmapShaderModule = gpuDevice.createShaderModule({
                code: TextureMipmapGenerator.mipmapShader,
            });

            let textureLayout = gpuDevice.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        //TODO : After adding a shadow reflection, it is necessary to know that the vertex is used | the segment is used
                        visibility: texture.visibility,
                        // use GPUSamplerBindingLayout = { type:`filtering`} error
                        sampler: texture.samplerBindingLayout,
                    },
                    {
                        binding: 1,
                        //TODO : After adding a shadow reflection, it is necessary to know that the vertex is used | the segment is used
                        visibility: texture.visibility,
                        // use GPUTextureBindingLayout = { sampleType:`float`} error
                        texture: texture.textureBindingLayout,
                    },
                ],
            });

            // Need a separate bind group for each level to ensurev
            // we're only sampling from the previous level.
            let layouts = webGPUContext.device.createPipelineLayout({
                bindGroupLayouts: [textureLayout],
            });

            pipeline = gpuDevice.createRenderPipeline({
                layout: layouts,
                vertex: {
                    module: mipmapShaderModule,
                    entryPoint: 'vertexMain',
                },
                fragment: {
                    module: mipmapShaderModule,
                    entryPoint: 'fragmentMain',
                    targets: [
                        {
                            format: texture.format, // Make sure to use the same format as the texture
                        },
                    ],
                },
                primitive: {
                    topology: 'triangle-strip',
                    stripIndexFormat: 'uint32',
                },
            });
            TextureMipmapGenerator.pipelineCache[texture.format] = pipeline;
        }
        return pipeline;
    }

    // TextureDescriptor should be the descriptor that the texture was created with.
    // This version only works for basic 2D textures.
    public static webGPUGenerateMipmap(texture: Texture) {
        let gpuDevice = webGPUContext.device;
        let textureDescriptor = texture.textureDescriptor;
        // let pipeline = TextureMipmapGenerator.pipeline;
        let pipeline = TextureMipmapGenerator.getMipmapPipeline(texture);

        let srcView = texture.getGPUTexture().createView({
            baseMipLevel: 0,
            mipLevelCount: 1,
        });

        // Loop through each mip level and renders the previous level's contents into it.
        const commandEncoder = GPUContext.beginCommandEncoder();
        for (let i = 1; i < textureDescriptor.mipLevelCount; ++i) {
            const dstView = texture.getGPUTexture().createView({
                baseMipLevel: i, // Make sure we're getting the right mip level...
                mipLevelCount: 1, // And only selecting one mip level
            });

            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: dstView, // Render pass uses the next mip level as it's render attachment.
                        clearValue: [0, 0, 0, 0],
                        loadOp: `clear`,
                        storeOp: 'store',
                    },
                ],
            });

            let textureLayout = gpuDevice.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        //TODO : After adding a shadow reflection, it is necessary to know that the vertex is used | the segment is used
                        visibility: texture.visibility,
                        // use GPUSamplerBindingLayout = { type:`filtering`} error
                        sampler: texture.samplerBindingLayout,
                    },
                    {
                        binding: 1,
                        //TODO : After adding a shadow reflection, it is necessary to know that the vertex is used | the segment is used
                        visibility: texture.visibility,
                        // use GPUTextureBindingLayout = { sampleType:`float`} error
                        texture: texture.textureBindingLayout,
                    },
                ],
            });

            // Need a separate bind group for each level to ensurev
            // we're only sampling from the previous level.
            const bindGroup = gpuDevice.createBindGroup({
                layout: textureLayout,
                entries: [
                    {
                        binding: 0,
                        resource: texture.gpuSampler,
                    },
                    {
                        binding: 1,
                        resource: srcView,
                    },
                ],
            });

            // Render
            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(4);
            passEncoder.end();

            // The source texture view for the next iteration of the loop is the
            // destination view for this one.
            srcView = dstView;
        }
        GPUContext.endCommandEncoder(commandEncoder);
    }

    public static getMipmapCount(width: number, height: number) {
        let w = width;
        let h = height;
        let maxSize = Math.max(w, h);
        return 1 + Math.log2(maxSize) | 0;
    }

    // TextureDescriptor should be the descriptor that the texture was created with.
    // This version only works for basic 2D textures.
    // public static webGPUGenerateMipmap(texture: Texture) {
    //     let gpuDevice = webGPUContext.device;
    //     let textureDescriptor = texture.textureDescriptor;

    //     if (!TextureMipmapGenerator.pipeline) {
    //         // Create a simple shader that renders a fullscreen textured quad.
    //         const mipmapShaderModule = gpuDevice.createShaderModule({
    //             code: `
    //     var<private> pos : array<vec2<f32>, 4> = array<vec2<f32>, 4>(
    //       vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0),
    //       vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0));

    //     struct VertexOutput {
    //       @builtin(position) position : vec4<f32>,
    //       @location(0) texCoord : vec2<f32>
    //     };

    //     @vertex
    //     fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
    //       var output : VertexOutput;
    //       output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
    //       output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    //       return output;
    //     }

    //     @binding(0) @group(0) var imgSampler : sampler;
    //     @binding(1) @group(0) var img : texture_2d<f32>;

    //     @fragment
    //     fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
    //       var outColor: vec4<f32> = textureSampleLevel(img, imgSampler, texCoord , 0.0 );
    //       return outColor;
    //     }
    //   `,
    //         });

    //         TextureMipmapGenerator.pipeline = gpuDevice.createRenderPipeline({
    //             layout: `auto`,
    //             vertex: {
    //                 module: mipmapShaderModule,
    //                 entryPoint: 'vertexMain',
    //             },
    //             fragment: {
    //                 module: mipmapShaderModule,
    //                 entryPoint: 'fragmentMain',
    //                 targets: [
    //                     {
    //                         format: textureDescriptor.format, // Make sure to use the same format as the texture
    //                     },
    //                 ],
    //             },
    //             primitive: {
    //                 topology: 'triangle-strip',
    //                 stripIndexFormat: 'uint32',
    //             },
    //         });
    //     }

    //     // We'll ALWAYS be rendering minified here, so that's the only filter mode we need to set.
    //     let sampler: GPUSampler;
    //     if (texture.format == `rgba16float`) {
    //         sampler = gpuDevice.createSampler({
    //             minFilter: `nearest`,
    //             magFilter: `linear`,
    //         });
    //     } else {
    //         sampler = gpuDevice.createSampler({
    //             minFilter: GPUFilterMode.linear,
    //             magFilter: GPUFilterMode.linear,
    //         });
    //     }

    //     let srcView = texture.getGPUTexture().createView({
    //         baseMipLevel: 0,
    //         mipLevelCount: 1,
    //     });

    //     // Loop through each mip level and renders the previous level's contents into it.
    //     const commandEncoder = GPUContext.beginCommandEncoder();
    //     for (let i = 1; i < textureDescriptor.mipLevelCount; ++i) {
    //         const dstView = texture.getGPUTexture().createView({
    //             baseMipLevel: i, // Make sure we're getting the right mip level...
    //             mipLevelCount: 1, // And only selecting one mip level
    //         });

    //         const passEncoder = commandEncoder.beginRenderPass({
    //             colorAttachments: [
    //                 {
    //                     view: dstView, // Render pass uses the next mip level as it's render attachment.
    //                     clearValue: [0, 0, 0, 0],
    //                     loadOp: `clear`,
    //                     storeOp: 'store',
    //                 },
    //             ],
    //         });

    //         // Need a separate bind group for each level to ensurev
    //         // we're only sampling from the previous level.
    //         const bindGroup = gpuDevice.createBindGroup({
    //             layout: TextureMipmapGenerator.pipeline.getBindGroupLayout(0),
    //             entries: [
    //                 {
    //                     binding: 0,
    //                     resource: sampler,
    //                 },
    //                 {
    //                     binding: 1,
    //                     resource: srcView,
    //                 },
    //             ],
    //         });

    //         // Render
    //         passEncoder.setPipeline(TextureMipmapGenerator.pipeline);
    //         passEncoder.setBindGroup(0, bindGroup);
    //         passEncoder.draw(4);
    //         passEncoder.end();

    //         // The source texture view for the next iteration of the loop is the
    //         // destination view for this one.
    //         srcView = dstView;
    //     }
    //     GPUContext.endCommandEncoder(commandEncoder);
    // }
}

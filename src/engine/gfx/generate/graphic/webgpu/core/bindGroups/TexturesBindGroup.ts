import { MaterialBase } from '../../../../../materials/MaterialBase';
import { VirtualTexture } from '../../../../../textures/VirtualTexture';
import { GPUTextureFormat } from '../../WebGPUConst';
import { webGPUContext } from '../../Context3D';
import { DepthCubeArrayTexture } from '../../../../../textures/DepthCubeArrayTexture';
import { Texture } from '../texture/Texture';
import { Depth2DTextureArray } from '../../../../../textures/Depth2DTextureArray';
/**
 * @internal
 * @group GFX
 */
export class TexturesBindGroup {
    public name: string;
    public index: number = 2;
    public gpuBindGroup: GPUBindGroup;

    constructor(index: number = 2) {
        this.index = index;
    }

    bindTextureToPipeline(pipeline: GPURenderPipeline | GPUComputePipeline, textures: Texture[]) {
        if (!this.gpuBindGroup) {
            let entries = [];
            for (let i = 0; i < textures.length; i++) {
                if (!textures[i]) continue;
                const texture = textures[i];

                if (texture instanceof DepthCubeArrayTexture) {
                    entries.push(
                        {
                            binding: i * 2 + 0,
                            resource: texture.gpuSampler,
                        },
                        {
                            binding: i * 2 + 1,
                            resource: texture.getGPUView(),
                        },
                    );
                } else if (texture instanceof Depth2DTextureArray) {
                    entries.push(
                        {
                            binding: i * 2 + 0,
                            resource: texture.gpuSampler_comparison,
                        },
                        {
                            binding: i * 2 + 1,
                            resource: texture.getGPUView(),
                        },
                    );
                } else if (texture instanceof VirtualTexture) {
                    let depth = texture.format.indexOf("depth") != -1;
                    entries.push(
                        {
                            binding: i * 2 + 0,
                            resource: depth ? texture.gpuSampler_comparison : texture.gpuSampler,
                        },
                        {
                            binding: i * 2 + 1,
                            resource: texture.getGPUView(),
                        },
                    );
                }
            }

            let layout = pipeline.getBindGroupLayout(this.index);
            this.gpuBindGroup = webGPUContext.device.createBindGroup({
                layout: layout,
                entries: entries,
            });
        }
    }

    bindTextureToPipeline2(pipeline: GPURenderPipeline | GPUComputePipeline, textures: Texture[]) {
        if (!this.gpuBindGroup) {
            let entries = [];
            for (let i = 0; i < textures.length; i++) {
                if (!textures[i]) continue;
                const texture = textures[i];

                entries.push(
                    {
                        binding: i,
                        resource: texture.getGPUView(),
                    },
                );
            }

            let layout = pipeline.getBindGroupLayout(this.index);
            this.gpuBindGroup = webGPUContext.device.createBindGroup({
                layout: layout,
                entries: entries,
            });
        }
    }

    public static pool: Map<MaterialBase, TexturesBindGroup> = new Map<MaterialBase, TexturesBindGroup>();
}

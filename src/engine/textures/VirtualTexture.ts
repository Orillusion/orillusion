import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { GPUAddressMode, GPUTextureFormat } from '../gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { GPUContext } from '../gfx/renderJob/GPUContext';
import { UUID } from '../util/Global';
/**
 * @internal
 * Render target texture 
 * Render what we want to render onto a texture instead of rendering it onto the screen as we usually do
 * @group Texture
 */
export class VirtualTexture extends Texture {
    public resolveTarget: GPUTextureView;
    // storeOp: string = 'store';
    // loadOp: GPULoadOp = `load`;
    // clearValue: GPUColor = [0, 0, 0, 0];

    /**
     * create virtual texture
     * @param width width of texture
     * @param height height of texture
     * @param format GPUTextureFormat, default value is rgba8unorm
     * @param useMipmap whether or not gen mipmap
     * @returns
     */
    constructor(width: number, height: number, format: GPUTextureFormat = GPUTextureFormat.rgba8unorm, useMipMap: boolean = false, usage?: number, textureCount: number = 1, sampleCount: number = 0, clear: boolean = true) {
        super(width, height, textureCount);
        let device = webGPUContext.device;
        this.name = UUID();

        if (usage != undefined) {
            this.usage = usage;
        } else {
            this.usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST;
        }

        this.createTextureDescriptor(width, height, 1, format, this.usage, textureCount, sampleCount);

        // this.loadOp = clear ? `clear` : `load`
        // this.loadOp = `clear`

        this.useMipmap = false;

        this.visibility = GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;

        if (format == GPUTextureFormat.rgba32float) {
            this.samplerBindingLayout.type = `non-filtering`;
            this.textureBindingLayout.sampleType = `unfilterable-float`;
            this.gpuSampler = device.createSampler({});
        } else if (format == GPUTextureFormat.depth32float) {
            this.samplerBindingLayout.type = `filtering`;
            this.sampler_comparisonBindingLayout.type = `comparison`;
            this.textureBindingLayout.sampleType = `depth`;
            this.gpuSampler = webGPUContext.device.createSampler({});
            this.gpuSampler_comparison = webGPUContext.device.createSampler({
                compare: 'less',
                label: "sampler_comparison"
            });
        } else if (format == GPUTextureFormat.depth24plus) {
            this.samplerBindingLayout = {
                type: `filtering`,
            }
            this.sampler_comparisonBindingLayout = {
                type: 'comparison',
            }
            this.textureBindingLayout.sampleType = `depth`;
            this.gpuSampler = webGPUContext.device.createSampler({});
            this.gpuSampler_comparison = webGPUContext.device.createSampler({
                compare: 'less',
                label: "sampler_comparison"
            });
        } else {
            this.samplerBindingLayout.type = `filtering`;
            this.textureBindingLayout.sampleType = `float`;
            if (sampleCount > 0) {
                this.textureBindingLayout.multisampled = true;
            }
            this.minFilter = 'linear';
            this.magFilter = 'linear';
            this.mipmapFilter = `linear`;
            this.maxAnisotropy = 16;

            this.addressModeU = GPUAddressMode.clamp_to_edge;
            this.addressModeV = GPUAddressMode.clamp_to_edge;
            // this.visibility = GPUShaderStage.FRAGMENT;
            this.gpuSampler = device.createSampler(this);
        }
    }

    /**
    * create rt texture
    * @param width texture width
    * @param height texture height
    * @param data  texture pixel data
    * @param useMipmap texture use mipmap switch
    * @returns
    */
    public create(width: number, height: number, useMiamp: boolean = true) {
        let device = webGPUContext.device;
        const bytesPerRow = width * 4;
        let td = new Float32Array(width * height * 4);

        const textureDataBuffer = device.createBuffer({
            size: td.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        device.queue.writeBuffer(textureDataBuffer, 0, td);
        const commandEncoder = GPUContext.beginCommandEncoder();
        commandEncoder.copyBufferToTexture(
            {
                buffer: textureDataBuffer,
                bytesPerRow: bytesPerRow,
            },
            {
                texture: this.getGPUTexture(),
            },
            {
                width: width,
                height: height,
                depthOrArrayLayers: 1,
            },
        );

        GPUContext.endCommandEncoder(commandEncoder);
    }

    public readTextureToImage() {
        let device = webGPUContext.device;
        let w = webGPUContext.windowWidth;
        let h = webGPUContext.windowHeight;
        const bytesPerRow = w * 4;
        let td = new Float32Array(w * h * 4);

        const textureBuffer = device.createBuffer({
            size: td.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });
        const commandEncoder = GPUContext.beginCommandEncoder();
        commandEncoder.copyTextureToBuffer(
            {
                texture: this.getGPUTexture()
            },
            {
                buffer: textureBuffer
            },
            [w, h]
        );

        let arryBuffer = textureBuffer.getMappedRange(0, td.byteLength);
    }

}

import { BlendFactor, BlendMode } from "../../../../materials/BlendMode";
import { GlobalBindGroupLayout } from "../../../graphics/webGpu/core/bindGroups/GlobalBindGroupLayout";
import { GPUCullMode, GPUCompareFunction } from "../../../graphics/webGpu/WebGPUConst";
import { webGPUContext } from "../../../graphics/webGpu/Context3D";
import { Graphics3DShape } from "./Graphics3DShape";
import { Preprocessor } from "../../../graphics/webGpu/shader/util/Preprocessor";
import { GPUContext } from "../../GPUContext";
import { RendererPassState } from "../state/RendererPassState";
import { Graphic3DShader_vs } from "../../../../assets/shader/graphic/Graphic3DShader_vs";
import { Graphic3DShader_fs } from "../../../../assets/shader/graphic/Graphic3DShader_fs";

/**
 * @internal
 */
export class Graphic3DFixedRenderPipeline {

    protected mCount: number;
    protected mBatchSize: number;
    protected mBatchCount: number;
    protected mMinIndexCount: number;
    protected mOffset: number;
    protected mIndexBuffer: GPUBuffer;
    protected mDataBuffer: Float32Array;
    protected mBatchBuffers: GPUBuffer[];
    protected mVertexShader: GPUShaderModule;
    protected mFragmentShader: GPUShaderModule;
    protected mRenderPipeline: GPURenderPipeline;
    protected mRenderPipelineLayout: GPUPipelineLayout;
    protected mVertexBufferLayout: GPUVertexBufferLayout;
    protected mGPUPrimitiveTopology: GPUPrimitiveTopology;

    constructor(minIndexCount: number, topology: GPUPrimitiveTopology) {
        this.mMinIndexCount = minIndexCount;
        this.mGPUPrimitiveTopology = topology;
        this.mBatchSize = Math.trunc(65536 / this.mMinIndexCount);
        this.init();
    }

    public reset() {
        this.mCount = 0;
        this.mOffset = 0;
        this.mBatchCount = 0;
    }

    public addShapeData(shape: Graphics3DShape) {
        let data = shape.shapeData;
        while (data.length > 0) {
            if (this.mOffset >= this.mDataBuffer.length) {
                this.flush();
            }

            if (this.mOffset + data.length <= this.mDataBuffer.length) {
                this.mDataBuffer.set(data, this.mOffset);
                this.mOffset += data.length;
                break;
            }

            let remainLength = this.mDataBuffer.length - this.mOffset;
            this.mDataBuffer.set(data.slice(0, remainLength), this.mOffset);
            this.mOffset += remainLength;
            data = data.slice(remainLength);
        }
    }

    protected flush() {
        if (this.mOffset > 0) {
            let vertexBuffer: GPUBuffer;
            if (this.mBatchCount < this.mBatchBuffers.length) {
                vertexBuffer = this.mBatchBuffers[this.mBatchCount];
            } else {
                vertexBuffer = webGPUContext.device.createBuffer({
                    size: this.mDataBuffer.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                })
                this.mBatchBuffers.push(vertexBuffer);
            }
            // console.log(`writeBuffer(${this.mBatchCount}, ${this.mOffset})`);
            webGPUContext.device.queue.writeBuffer(vertexBuffer, 0, this.mDataBuffer, 0, this.mOffset);
            this.mCount += this.mOffset / 8;
            this.mBatchCount++;
            this.mOffset = 0;
        }
    }

    public render(rendererPassState: RendererPassState, encoder: GPURenderPassEncoder) {
        const device = webGPUContext.device;

        if (!this.mRenderPipeline) {
            let targets = rendererPassState.outAttachments;
            if (rendererPassState.outColor != -1) {
                let target = targets[rendererPassState.outColor];
                target.blend = BlendFactor.getBlend(BlendMode.NONE);
            }

            this.mRenderPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [GlobalBindGroupLayout.getGlobalDataBindGroupLayout()],
            });

            let descriptor: GPURenderPipelineDescriptor = {
                label: 'Graphic3DFixedRenderPipeline',
                layout: this.mRenderPipelineLayout,
                vertex: {
                    module: this.mVertexShader,
                    entryPoint: 'main',
                    buffers: [this.mVertexBufferLayout],
                },
                fragment: {
                    module: this.mFragmentShader,
                    entryPoint: 'main',
                    targets: targets,
                },
                primitive: {
                    topology: this.mGPUPrimitiveTopology,
                    cullMode: GPUCullMode.back,
                    frontFace: 'ccw',
                },
            };

            if (rendererPassState.depthTexture) {
                descriptor.depthStencil = {
                    depthWriteEnabled: true,
                    depthCompare: GPUCompareFunction.less_equal,
                    format: rendererPassState.depthTexture.format,
                };
            }

            this.mRenderPipeline = GPUContext.createPipeline(descriptor);
        }

        this.flush();
        if (this.mBatchCount > 0) {
            // console.log(`[${this.mCount} / ${this.mBatchBuffers.length}]`);
            encoder.setPipeline(this.mRenderPipeline);
            encoder.setIndexBuffer(this.mIndexBuffer, `uint16`);

            let count = this.mCount / this.mMinIndexCount;
            for (let i = Math.trunc(count / this.mBatchSize) - 1; i >= 0; i--) {
                encoder.setVertexBuffer(0, this.mBatchBuffers[i]);
                encoder.drawIndexed(this.mMinIndexCount * this.mBatchSize, 1, 0, 0, 0);
            }

            count = count % this.mBatchSize;
            if (count != 0) {
                encoder.setVertexBuffer(0, this.mBatchBuffers[this.mBatchCount - 1]);
                encoder.drawIndexed(this.mMinIndexCount * count, 1, 0, 0, 0);
            }
        }
    }

    protected init() {
        const device = webGPUContext.device;

        let indexData = new Uint16Array((Math.trunc(this.mMinIndexCount * this.mBatchSize / 4) + 1) * 4);
        for (let i = 0; i < indexData.length; i++) {
            indexData[i] = i;
        }
        this.mIndexBuffer = device.createBuffer({
            size: indexData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.mIndexBuffer, 0, indexData);

        this.mVertexBufferLayout = {
            arrayStride: (4 + 4) * 4,
            stepMode: 'vertex',
            attributes: [
                { shaderLocation: 0, offset: 0, format: 'float32x4' },
                { shaderLocation: 1, offset: 16, format: 'float32x4' },
            ],
        };

        this.mBatchBuffers = [];
        this.mDataBuffer = new Float32Array((4 + 4) * indexData.length);
        this.mBatchBuffers.push(device.createBuffer({
            size: this.mDataBuffer.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        }));

        this.mVertexShader = this.createShaderModule(
            'Graphic3DFixedRenderPipeline.vs',
            Preprocessor.parse(Graphic3DShader_vs, {})
        );
        this.mFragmentShader = this.createShaderModule(
            'Graphic3DFixedRenderPipeline.fs',
            Preprocessor.parse(Graphic3DShader_fs, {})
        );

        this.reset();
    }

    protected createShaderModule(label: string, code: string): GPUShaderModule {
        let shaderModule = webGPUContext.device.createShaderModule({
            label: label,
            code: code,
        });
        shaderModule.getCompilationInfo().then((e) => {
            if (e.messages.length > 0) {
                console.log(code);
                console.log(e);
            }
        });
        return shaderModule;
    }
}

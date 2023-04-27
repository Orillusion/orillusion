import { Camera3D } from "../../core/Camera3D";
import { View3D } from "../../core/View3D";
import { ViewQuad } from "../../core/ViewQuad";
import { GeometryBase } from "../../core/geometry/GeometryBase";
import { ProfilerUtil } from "../../util/ProfilerUtil";
import { webGPUContext } from "../graphics/webGpu/Context3D";
import { GlobalBindGroup } from "../graphics/webGpu/core/bindGroups/GlobalBindGroup";
import { Texture } from "../graphics/webGpu/core/texture/Texture";
import { ComputeShader } from "../graphics/webGpu/shader/ComputeShader";
import { RenderShader } from "../graphics/webGpu/shader/RenderShader";
import { RendererPassState } from "./passRenderer/state/RendererPassState";
import { RendererType } from "./passRenderer/state/RendererType";


/**
 * WebGPU api use context
 */
export class GPUContext {
    public static lastGeometry: GeometryBase;
    public static lastPipeline: GPURenderPipeline;
    public static lastShader: RenderShader;
    public static drawCount: number = 0;
    public static renderPassCount: number = 0;
    public static geometryCount: number = 0;
    public static pipelineCount: number = 0;
    public static matrixCount: number = 0;
    public static lastRenderPassState: RendererPassState;
    public static LastCommand: GPUCommandEncoder;

    /**
     * renderPipeline before render need bind pipeline
     * @param encoder current GPURenderPassEncoder {@link GPURenderPassEncoder } {@link GPURenderBundleEncoder }
     * @param renderShader render pass shader {@link RenderShader }
     * @returns 
     */
    public static bindPipeline(encoder: GPURenderPassEncoder | GPURenderBundleEncoder, renderShader: RenderShader) {
        if (GPUContext.lastShader != renderShader) {
            GPUContext.lastShader = renderShader;
        } else {
            return;
        }

        if (GPUContext.lastPipeline != renderShader.pipeline) {
            GPUContext.lastPipeline = renderShader.pipeline;
            encoder.setPipeline(renderShader.pipeline);
        }

        for (let i = 1; i < renderShader.bindGroups.length; i++) {
            const bindGroup = renderShader.bindGroups[i];
            if (bindGroup) {
                encoder.setBindGroup(i, bindGroup);
            }
        }
    }

    /**
     * render before need make sure use camera 
     * @param encoder current GPURenderPassEncoder {@link GPURenderPassEncoder } {@link GPURenderBundleEncoder }
     * @param camera use camera {@link Camera3D}
     */
    public static bindCamera(encoder: GPURenderPassEncoder | GPURenderBundleEncoder, camera: Camera3D) {
        let cameraBindGroup = GlobalBindGroup.getCameraGroup(camera);
        encoder.setBindGroup(0, cameraBindGroup.globalBindGroup);
    }

    /**
     * bind geometry vertex buffer to current render pipeline 
     * @param encoder current GPURenderPassEncoder {@link GPURenderPassEncoder } {@link GPURenderBundleEncoder }
     * @param geometry engine geometry 
     * @param offset geometry buffer bytes offset 
     * @param size geometry buffer bytes length
     */
    public static bindGeometryBuffer(encoder: GPURenderPassEncoder | GPURenderBundleEncoder, geometry: GeometryBase) {
        if (this.lastGeometry != geometry) {
            this.lastGeometry = geometry;

            if (geometry.indicesBuffer)
                encoder.setIndexBuffer(geometry.indicesBuffer.indicesGPUBuffer.buffer, geometry.indicesBuffer.indicesFormat);

            let vertexBuffer = geometry.vertexBuffer.vertexGPUBuffer;
            let vertexBufferLayouts = geometry.vertexBuffer.vertexBufferLayouts;
            for (let i = 0; i < vertexBufferLayouts.length; i++) {
                const vbLayout = vertexBufferLayouts[i];
                encoder.setVertexBuffer(i, vertexBuffer.buffer, vbLayout.offset, vbLayout.size);
            }
        }
    }

    /**
     * begin or end clean all use cache
     */
    public static cleanCache() {
        this.lastGeometry = null;
        this.lastPipeline = null;
        this.lastShader = null;
    }

    /**
     * create a render pipeline
     * @param gpuRenderPipeline {@link GPURenderPipelineDescriptor}
     * @returns 
     */
    public static createPipeline(gpuRenderPipeline: GPURenderPipelineDescriptor) {
        ProfilerUtil.countStart("GPUContext", "pipeline");
        return webGPUContext.device.createRenderPipeline(gpuRenderPipeline);
    }

    /**
     * auto get webgpu commandEncoder and start a command encoder 
     * @returns commandEncoder {@link GPUCommandEncoder}
     */
    public static beginCommandEncoder(): GPUCommandEncoder {
        ProfilerUtil.countStart("GPUContext", "beginCommandEncoder");
        if (this.LastCommand) {
            webGPUContext.device.queue.submit([this.LastCommand.finish()]);
        }
        this.LastCommand = webGPUContext.device.createCommandEncoder();
        return this.LastCommand;
    }

    /**
     * end CommandEncoder record and submit
     * @param command {@link GPUCommandEncoder}
     */
    public static endCommandEncoder(command: GPUCommandEncoder) {
        if (this.LastCommand == command) {
            webGPUContext.device.queue.submit([this.LastCommand.finish()]);
            this.LastCommand = null;
            ProfilerUtil.countStart("GPUContext", "endCommandEncoder");
        }
    }

    /**
     * create a renderBundle gpu object by GPURenderBundleEncoderDescriptor 
     * @param des {@link GPURenderBundleEncoderDescriptor}
     * @returns renderBundleEncoder {@link GPURenderBundleEncoder}
     */
    public static recordBundleEncoder(des: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder {
        let bundleEncoder: GPURenderBundleEncoder = webGPUContext.device.createRenderBundleEncoder(des);
        return bundleEncoder;
    }

    /**
     * render pass start return current use gpu renderPassEncoder
     * @param command {@link GPUCommandEncoder}
     * @param renderPassState {@link RendererPassState}
     * @returns encoder {@link GPURenderPassEncoder}
     */
    public static beginRenderPass(command: GPUCommandEncoder, renderPassState: RendererPassState): GPURenderPassEncoder {
        this.cleanCache();
        this.renderPassCount++;
        this.lastRenderPassState = renderPassState;
        if (renderPassState.renderTargets && renderPassState.renderTargets.length > 0) {
            for (let i = 0; i < renderPassState.renderTargets.length; ++i) {
                const renderTarget = renderPassState.renderTargets[i];
                let att = renderPassState.renderPassDescriptor.colorAttachments[i];

                if (renderPassState.multisample > 0 && renderPassState.renderTargets.length == 1) {
                    att.view = renderPassState.multiTexture.createView();
                    att.resolveTarget = renderTarget.getGPUView();
                } else {
                    att.view = renderTarget.getGPUTexture().createView();
                }
            }
            return command.beginRenderPass(renderPassState.renderPassDescriptor);
        } else {
            let att0 = renderPassState.renderPassDescriptor.colorAttachments[0];
            if (att0) {
                if (renderPassState.multisample > 0) {
                    att0.view = renderPassState.multiTexture.createView();
                    att0.resolveTarget = webGPUContext.context.getCurrentTexture().createView();
                } else {
                    att0.view = webGPUContext.context.getCurrentTexture().createView();
                }
            }
            return command.beginRenderPass(renderPassState.renderPassDescriptor);
        }
    }

    /**
     * Start the rendering process to draw any pipes
     * @param encoder 
     * @param indexCount 
     * @param instanceCount 
     * @param firstIndex 
     * @param baseVertex 
     * @param firstInstance 
     */
    public static drawIndexed(encoder: GPURenderPassEncoder, indexCount: GPUSize32,
        instanceCount?: GPUSize32,
        firstIndex?: GPUSize32,
        baseVertex?: GPUSignedOffset32,
        firstInstance?: GPUSize32) {
        encoder.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance);
        this.drawCount++;
    }

    public static draw(encoder: GPURenderPassEncoder, vertexCount: GPUSize32,
        instanceCount?: GPUSize32,
        firstVertex?: GPUSize32,
        firstInstance?: GPUSize32) {
        encoder.draw(vertexCount, instanceCount, firstVertex, firstInstance);
        this.drawCount++;
    }

    /**
     * The GPU must be informed of the end of encoder recording
     * @param encoder 
     */
    public static endPass(encoder: GPURenderPassEncoder) {
        encoder.insertDebugMarker("end")
        encoder.end();
    }


    /**
     * By inputting a map to viewQuad and setting corresponding 
     * processing shaders, the corresponding results are output for off-screen rendering
     * Can also be directly used as the final display rendering result rendering canvas
     * @param viewQuad 
     * @see ViewQuad
     * @param scene3D 
     * @see Scene3D
     * @param command 
     */
    public static renderTarget(view: View3D, viewQuad: ViewQuad, command: GPUCommandEncoder) {
        let camera = view.camera;
        let encoder = GPUContext.beginRenderPass(command, viewQuad.rendererPassState);
        GPUContext.bindCamera(encoder, camera);
        viewQuad.quadRenderer.nodeUpdate(view, RendererType.COLOR, viewQuad.rendererPassState, null);
        viewQuad.quadRenderer.renderPass2(view, RendererType.COLOR, viewQuad.rendererPassState, null, encoder);
        GPUContext.endPass(encoder);
    }

    /**
     * Output to screen through screen based shading
     * @param viewQuad 
     * @see ViewQuad
     * @param scene3D 
     * @see Scene3D
     * @param command 
     * @param colorTexture 
     */
    public static renderToViewQuad(view: View3D, viewQuad: ViewQuad, command: GPUCommandEncoder, colorTexture: Texture) {
        let camera = view.camera;
        viewQuad.colorTexture = colorTexture;
        let encoder = GPUContext.beginRenderPass(command, viewQuad.rendererPassState);
        GPUContext.bindCamera(encoder, camera);

        // viewQuad.x = view.viewPort.x;
        // viewQuad.y = view.viewPort.y;
        // viewQuad.scaleX = view.viewPort.width;
        // viewQuad.scaleY = view.viewPort.height;
        // viewQuad.transform.updateWorldMatrix(true);
        // encoder.setViewport(
        //     view.viewPort.x * webGPUContext.presentationSize[0],
        //     view.viewPort.y * webGPUContext.presentationSize[1],
        //     view.viewPort.width * webGPUContext.presentationSize[0],
        //     view.viewPort.height * webGPUContext.presentationSize[1],
        //     0.0, 1.0);
        // encoder.setScissorRect(
        //     view.viewPort.x * webGPUContext.presentationSize[0],
        //     view.viewPort.y * webGPUContext.presentationSize[0],
        //     view.viewPort.width * webGPUContext.presentationSize[0],
        //     view.viewPort.height * webGPUContext.presentationSize[1],
        // );

        // encoder.setScissorRect(view.viewPort.x, view.viewPort.y, 300, 150);
        // encoder.setViewport(view.viewPort.x, view.viewPort.y, view.viewPort.width / (view.viewPort.width / view.viewPort.height), view.viewPort.height, 0.0, 1.0);
        // encoder.setScissorRect(view.viewPort.x, view.viewPort.y, view.viewPort.width, view.viewPort.height);

        // encoder.setViewport(camera.viewPort.x, camera.viewPort.y, camera.viewPort.width, camera.viewPort.height, 0.0, 1.0);
        // encoder.setScissorRect(camera.viewPort.x, camera.viewPort.y, camera.viewPort.width, camera.viewPort.height);

        viewQuad.quadRenderer.nodeUpdate(view, RendererType.COLOR, viewQuad.rendererPassState, null);
        viewQuad.quadRenderer.renderPass2(view, RendererType.COLOR, viewQuad.rendererPassState, null, encoder);
        GPUContext.endPass(encoder);
    }

    /**
     * Perform the final calculation and submit the Shader to the GPU
     * @param command 
     * @param computes 
     */
    public static computeCommand(command: GPUCommandEncoder, computes: ComputeShader[]) {
        let computePass = command.beginComputePass();
        for (let i = 0; i < computes.length; i++) {
            const compute = computes[i];
            compute.compute(computePass);
        }
        computePass.end();
    }
}

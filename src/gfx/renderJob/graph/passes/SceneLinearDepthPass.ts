import { Camera3D } from '../../../../core/Camera3D';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { Context3D } from '../../../graphics/webGpu/Context3D';
import { Preprocessor } from '../../../graphics/webGpu/shader/util/Preprocessor';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';
import { TextureHandle } from '../transient/ResourceHandle';
import { MAIN_DEPTH_TEXTURE } from './PreDepthPass';

/**
 * Handle of the opaque scene's linear view depth (r32float, view-space z;
 * the far plane where nothing was drawn). Also published by name for
 * materials, like the scene color pyramid.
 * @group Graph
 */
export const SCENE_LINEAR_DEPTH = '_SceneLinearDepth';

const UNIFORM_BYTES = 80;

/**
 * Converts the opaque scene depth into linear view depth that materials
 * drawn afterwards (water, by the transmission pass) can sample: the depth
 * texture itself is still the depth attachment while they draw.
 *
 * {@link ForwardRendererJob} adds it right after the scene color pyramid
 * when `setting.render.water` is true.
 *
 * @group Graph
 */
export class SceneLinearDepthPass extends RenderGraphPass {
    public readonly name: string = 'SceneLinearDepthPass';

    private _device!: GPUDevice;
    private _handle!: TextureHandle;
    private _pipeline!: GPURenderPipeline;
    private _layout!: GPUBindGroupLayout;
    private _uniform!: GPUBuffer;
    private _uniformData = new Float32Array(UNIFORM_BYTES / 4);
    private _depthSrc: GPUTexture | null = null;
    private _depthView: GPUTextureView | null = null;

    public setup(b: RenderGraphBuilder): void {
        this._device = b.context3D.device as GPUDevice;
        const setting = b.context3D.engine?.setting?.render;
        if (setting?.zPrePass) b.read(MAIN_DEPTH_TEXTURE);
        // Opaque depth is final once the pyramid has captured the opaque scene.
        b.dependsOn('SceneColorPyramidPass');
        this._handle = b.declareTexture(SCENE_LINEAR_DEPTH, {
            format: GPUTextureFormat.r32float,
            width: 'screen', height: 'screen',
            aliasable: false,
            publishToLegacyMap: true,
            // COPY bits: the graph's 'attachment' access hint requires them.
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
                 | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
            label: SCENE_LINEAR_DEPTH,
        });
        b.write(this._handle, 'attachment');
        this._createPipeline(!!setting?.useLogDepth);
    }

    public destroy(): void {
        this._uniform?.destroy();
        this._depthSrc = null;
        this._depthView = null;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const view = ctx.view;
        const engine = view.engine3D;
        const target = ctx.getTexture(this._handle) as RenderTexture;
        const depthView = this._getSceneDepthView(engine.context3D);
        if (!target || !depthView) return;
        // r32float is not filterable; materials read it with textureLoad.
        target.textureBindingLayout.sampleType = 'unfilterable-float';
        this._writeUniforms(view.camera);

        const bg = this._device.createBindGroup({
            layout: this._layout,
            entries: [
                { binding: 0, resource: { buffer: this._uniform } },
                { binding: 1, resource: depthView },
            ],
        });
        const gpu = engine.context3D.gpuContext;
        const command = gpu.beginCommandEncoder();
        const enc = command.beginRenderPass({
            label: 'SceneLinearDepth',
            colorAttachments: [{ view: target.getGPUView() as GPUTextureView, loadOp: 'clear', clearValue: [0, 0, 0, 0], storeOp: 'store' }],
        });
        enc.setPipeline(this._pipeline);
        enc.setBindGroup(0, bg);
        enc.draw(3);
        enc.end();
        gpu.endCommandEncoder(command);
    }

    /** Depth the opaque passes wrote: the z-prepass texture when enabled, else the G-buffer depth. */
    private _getSceneDepthView(context3D: Context3D): GPUTextureView | null {
        const frame = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer, context3D);
        const tex = (frame.zPreTexture ?? frame.depthTexture) as RenderTexture;
        const gpuTex = tex?.getGPUTexture() as GPUTexture;
        if (!gpuTex) return null;
        if (gpuTex !== this._depthSrc) {
            this._depthSrc = gpuTex;
            // depth-only aspect so depth24plus-stencil8 (useStencil) also binds as texture_depth_2d.
            this._depthView = gpuTex.createView({ aspect: 'depth-only' });
        }
        return this._depthView;
    }

    private _writeUniforms(camera: Camera3D): void {
        const f = this._uniformData;
        f.set(camera.projectionMatrixInv.rawData, 0);
        f[16] = camera.near;
        f[17] = camera.far;
        f[18] = 0;
        f[19] = 0;
        this._device.queue.writeBuffer(this._uniform, 0, f.buffer, f.byteOffset, UNIFORM_BYTES);
    }

    private _createPipeline(useLogDepth: boolean): void {
        const device = this._device;
        this._uniform = device.createBuffer({
            label: 'SceneLinearDepth:Uniforms',
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._layout = device.createBindGroupLayout({
            label: 'SceneLinearDepth:BGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
            ],
        });
        const module = device.createShaderModule({
            label: 'SceneLinearDepth',
            code: Preprocessor.parse(SCENE_LINEAR_DEPTH_WGSL, { USE_LOGDEPTH: useLogDepth }),
        });
        this._pipeline = device.createRenderPipeline({
            label: 'SceneLinearDepth',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._layout] }),
            vertex: { module, entryPoint: 'vs' },
            fragment: { module, entryPoint: 'fs', targets: [{ format: 'r32float' }] },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
        });
    }
}

const SCENE_LINEAR_DEPTH_WGSL = /* wgsl */`
struct Params {
    projInv: mat4x4f,
    // x = near, y = far
    camera: vec4f,
};

@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var sceneDepth: texture_depth_2d;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var v = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(v[vi], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) f32 {
    let d = textureLoad(sceneDepth, vec2i(pos.xy), 0);
    #if USE_LOGDEPTH
        return pow(p.camera.y + 1.0, d) - 1.0;
    #else
        let v = p.projInv * vec4f(0.0, 0.0, d, 1.0);
        return v.z / v.w;
    #endif
}
`;

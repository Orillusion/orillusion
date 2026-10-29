import { WaterWaves_wgsl } from '../../../../assets/shader/materials/WaterShader';
import { WaterFootprintBindings, waterFootprintWGSL } from '../../../../components/renderer/WaterFootprint';
import { WaterRenderer } from '../../../../components/renderer/WaterRenderer';
import { WATER_MAX_WAVES } from '../../../../materials/WaterMaterial';
import { WATER_FFT_PATCHES } from '../../../../components/renderer/WaterFFT';
import { Camera3D } from '../../../../core/Camera3D';
import { Matrix4 } from '../../../../math/Matrix4';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { Context3D } from '../../../graphics/webGpu/Context3D';
import { Preprocessor } from '../../../graphics/webGpu/shader/util/Preprocessor';
import { ComponentCollect } from '../../collect/ComponentCollect';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';
import { COLOR_BUFFER } from './ColorPass';
import { MAIN_COLOR_RT } from './GBufferResourcePass';
import { MAIN_DEPTH_TEXTURE } from './PreDepthPass';

/** Must match COLOR_BUFFER's format. */
const COLOR_FORMAT: GPUTextureFormat = 'rgba16float';
/** Water surfaces handled per frame. */
const MAX_WATERS = 4;
/** See UNDERWATER_WGSL for the layout. */
const HEADER_FLOATS = 40;
const WAVE_FLOATS = WATER_MAX_WAVES * 4;
const WATER_FLOATS = 16 + WAVE_FLOATS + 20;
/** First binding of the footprint masks. */
const FOOTPRINT_BINDING = 3;
/** Sampler and displacement cascades of the water with FFT waves, after the masks. */
const FFT_BINDING = FOOTPRINT_BINDING + 5;
const UNIFORM_BYTES = (HEADER_FLOATS + MAX_WATERS * WATER_FLOATS) * 4;

/**
 * Underwater view of {@link WaterRenderer}s: every pixel whose near-plane
 * point lies below a wave surface is attenuated along the view ray
 * (Beer-Lambert absorption, plus the water's own color scattered in). The
 * test is per pixel, so a camera half in the water gets a waterline across
 * the screen, drawn as a thin dark band. The water surface writes depth,
 * so looking up the attenuated distance ends at the surface.
 *
 * Up to four surfaces near the camera are handled; where their footprints
 * overlap, the one the point is deepest under wins.
 *
 * {@link ForwardRendererJob} adds it after the transparent passes and
 * before post-processing when `setting.render.water` is true. It does
 * nothing while the camera is clear of every water surface.
 *
 * @group Graph
 */
export class UnderwaterPass extends RenderGraphPass {
    public readonly name: string = 'UnderwaterPass';

    private _device!: GPUDevice;
    private _pipeline!: GPURenderPipeline;
    private _layout!: GPUBindGroupLayout;
    private _uniform!: GPUBuffer;
    private _uniformData = new Float32Array(UNIFORM_BYTES / 4);
    private _waters: WaterRenderer[] = [];
    private _near: WaterRenderer[] = [];
    private _footprints = new WaterFootprintBindings();
    private _noFFT: GPUTexture | null = null;
    private _fftSampler: GPUSampler | null = null;
    private _copy: GPUTexture | null = null;
    private _depthSrc: GPUTexture | null = null;
    private _depthView: GPUTextureView | null = null;
    /** Allocated in setup: matrices come from a pool created at engine init. */
    private _invViewProj!: Matrix4;

    public setup(b: RenderGraphBuilder): void {
        this._device = b.context3D.device as GPUDevice;
        const setting = b.context3D.engine?.setting?.render;
        if (setting?.zPrePass) b.read(MAIN_DEPTH_TEXTURE);
        b.write(COLOR_BUFFER);
        b.useRenderTarget(MAIN_COLOR_RT);
        this._invViewProj = new Matrix4();
        this._createPipeline(!!setting?.useLogDepth);
    }

    public destroy(): void {
        this._uniform?.destroy();
        this._copy?.destroy();
        this._copy = null;
        this._footprints.destroy();
        this._noFFT?.destroy();
        this._noFFT = null;
        this._waters.length = 0;
        this._near.length = 0;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const view = ctx.view;
        const camera = view.camera;
        const mask = (this.layerMask & (camera?.cullingMask ?? 0xFFFFFFFF)) >>> 0;
        ComponentCollect.collectByTypeLayered<WaterRenderer>(view, WaterRenderer, mask, this._waters);
        const near = this._near;
        near.length = 0;
        for (const w of this._waters) {
            if (near.length < MAX_WATERS && w.transform?.enable && this._cameraNear(w, camera)) near.push(w);
        }
        if (near.length === 0) return;

        const engine = view.engine3D;
        const colorTex = ctx.get<RenderTexture>(COLOR_BUFFER);
        const depthView = this._getSceneDepthView(engine.context3D);
        if (!colorTex || !depthView) return;
        const color = colorTex.getGPUTexture() as GPUTexture;
        const copy = this._ensureCopy(color.width, color.height);
        this._writeUniforms(near, camera);

        const bg = this._device.createBindGroup({
            layout: this._layout,
            entries: [
                { binding: 0, resource: { buffer: this._uniform } },
                { binding: 1, resource: copy.createView() },
                { binding: 2, resource: depthView },
                ...this._footprints.entries(this._device, near.map((w) => w.footprint), FOOTPRINT_BINDING),
                ...this._fftEntries(near),
            ],
        });
        const gpu = engine.context3D.gpuContext;
        const command = gpu.beginCommandEncoder();
        command.copyTextureToTexture({ texture: color }, { texture: copy }, [color.width, color.height, 1]);
        const enc = command.beginRenderPass({
            label: 'Underwater',
            colorAttachments: [{ view: color.createView(), loadOp: 'load', storeOp: 'store' }],
        });
        enc.setPipeline(this._pipeline);
        enc.setBindGroup(0, bg);
        enc.draw(3);
        enc.end();
        gpu.endCommandEncoder(command);
    }

    /** The cascades of the first water with FFT waves, or placeholders. */
    private _fftEntries(waters: WaterRenderer[]): GPUBindGroupEntry[] {
        if (!this._noFFT) {
            this._noFFT = this._device.createTexture({
                label: 'Underwater:NoFFT', size: [1, 1, 1], format: 'rgba16float', usage: GPUTextureUsage.TEXTURE_BINDING,
            });
            this._fftSampler = this._device.createSampler({
                magFilter: 'linear', minFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat',
            });
        }
        const fft = waters.find((w) => w.fft)?.fft;
        const entries: GPUBindGroupEntry[] = [{ binding: FFT_BINDING, resource: this._fftSampler! }];
        for (let c = 0; c < 3; c++) {
            const view = fft ? (fft.displacement[c].getGPUTexture() as GPUTexture).createView() : this._noFFT.createView();
            entries.push({ binding: FFT_BINDING + 1 + c, resource: view });
        }
        return entries;
    }

    /** Whether the near plane can reach below this surface: camera over its footprint and low enough. */
    private _cameraNear(water: WaterRenderer, camera: Camera3D): boolean {
        const p = camera.transform.worldPosition;
        // The near plane corners reach about near * 2 beyond the camera at common fields of view.
        const reach = camera.near * 2;
        if (!water.containsXZ(p.x, p.z, reach)) return false;
        return p.y - reach < water.baseHeight + water.waveReach;
    }

    private _ensureCopy(width: number, height: number): GPUTexture {
        if (this._copy && this._copy.width === width && this._copy.height === height) return this._copy;
        this._copy?.destroy();
        this._copy = this._device.createTexture({
            label: 'Underwater:SceneColor',
            size: [width, height, 1],
            format: COLOR_FORMAT,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        return this._copy;
    }

    /** Depth after all opaque, water and depth-writing transparent draws. */
    private _getSceneDepthView(context3D: Context3D): GPUTextureView | null {
        const frame = GBufferFrame.getGBufferFrame(GBufferFrame.colorPass_GBuffer, context3D);
        const tex = (frame.zPreTexture ?? frame.depthTexture) as RenderTexture;
        const gpuTex = tex?.getGPUTexture() as GPUTexture;
        if (!gpuTex) return null;
        if (gpuTex !== this._depthSrc) {
            this._depthSrc = gpuTex;
            this._depthView = gpuTex.createView({ aspect: 'depth-only' });
        }
        return this._depthView;
    }

    private _writeUniforms(waters: WaterRenderer[], camera: Camera3D): void {
        const f = this._uniformData;
        const ivp = this._invViewProj.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);
        ivp.invert();
        f.set(ivp.rawData, 0);
        f.set(camera.projectionMatrixInv.rawData, 16);
        f[32] = waters.length;
        f[33] = camera.far;
        const [p0, p1, p2] = WATER_FFT_PATCHES;
        f[36] = p0; f[37] = p1; f[38] = p2; f[39] = 0;
        const fftWater = waters.find((w) => w.fft);
        for (let w = 0; w < waters.length; w++) {
            const water = waters[w];
            const o = HEADER_FLOATS + w * WATER_FLOATS;
            f.set(water.invWorldMatrix.rawData, o);
            for (let i = 0; i < WATER_MAX_WAVES; i++) f.set(water.waveVector(i), o + 16 + i * 4);
            // Fields after the waves, in Water struct order.
            const q = o + 16 + WAVE_FLOATS;
            f[q] = water.baseHeight;
            f[q + 1] = water.time;
            f[q + 2] = water.waterMaterial.density;
            f.set(water.footprintBounds, q + 4);
            const a = water.waterMaterial.absorptionColor;
            f[q + 8] = a.r; f[q + 9] = a.g; f[q + 10] = a.b; f[q + 11] = 1;
            const s = water.waterMaterial.underwaterColor;
            f[q + 12] = s.r; f[q + 13] = s.g; f[q + 14] = s.b; f[q + 15] = 1;
            f[q + 16] = water.footprint ? 1 : 0;
            f[q + 17] = water === fftWater ? 1 : 0;
        }
        this._device.queue.writeBuffer(this._uniform, 0, f.buffer, f.byteOffset, UNIFORM_BYTES);
    }

    private _createPipeline(useLogDepth: boolean): void {
        const device = this._device;
        this._uniform = device.createBuffer({
            label: 'Underwater:Uniforms',
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._layout = device.createBindGroupLayout({
            label: 'Underwater:BGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
                ...WaterFootprintBindings.layoutEntries(FOOTPRINT_BINDING),
                { binding: FFT_BINDING, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                ...[1, 2, 3].map((i): GPUBindGroupLayoutEntry => ({
                    binding: FFT_BINDING + i, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' },
                })),
            ],
        });
        const module = device.createShaderModule({
            label: 'Underwater',
            code: Preprocessor.parse(UNDERWATER_WGSL, { USE_LOGDEPTH: useLogDepth }),
        });
        this._pipeline = device.createRenderPipeline({
            label: 'Underwater',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._layout] }),
            vertex: { module, entryPoint: 'vs' },
            fragment: { module, entryPoint: 'fs', targets: [{ format: COLOR_FORMAT }] },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
        });
    }
}

const UNDERWATER_WGSL = /* wgsl */`
${WaterWaves_wgsl}

struct Water {
    // world to local
    invWorld: mat4x4f,
    waves: array<vec4f, ${WATER_MAX_WAVES}>,
    // x = undisplaced surface height, y = wave time, z = absorption density
    params: vec4f,
    // local xz bounds: min x, min z, max x, max z
    bounds: vec4f,
    absorption: vec4f,
    scatter: vec4f,
    // x = 1 when the footprint has a mask (custom surface mesh), y = 1 for the water with FFT waves
    mask: vec4f,
};

struct Params {
    invViewProj: mat4x4f,
    projInv: mat4x4f,
    // x = water count, y = camera far
    info: vec4f,
    // FFT cascade patch sizes
    fft: vec4f,
    waters: array<Water, ${MAX_WATERS}>,
};

@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var sceneColor: texture_2d<f32>;
@group(0) @binding(2) var sceneDepth: texture_depth_2d;
${waterFootprintWGSL(FOOTPRINT_BINDING)}

// Waterline band: half width in pixels per pixel of screen height, and how dark its center is.
const LINE_WIDTH: f32 = 0.006;
const LINE_SHADE: f32 = 0.25;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var v = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(v[vi], 0.0, 1.0);
}

fn nearPoint(ndc: vec2f) -> vec3f {
    let h = p.invViewProj * vec4f(ndc, 0.0, 1.0);
    return h.xyz / h.w;
}

@group(0) @binding(${FFT_BINDING}) var fftSampler: sampler;
@group(0) @binding(${FFT_BINDING + 1}) var fftDisplacement0: texture_2d<f32>;
@group(0) @binding(${FFT_BINDING + 2}) var fftDisplacement1: texture_2d<f32>;
@group(0) @binding(${FFT_BINDING + 3}) var fftDisplacement2: texture_2d<f32>;

fn fftDisplaced(xz: vec2f) -> vec3f {
    return textureSampleLevel(fftDisplacement0, fftSampler, xz / p.fft.x, 0.0).xyz
         + textureSampleLevel(fftDisplacement1, fftSampler, xz / p.fft.y, 0.0).xyz
         + textureSampleLevel(fftDisplacement2, fftSampler, xz / p.fft.z, 0.0).xyz;
}

// Height of the FFT waves above world xz, through the undisplaced point that lands there.
fn fftHeight(xz: vec2f) -> f32 {
    var q = xz;
    for (var it = 0; it < 3; it++) {
        q = xz - fftDisplaced(q).xz;
    }
    return fftDisplaced(q).y;
}

// Height of a world point above water i's displaced surface.
fn heightAbove(i: u32, world: vec3f) -> f32 {
    let w = p.waters[i].waves;
    let params = p.waters[i].params;
    var surface = params.x + waterHeight(w, world.xz, params.y);
    if (p.waters[i].mask.y > 0.5) {
        surface += fftHeight(world.xz);
    }
    return world.y - surface;
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let dim = vec2f(textureDimensions(sceneColor));
    let uv = pos.xy / dim;
    let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);

    // Where this pixel's ray starts, and the water it is deepest under (or closest above).
    let nearW = nearPoint(ndc);
    var h = 1e9;
    var idx = 0u;
    for (var i = 0u; i < u32(p.info.x); i++) {
        if (insideFootprint(i, nearW)) {
            let hi = heightAbove(i, nearW);
            if (hi < h) {
                h = hi;
                idx = i;
            }
        }
    }

    // Distance to the waterline in pixels, from the change of h to the neighbouring pixels.
    let lineWidth = max(1.5, dim.y * LINE_WIDTH);
    let nearX = nearPoint(ndc + vec2f(2.0 / dim.x, 0.0));
    let nearY = nearPoint(ndc - vec2f(0.0, 2.0 / dim.y));
    let pixelSpan = max(length(nearX - nearW), length(nearY - nearW));
    var line = 0.0;
    if (abs(h) < 4.0 * lineWidth * pixelSpan) {
        let grad = vec2f(heightAbove(idx, nearX) - h, heightAbove(idx, nearY) - h);
        line = 1.0 - smoothstep(0.0, lineWidth, abs(h) / max(length(grad), 1e-9));
    }
    if (h >= 0.0 && line <= 0.0) {
        discard;
    }

    var color = textureLoad(sceneColor, vec2i(pos.xy), 0).rgb;
    if (h < 0.0) {
        // Distance along the ray to whatever was drawn there (the surface itself when looking up).
        let d = textureLoad(sceneDepth, vec2i(pos.xy), 0);
        let farH = p.projInv * vec4f(ndc, 1.0, 1.0);
        let ray = farH.xyz / farH.w;
        #if USE_LOGDEPTH
            let viewZ = pow(p.info.y + 1.0, d) - 1.0;
        #else
            let v = p.projInv * vec4f(0.0, 0.0, d, 1.0);
            let viewZ = v.z / v.w;
        #endif
        let dist = viewZ * length(ray) / max(ray.z, 1e-4);
        let water = p.waters[idx];
        let transmittance = exp(-water.params.z * dist * (vec3f(1.0) - water.absorption.rgb));
        color = color * transmittance + water.scatter.rgb * (vec3f(1.0) - transmittance);
    }
    return vec4f(mix(color, color * LINE_SHADE, line), 1.0);
}
`;

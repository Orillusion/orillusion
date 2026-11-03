import { WaterWaves_wgsl } from '../../../../assets/shader/materials/WaterShader';
import { ILight } from '../../../../components/lights/ILight';
import { LightType } from '../../../../components/lights/LightData';
import { WaterFootprintBindings, waterFootprintWGSL } from '../../../../components/renderer/WaterFootprint';
import { WaterRenderer } from '../../../../components/renderer/WaterRenderer';
import { WATER_MAX_WAVES } from '../../../../materials/WaterMaterial';
import { Camera3D } from '../../../../core/Camera3D';
import { Vector3 } from '../../../../math/Vector3';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { Context3D } from '../../../graphics/webGpu/Context3D';
import { Preprocessor } from '../../../graphics/webGpu/shader/util/Preprocessor';
import { ComponentCollect } from '../../collect/ComponentCollect';
import { EntityCollect } from '../../collect/EntityCollect';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';
import { COLOR_BUFFER } from './ColorPass';
import { MAIN_COLOR_RT } from './GBufferResourcePass';
import { MAIN_DEPTH_TEXTURE } from './PreDepthPass';

/** Must match COLOR_BUFFER's format. */
const COLOR_FORMAT: GPUTextureFormat = 'rgba16float';
/** Water surfaces handled per frame. */
const MAX_WATERS = 4;
/** See CAUSTICS_WGSL for the layout. */
const HEADER_FLOATS = 40;
const WAVE_FLOATS = WATER_MAX_WAVES * 4;
const WATER_FLOATS = 16 + WAVE_FLOATS + 16;
/** First binding of the footprint masks. */
const FOOTPRINT_BINDING = 2;
/** First binding of the interactive ripple heights, after the masks and their sampler. */
const RIPPLE_BINDING = FOOTPRINT_BINDING + 5;
const UNIFORM_BYTES = (HEADER_FLOATS + MAX_WATERS * WATER_FLOATS) * 4;

/**
 * Sunlight caustics under {@link WaterRenderer} surfaces. For every opaque
 * pixel below a surface, the light refracted through the surface is
 * focused or spread by its curvature: a ray entering where the height
 * field is h reaches depth d displaced by d * k * grad(h), so the light
 * there is scaled by 1 / |det(I + d * k * hessian(h))|. The curvature
 * comes from the waves plus the fine ripples ({@link WaterRenderer.detailScale})
 * that the waves are too long to provide; the same ripples bend the surface
 * normal, so what is seen on the surface and below it matches. The scene color is multiplied
 * by the result, weighted by how much the receiving surface faces the
 * refracted sunlight.
 *
 * {@link ForwardRendererJob} adds it after the opaque scene and the sky,
 * before the scene color pyramid, when `setting.render.water` is true, so
 * the caustics are seen both through the surface and underwater. It does
 * nothing without a directional light.
 *
 * @group Graph
 */
export class CausticsPass extends RenderGraphPass {
    public readonly name: string = 'CausticsPass';

    private _device!: GPUDevice;
    private _pipeline!: GPURenderPipeline;
    private _layout!: GPUBindGroupLayout;
    private _uniform!: GPUBuffer;
    private _uniformData = new Float32Array(UNIFORM_BYTES / 4);
    private _waters: WaterRenderer[] = [];
    private _active: WaterRenderer[] = [];
    private _footprints = new WaterFootprintBindings();
    private _noRipples: GPUTexture | null = null;
    private _depthSrc: GPUTexture | null = null;
    private _depthView: GPUTextureView | null = null;

    public setup(b: RenderGraphBuilder): void {
        this._device = b.context3D.device as GPUDevice;
        const setting = b.context3D.engine?.setting?.render;
        if (setting?.zPrePass) b.read(MAIN_DEPTH_TEXTURE);
        b.write(COLOR_BUFFER);
        b.useRenderTarget(MAIN_COLOR_RT);
        this._createPipeline(!!setting?.useLogDepth);
    }

    public destroy(): void {
        this._uniform?.destroy();
        this._footprints.destroy();
        this._noRipples?.destroy();
        this._noRipples = null;
        this._waters.length = 0;
        this._active.length = 0;
        this._depthSrc = null;
        this._depthView = null;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const view = ctx.view;
        const camera = view.camera;
        const sun = this._findSun(EntityCollect.instance.getLights(view.scene));
        if (!sun) return;
        const mask = (this.layerMask & (camera?.cullingMask ?? 0xFFFFFFFF)) >>> 0;
        ComponentCollect.collectByTypeLayered<WaterRenderer>(view, WaterRenderer, mask, this._waters);
        const waters = this._active;
        waters.length = 0;
        for (const w of this._waters) {
            if (waters.length < MAX_WATERS && w.transform?.enable && w.caustics && w.causticsIntensity > 0) waters.push(w);
        }
        if (waters.length === 0) return;

        const engine = view.engine3D;
        const colorTex = ctx.get<RenderTexture>(COLOR_BUFFER);
        const depthView = this._getSceneDepthView(engine.context3D);
        if (!colorTex || !depthView) return;
        this._writeUniforms(waters, camera, sun);

        const bg = this._device.createBindGroup({
            layout: this._layout,
            entries: [
                { binding: 0, resource: { buffer: this._uniform } },
                { binding: 1, resource: depthView },
                ...this._footprints.entries(this._device, waters.map((w) => w.footprint), FOOTPRINT_BINDING),
                ...this._rippleEntries(waters),
            ],
        });
        const gpu = engine.context3D.gpuContext;
        const command = gpu.beginCommandEncoder();
        const enc = command.beginRenderPass({
            label: 'Caustics',
            colorAttachments: [{ view: (colorTex.getGPUTexture() as GPUTexture).createView(), loadOp: 'load', storeOp: 'store' }],
        });
        enc.setPipeline(this._pipeline);
        enc.setBindGroup(0, bg);
        enc.draw(3);
        enc.end();
        gpu.endCommandEncoder(command);
    }

    /** Each water's ripple heights, or a 1x1 placeholder. */
    private _rippleEntries(waters: WaterRenderer[]): GPUBindGroupEntry[] {
        if (!this._noRipples) {
            this._noRipples = this._device.createTexture({
                label: 'Caustics:NoRipples',
                size: [1, 1, 1],
                format: 'rgba32float',
                usage: GPUTextureUsage.TEXTURE_BINDING,
            });
        }
        const entries: GPUBindGroupEntry[] = [];
        for (let i = 0; i < MAX_WATERS; i++) {
            const view = waters[i]?.rippleView ?? this._noRipples.createView();
            entries.push({ binding: RIPPLE_BINDING + i, resource: view });
        }
        return entries;
    }

    /** Travel direction of the first enabled directional light's rays. */
    private _findSun(lights: ILight[]): Vector3 | null {
        for (const light of lights) {
            const enabled = (light as any).enable ?? true;
            if (enabled && light.lightData.lightType === LightType.DirectionLight) return light.lightData.direction;
        }
        return null;
    }

    /** Opaque depth: the water surface skips the depth prepass and is drawn after this pass. */
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

    private _writeUniforms(waters: WaterRenderer[], camera: Camera3D, sun: Vector3): void {
        const f = this._uniformData;
        f.set(camera.projectionMatrixInv.rawData, 0);
        f.set(camera.transform.worldMatrix.rawData, 16);
        // Light data holds the direction the rays travel; the shader wants the way to the sun.
        const len = Math.hypot(sun.x, sun.y, sun.z) || 1;
        f[32] = -sun.x / len; f[33] = -sun.y / len; f[34] = -sun.z / len; f[35] = 0;
        f[36] = waters.length;
        f[37] = camera.far;
        for (let w = 0; w < waters.length; w++) {
            const water = waters[w];
            const o = HEADER_FLOATS + w * WATER_FLOATS;
            f.set(water.invWorldMatrix.rawData, o);
            for (let i = 0; i < WATER_MAX_WAVES; i++) f.set(water.waveVector(i), o + 16 + i * 4);
            // Fields after the waves, in Water struct order.
            const q = o + 16 + WAVE_FLOATS;
            f[q] = water.baseHeight;
            f[q + 1] = water.time;
            f[q + 2] = water.causticsIntensity;
            f[q + 3] = Math.max(water.detailScale, 1e-3);
            f.set(water.footprintBounds, q + 4);
            f[q + 8] = water.footprint ? 1 : 0;
            f[q + 9] = water.hasRipples ? 1 : 0;
            f.set(water.rippleBounds, q + 12);
        }
        this._device.queue.writeBuffer(this._uniform, 0, f.buffer, f.byteOffset, UNIFORM_BYTES);
    }

    private _createPipeline(useLogDepth: boolean): void {
        const device = this._device;
        this._uniform = device.createBuffer({
            label: 'Caustics:Uniforms',
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._layout = device.createBindGroupLayout({
            label: 'Caustics:BGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
                ...WaterFootprintBindings.layoutEntries(FOOTPRINT_BINDING),
                ...[0, 1, 2, 3].map((i): GPUBindGroupLayoutEntry => ({
                    binding: RIPPLE_BINDING + i, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' },
                })),
            ],
        });
        const module = device.createShaderModule({
            label: 'Caustics',
            code: Preprocessor.parse(CAUSTICS_WGSL, { USE_LOGDEPTH: useLogDepth }),
        });
        this._pipeline = device.createRenderPipeline({
            label: 'Caustics',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._layout] }),
            vertex: { module, entryPoint: 'vs' },
            fragment: {
                module, entryPoint: 'fs',
                // Multiplies the scene color.
                targets: [{
                    format: COLOR_FORMAT,
                    blend: {
                        color: { srcFactor: 'dst', dstFactor: 'zero', operation: 'add' },
                        alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
        });
    }
}

const CAUSTICS_WGSL = /* wgsl */`
${WaterWaves_wgsl}

struct Water {
    // world to local
    invWorld: mat4x4f,
    waves: array<vec4f, ${WATER_MAX_WAVES}>,
    // x = undisplaced surface height, y = wave time, z = caustics intensity, w = detail scale
    params: vec4f,
    // local xz bounds: min x, min z, max x, max z
    bounds: vec4f,
    // x = 1 when the footprint has a mask (custom surface mesh), y = 1 with interactive ripples
    mask: vec4f,
    // local xz bounds of the ripple grid
    rippleBounds: vec4f,
};

struct Params {
    projInv: mat4x4f,
    cameraWorld: mat4x4f,
    // toward the sun
    sun: vec4f,
    // x = water count, y = camera far
    info: vec4f,
    waters: array<Water, ${MAX_WATERS}>,
};

@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var sceneDepth: texture_depth_2d;
${waterFootprintWGSL(FOOTPRINT_BINDING)}

// Interactive ripple heights (WaterRipples) over each water's local bounds.
@group(0) @binding(${RIPPLE_BINDING}) var rippleMap0: texture_2d<f32>;
@group(0) @binding(${RIPPLE_BINDING + 1}) var rippleMap1: texture_2d<f32>;
@group(0) @binding(${RIPPLE_BINDING + 2}) var rippleMap2: texture_2d<f32>;
@group(0) @binding(${RIPPLE_BINDING + 3}) var rippleMap3: texture_2d<f32>;

fn rippleSize(i: u32) -> vec2i {
    switch (i) {
        case 0u: { return vec2i(textureDimensions(rippleMap0)); }
        case 1u: { return vec2i(textureDimensions(rippleMap1)); }
        case 2u: { return vec2i(textureDimensions(rippleMap2)); }
        default: { return vec2i(textureDimensions(rippleMap3)); }
    }
}

fn rippleTexel(i: u32, c: vec2i, size: vec2i) -> f32 {
    let t = clamp(c, vec2i(0), size - 1);
    switch (i) {
        case 0u: { return textureLoad(rippleMap0, t, 0).r; }
        case 1u: { return textureLoad(rippleMap1, t, 0).r; }
        case 2u: { return textureLoad(rippleMap2, t, 0).r; }
        default: { return textureLoad(rippleMap3, t, 0).r; }
    }
}

// Bilinear ripple height at grid coordinates c + o (o in -1..1), from the 4x4 texels
// around c (texels, row-major from floor(c) - 1); none off the grid.
fn rippleAt(texels: ptr<function, array<f32, 16>>, c: vec2f, o: vec2i, size: vec2f) -> f32 {
    let coord = c + vec2f(o);
    if (any(coord < vec2f(-0.5)) || any(coord > size - 0.5)) {
        return 0.0;
    }
    let f = c - floor(c);
    let k = (o.y + 1) * 4 + o.x + 1;
    let top = mix((*texels)[k], (*texels)[k + 1], f.x);
    let bottom = mix((*texels)[k + 4], (*texels)[k + 5], f.x);
    return mix(top, bottom, f.y);
}

// Adds water i's interactive ripples at world xz: finite differences on the grid, carried
// from local to world axes (local xz = A world xz, A from the inverse world matrix).
fn addRipples(i: u32, slope: ptr<function, WaterSlope>, xz: vec2f) {
    let w = p.waters[i];
    if (w.mask.y < 0.5) {
        return;
    }
    let local = (w.invWorld * vec4f(xz.x, w.params.x, xz.y, 1.0)).xz;
    let isize = rippleSize(i);
    let size = vec2f(isize);
    let cell = (w.rippleBounds.zw - w.rippleBounds.xy) / size;
    let c = (local - w.rippleBounds.xy) / cell - 0.5;
    // One texture read site for all nine samples: unrolled per sample, the switch over the
    // four maps makes the shader too large for software rasterizers to compile.
    var texels: array<f32, 16>;
    let base = vec2i(floor(c)) - 1;
    for (var k = 0; k < 16; k++) {
        texels[k] = rippleTexel(i, base + vec2i(k % 4, k / 4), isize);
    }
    let h = rippleAt(&texels, c, vec2i(0, 0), size);
    let hx0 = rippleAt(&texels, c, vec2i(-1, 0), size);
    let hx1 = rippleAt(&texels, c, vec2i(1, 0), size);
    let hz0 = rippleAt(&texels, c, vec2i(0, -1), size);
    let hz1 = rippleAt(&texels, c, vec2i(0, 1), size);
    let hxz = rippleAt(&texels, c, vec2i(1, 1), size) - rippleAt(&texels, c, vec2i(1, -1), size)
            - rippleAt(&texels, c, vec2i(-1, 1), size) + rippleAt(&texels, c, vec2i(-1, -1), size);
    let g = vec2f(hx1 - hx0, hz1 - hz0) / (2.0 * cell);
    let lxx = (hx1 - 2.0 * h + hx0) / (cell.x * cell.x);
    let lzz = (hz1 - 2.0 * h + hz0) / (cell.y * cell.y);
    let lxz = hxz / (4.0 * cell.x * cell.y);
    // A = [[a, b], [c, d]]: world gradient = A^T g, world Hessian = A^T H A.
    let a = w.invWorld[0].x;
    let b = w.invWorld[2].x;
    let cc = w.invWorld[0].z;
    let d = w.invWorld[2].z;
    (*slope).grad += vec2f(a * g.x + cc * g.y, b * g.x + d * g.y);
    let hxx = a * (a * lxx + cc * lxz) + cc * (a * lxz + cc * lzz);
    let hzz = b * (b * lxx + d * lxz) + d * (b * lxz + d * lzz);
    let hxzw = a * (b * lxx + d * lxz) + cc * (b * lxz + d * lzz);
    (*slope).hess += vec3f(hxx, hxzw, hzz);
}

const IOR: f32 = 1.333;
// Lower bound of |det|: the sun's size and the ripples' spread keep the focus finite.
const MIN_DET: f32 = 0.25;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var v = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(v[vi], 0.0, 1.0);
}

// Slope and curvature of water i's surface at xz: its waves plus the fine ripples.
fn surfaceSlope(i: u32, xz: vec2f) -> WaterSlope {
    let w = p.waters[i];
    let t = w.params.y;
    var slope = WaterSlope(vec2f(0.0), vec3f(0.0));
    for (var j = 0; j < ${WATER_MAX_WAVES}; j++) {
        let wave = w.waves[j];
        if (wave.w > 0.0) {
            let k = 2.0 * WATER_PI / wave.w;
            let d = normalize(wave.xy);
            waterSlopeTerm(&slope, d, k, wave.z, k * (dot(d, xz) - sqrt(WATER_GRAVITY / k) * t));
        }
    }
    waterDetail(&slope, xz, t, w.params.w, 0.0);
    addRipples(i, &slope, xz);
    return slope;
}

fn worldPosition(pos: vec2f, dim: vec2f) -> vec3f {
    let uv = pos / dim;
    let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
    let d = textureLoad(sceneDepth, vec2i(pos), 0);
    let farH = p.projInv * vec4f(ndc, 1.0, 1.0);
    let ray = farH.xyz / farH.w;
    #if USE_LOGDEPTH
        let viewZ = pow(p.info.y + 1.0, d) - 1.0;
    #else
        let v = p.projInv * vec4f(0.0, 0.0, d, 1.0);
        let viewZ = v.z / v.w;
    #endif
    return (p.cameraWorld * vec4f(ray * (viewZ / ray.z), 1.0)).xyz;
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let dim = vec2f(textureDimensions(sceneDepth));
    let world = worldPosition(pos.xy, dim);
    // Receiving surface normal and pixel footprint from the reconstructed positions (before any discard).
    let dx = dpdx(world);
    let dy = dpdy(world);
    var n = normalize(cross(dy, dx));
    // Geometric mean: at grazing views the pixel stretches along one axis only.
    let footprint = sqrt(length(dx) * length(dy));
    let toCamera = p.cameraWorld[3].xyz - world;
    if (dot(n, toCamera) < 0.0) {
        n = -n;
    }

    // Sunlight inside the water, travelling down.
    let L = normalize(p.sun.xyz);
    let down = refract(-L, vec3f(0.0, 1.0, 0.0), 1.0 / IOR);
    if (L.y <= 0.0) {
        discard;
    }

    var light = 1.0;
    var covered = false;
    for (var i = 0u; i < u32(p.info.x); i++) {
        if (!insideFootprint(i, world)) {
            continue;
        }
        let w = p.waters[i];
        let surface = w.params.x + waterHeight(w.waves, world.xz, w.params.y);
        let depth = surface - world.y;
        if (depth <= 0.0) {
            continue;
        }
        // Follow the sunlight back up to where it entered: light entering at q lands at
        // q + s * grad(h(q)), with s the path times the fraction of a surface tilt the
        // refraction turns it by. Solve for the q that lands here by fixed-point iteration.
        let path = depth / max(-down.y, 0.1);
        let flat = world.xz - down.xz * path;
        let s = path * (1.0 - 1.0 / IOR);
        var q = flat;
        for (var it = 0; it < 3; it++) {
            q = flat - s * surfaceSlope(i, q).grad;
        }
        // Light density there: the area ratio 1 / |det(I + s * H)|.
        let hess = surfaceSlope(i, q).hess;
        let det = (1.0 + s * hess.x) * (1.0 + s * hess.z) - s * s * hess.y * hess.y;
        let focus = 1.0 / max(abs(det), MIN_DET);
        let facing = clamp(dot(n, -down), 0.0, 1.0);
        // Fade out where the lines get thinner than a pixel and would only flicker.
        let resolved = 1.0 - smoothstep(0.05, 0.2, footprint / w.params.w);
        light = 1.0 + w.params.z * (focus - 1.0) * facing * resolved;
        covered = true;
        break;
    }
    if (!covered) {
        discard;
    }
    return vec4f(vec3f(max(light, 0.0)), 1.0);
}
`;

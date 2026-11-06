import { Context3D } from '../../gfx/graphics/webGpu/Context3D';
import { GPUTextureFormat } from '../../gfx/graphics/webGpu/WebGPUConst';
import { VirtualTexture } from '../../textures/VirtualTexture';

/** Ripples started per frame; more are dropped until the next frame. */
export const WATER_MAX_RIPPLES_PER_FRAME = 32;
/** See RIPPLE_WGSL for the layout. */
const UNIFORM_FLOATS = 12 + WATER_MAX_RIPPLES_PER_FRAME * 4;
/** Upper bound of simulation steps per frame. */
const MAX_STEPS = 12;
/**
 * Dispersion length in world units: waves shorter than about 2 pi times it
 * travel faster, so a ripple trails a few rings rather than a single pulse.
 * Longer spreads the energy so fast that the rings fade within a second.
 */
const DISPERSION_LENGTH = 0.05;

/**
 * Interactive ripples of a {@link WaterRenderer}: a height field over the
 * water's local xz bounds, advanced on the GPU with the wave equation plus
 * a fourth-order term, d2h/dt2 = c^2 lap(h) - c^2 l^2 lap(lap(h)), so that
 * shorter waves run ahead (dispersion length l).
 * A ripple starts as a push, like something striking the water: down at
 * the center and up around it, adding no volume. A crater opens and a ring
 * travels out, leaving the center level; a net push would leave a slowly
 * filling hollow instead, and a pressed-in dip springs up into a peak.
 * Ripples interfere, reflect off the edge of the water and die out.
 *
 * The state is two rgba32float textures used in turn (r = height,
 * g = vertical velocity); an even number of steps per frame leaves the
 * current state in {@link heightTexture}.
 * @internal
 */
export class WaterRipples {
    /** Grid cells along local x and z. */
    public readonly gridWidth: number;
    public readonly gridHeight: number;

    private _ctx: Context3D;
    private _textures: VirtualTexture[];
    private _pipeline: GPUComputePipeline | null = null;
    private _layout: GPUBindGroupLayout | null = null;
    private _uniform: GPUBuffer | null = null;
    private _sampler: GPUSampler | null = null;
    private _placeholder: GPUTexture | null = null;
    private _uniformData = new Float32Array(UNIFORM_FLOATS);
    private _pending: number[] = [];

    /**
     * @param bounds local xz bounds the grid covers: min x, min z, max x, max z
     * @param resolution cells along the longer side
     */
    constructor(ctx: Context3D, public readonly bounds: [number, number, number, number], resolution: number) {
        this._ctx = ctx;
        const w = Math.max(bounds[2] - bounds[0], 1e-6);
        const h = Math.max(bounds[3] - bounds[1], 1e-6);
        this.gridWidth = Math.max(8, Math.round(resolution * Math.min(1, w / h)));
        this.gridHeight = Math.max(8, Math.round(resolution * Math.min(1, h / w)));
        const usage = GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC;
        this._textures = [0, 1].map(() => {
            const t = new VirtualTexture(this.gridWidth, this.gridHeight, GPUTextureFormat.rgba32float, false, usage, 1, 0, 1, ctx);
            // rgba32float is not filterable; read with textureLoad.
            t.textureBindingLayout.sampleType = 'unfilterable-float';
            return t;
        });
    }

    /** Current state (r = height above the surface in world units), for sampling. */
    public get heightTexture(): VirtualTexture {
        return this._textures[0];
    }

    /**
     * Queues a ripple for the next step.
     * @param x local x
     * @param z local z
     * @param strength depth of the crater at the center, in world units
     * @param radius radius of the pushed area, in world units
     */
    public add(x: number, z: number, strength: number, radius: number): void {
        if (this._pending.length >= WATER_MAX_RIPPLES_PER_FRAME * 4) return;
        const [minX, minZ, maxX, maxZ] = this.bounds;
        this._pending.push(
            (x - minX) / (maxX - minX) * this.gridWidth,
            (z - minZ) / (maxZ - minZ) * this.gridHeight,
            strength, radius);
    }

    /**
     * Advances the simulation by dt seconds.
     * @param cellSize world size of a cell along local x and z
     * @param speed wave speed in world units per second
     * @param damping fraction of the motion lost per second
     * @param mask footprint mask over the bounds, or null when the whole grid is water
     */
    public step(command: GPUCommandEncoder, dt: number, cellSize: [number, number], speed: number, damping: number, mask: GPUTextureView | null): void {
        const device = this._ctx.device as GPUDevice;
        if (!this._pipeline) this._createPipeline(device);
        dt = Math.min(Math.max(dt, 0), 1 / 30);
        // Stable while step * highest frequency < 2; keep to half of that. The highest
        // frequency is sqrt(c^2 * L + beta * L^2), L the largest eigenvalue of the grid Laplacian.
        const beta = speed * speed * DISPERSION_LENGTH * DISPERSION_LENGTH;
        const L = 4 / (cellSize[0] * cellSize[0]) + 4 / (cellSize[1] * cellSize[1]);
        const maxStep = 1 / Math.sqrt(speed * speed * L + beta * L * L);
        // An even count ends in texture 0.
        let steps = Math.ceil(dt / maxStep);
        steps = Math.min(MAX_STEPS, Math.max(2, steps + (steps & 1)));
        const h = dt / steps;

        const f = this._uniformData;
        f[0] = this.gridWidth; f[1] = this.gridHeight; f[2] = cellSize[0]; f[3] = cellSize[1];
        f[4] = speed; f[5] = h; f[6] = Math.exp(-damping * h); f[7] = mask ? 1 : 0;
        const count = this._pending.length / 4;
        f[8] = count;
        f[9] = beta;
        f.set(this._pending, 12);
        this._pending.length = 0;

        const maskView = mask ?? this._placeholder!.createView();
        const groupsX = Math.ceil(this.gridWidth / 8), groupsY = Math.ceil(this.gridHeight / 8);
        for (let s = 0; s < steps; s++) {
            // Ripples are pushed in on the first step only.
            if (s === 1) f[8] = 0;
            if (s <= 1) {
                // A buffer per step: writeBuffer lands before the whole command buffer runs.
                device.queue.writeBuffer(this._uniform!, s * 256 * 4, f.buffer, f.byteOffset, UNIFORM_FLOATS * 4);
            }
            const src = this._textures[s & 1].getGPUTexture() as GPUTexture;
            const dst = this._textures[(s + 1) & 1].getGPUTexture() as GPUTexture;
            const bg = device.createBindGroup({
                layout: this._layout!,
                entries: [
                    { binding: 0, resource: { buffer: this._uniform!, offset: Math.min(s, 1) * 256 * 4, size: UNIFORM_FLOATS * 4 } },
                    { binding: 1, resource: src.createView() },
                    { binding: 2, resource: dst.createView() },
                    { binding: 3, resource: maskView },
                    { binding: 4, resource: this._sampler! },
                ],
            });
            const pass = command.beginComputePass({ label: 'WaterRipples' });
            pass.setPipeline(this._pipeline!);
            pass.setBindGroup(0, bg);
            pass.dispatchWorkgroups(groupsX, groupsY);
            pass.end();
        }
    }

    public destroy(): void {
        this._textures.forEach((t) => t.destroy());
        this._uniform?.destroy();
        this._placeholder?.destroy();
        this._uniform = null;
        this._placeholder = null;
        this._pipeline = null;
    }

    private _createPipeline(device: GPUDevice): void {
        // Two uniform slots, 256-float aligned: with ripples (first step) and without.
        this._uniform = device.createBuffer({
            label: 'WaterRipples:Uniforms',
            size: 2 * 256 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
        this._placeholder = device.createTexture({
            label: 'WaterRipples:NoMask',
            size: [1, 1, 1],
            format: 'r8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING,
        });
        this._layout = device.createBindGroupLayout({
            label: 'WaterRipples:BGL',
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float' } },
                { binding: 3, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'float' } },
                { binding: 4, visibility: GPUShaderStage.COMPUTE, sampler: { type: 'filtering' } },
            ],
        });
        this._pipeline = device.createComputePipeline({
            label: 'WaterRipples',
            layout: device.createPipelineLayout({ bindGroupLayouts: [this._layout] }),
            compute: { module: device.createShaderModule({ label: 'WaterRipples', code: RIPPLE_WGSL }), entryPoint: 'main' },
        });
    }
}

const RIPPLE_WGSL = /* wgsl */`
struct Params {
    // x, y = grid size; z, w = world size of a cell along local x and z
    grid: vec4f,
    // x = wave speed, y = step seconds, z = damping factor per step, w = 1 when masked
    sim: vec4f,
    // x = ripples to push in this step, y = dispersion coefficient (c^2 l^2)
    info: vec4f,
    // cell x, cell z, strength, world radius
    ripples: array<vec4f, ${WATER_MAX_RIPPLES_PER_FRAME}>,
};

@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var mask: texture_2d<f32>;
@group(0) @binding(4) var maskSampler: sampler;

fn isWater(c: vec2i) -> bool {
    let size = vec2i(p.grid.xy);
    if (any(c < vec2i(0)) || any(c >= size)) {
        return false;
    }
    if (p.sim.w < 0.5) {
        return true;
    }
    return textureSampleLevel(mask, maskSampler, (vec2f(c) + 0.5) / p.grid.xy, 0.0).r > 0.5;
}

// Height of a neighbour; the edge of the water reflects waves like a wall.
fn neighbour(c: vec2i, center: f32) -> f32 {
    if (isWater(c)) {
        return textureLoad(src, c, 0).r;
    }
    return center;
}

fn laplacian(c: vec2i, h: f32) -> f32 {
    let lx = neighbour(c - vec2i(1, 0), h) + neighbour(c + vec2i(1, 0), h) - 2.0 * h;
    let lz = neighbour(c - vec2i(0, 1), h) + neighbour(c + vec2i(0, 1), h) - 2.0 * h;
    return lx / (p.grid.z * p.grid.z) + lz / (p.grid.w * p.grid.w);
}

// Laplacian at a neighbour, mirrored from the center across the edge of the water.
fn neighbourLaplacian(c: vec2i, center: f32) -> f32 {
    if (isWater(c)) {
        return laplacian(c, textureLoad(src, c, 0).r);
    }
    return center;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let c = vec2i(id.xy);
    if (any(c >= vec2i(p.grid.xy))) {
        return;
    }
    if (!isWater(c)) {
        textureStore(dst, c, vec4f(0.0));
        return;
    }
    let state = textureLoad(src, c, 0);
    var h = state.r;
    var v = state.g;

    // Push the queued ripples in: a velocity kick shaped (1 - u^2) exp(-u^2), down at the center
    // and up around it with no net volume, reaching about the radius; scaled so the crater it
    // opens is about strength deep.
    for (var i = 0; i < i32(p.info.x); i++) {
        let r = p.ripples[i];
        let u = 2.0 * length((vec2f(c) + 0.5 - r.xy) * p.grid.zw) / r.w;
        if (u < 3.5) {
            v -= 6.7 * r.z * p.sim.x / r.w * (1.0 - u * u) * exp(-u * u);
        }
    }

    let lap = laplacian(c, h);
    let lap2x = neighbourLaplacian(c - vec2i(1, 0), lap) + neighbourLaplacian(c + vec2i(1, 0), lap) - 2.0 * lap;
    let lap2z = neighbourLaplacian(c - vec2i(0, 1), lap) + neighbourLaplacian(c + vec2i(0, 1), lap) - 2.0 * lap;
    let lap2 = lap2x / (p.grid.z * p.grid.z) + lap2z / (p.grid.w * p.grid.w);
    let dt = p.sim.y;
    v = (v + (p.sim.x * p.sim.x * lap - p.info.y * lap2) * dt) * p.sim.z;
    h = (h + v * dt) * p.sim.z;
    textureStore(dst, c, vec4f(h, v, 0.0, 0.0));
}
`;

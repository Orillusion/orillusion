import { Context3D } from '../../gfx/graphics/webGpu/Context3D';
import { GPUAddressMode, GPUFilterMode, GPUTextureFormat } from '../../gfx/graphics/webGpu/WebGPUConst';
import { VirtualTexture } from '../../textures/VirtualTexture';
import { WaterSpectrum } from './WaterSpectrum';

/** Texels per side of each cascade. */
export const WATER_FFT_SIZE = 256;
const LOG_SIZE = 8;
/** Mip levels of the displacement and slope textures, down to one texel. */
export const WATER_FFT_MIPS = LOG_SIZE + 1;
/** Side in metres of the patch each cascade tiles the water with. */
export const WATER_FFT_PATCHES = [256, 40, 6];
/**
 * Shortest wavelength each cascade holds: each keeps the band of the
 * spectrum from where the previous one stops to four of its own texels
 * per wave, the last one down to two.
 */
export const WATER_FFT_SHORTEST = [10, 1.5, 2 * 6 / WATER_FFT_SIZE];

/** Points whose height the CPU can ask for per frame. */
export const WATER_FFT_MAX_QUERIES = 64;
const STAGING = 3;
/** Read-back heights are kept this long after a point was last asked for. */
const HEIGHT_KEEP_MS = 2000;

/** Foam left by whitecaps fades to this fraction after a second. */
const FOAM_DECAY_PER_SECOND = 0.35;
/** Whitecaps start where the waves pinch the surface below this Jacobian. */
const FOAM_THRESHOLD = 0.6;

/**
 * GPU simulation of a {@link WaterSpectrum} (Tessendorf): each cascade's
 * initial spectrum is evolved in time and turned into the surface with
 * inverse FFTs, giving per cascade a displacement texture (x, y, z
 * displacement, dDx/dz) and a slope texture (dDy/dx, dDy/dz, dDx/dx,
 * dDz/dz), tiled over the water every patch size. Both carry mipmaps, so
 * the surface can drop the waves too short for the mesh or the pixel at
 * a distance and keep the long ones. Whitecaps, where the
 * summed cascades pinch the surface, are added to a foam map that fades
 * over time, so foam trails behind the crests that made it.
 * @internal
 */
export class WaterFFT {
    /** Per cascade: displacement and slope (rgba16float, filterable). */
    public readonly displacement: VirtualTexture[] = [];
    public readonly slope: VirtualTexture[] = [];
    /** Foam over the first cascade's patch (r = foam, g = Jacobian). */
    public readonly foam: VirtualTexture;

    private _ctx: Context3D;
    private _device: GPUDevice;
    private _h0: GPUTexture[] = [];
    private _fieldsA: GPUTexture[] = [];
    private _fieldsB: GPUTexture[] = [];
    private _scratch: GPUTexture;
    private _foamNext: VirtualTexture;
    private _uniform: GPUBuffer;
    private _pipelines: Record<string, GPUComputePipeline> = {};
    private _groups: Record<string, GPUBindGroup[]> & { mip?: { group: GPUBindGroup; size: number }[] } = {};
    private _shapeKey = '';
    private _sampler: GPUSampler;
    private _queryPoints: GPUBuffer;
    private _queryHeights: GPUBuffer;
    private _staging: { buffer: GPUBuffer; state: 'free' | 'copied' | 'mapping'; points: Float32Array }[] = [];
    /** Heights read back, kept until not asked for again for a while. */
    private _heights: { x: number; z: number; h: number; time: number }[] = [];

    constructor(ctx: Context3D) {
        this._ctx = ctx;
        const device = this._device = ctx.device as GPUDevice;
        const N = WATER_FFT_SIZE;
        const internal = (label: string) => device.createTexture({
            label, size: [N, N, 1], format: 'rgba32float',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        const visible = (mips: number) => {
            const usage = GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
                | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST;
            const t = new VirtualTexture(N, N, GPUTextureFormat.rgba16float, false, usage, 1, 0, mips, ctx);
            // Tiled every patch: plain repeat (the default mirrors), blended between mips.
            t.addressModeU = GPUAddressMode.repeat;
            t.addressModeV = GPUAddressMode.repeat;
            t.mipmapFilter = GPUFilterMode.linear;
            return t;
        };
        for (let c = 0; c < WATER_FFT_PATCHES.length; c++) {
            this._h0.push(internal(`WaterFFT:h0:${c}`));
            this._fieldsA.push(internal(`WaterFFT:A:${c}`));
            this._fieldsB.push(internal(`WaterFFT:B:${c}`));
            this.displacement.push(visible(WATER_FFT_MIPS));
            this.slope.push(visible(WATER_FFT_MIPS));
        }
        this._scratch = internal('WaterFFT:scratch');
        this.foam = visible(1);
        this._foamNext = visible(1);
        this._sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' });
        // Uniform slots, 256 bytes apart: init and evolve per cascade, the two FFT directions, foam.
        this._uniform = device.createBuffer({
            label: 'WaterFFT:Uniforms', size: 256 * UNIFORM_SLOTS,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this._uniform, SLOT_FFT_ROWS * 256, new Float32Array([0, 0, 0, 0]));
        device.queue.writeBuffer(this._uniform, SLOT_FFT_COLUMNS * 256, new Float32Array([1, 0, 0, 0]));
        this._queryPoints = device.createBuffer({
            label: 'WaterFFT:QueryPoints', size: WATER_FFT_MAX_QUERIES * 8,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this._queryHeights = device.createBuffer({
            label: 'WaterFFT:QueryHeights', size: WATER_FFT_MAX_QUERIES * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        for (let i = 0; i < STAGING; i++) {
            this._staging.push({
                buffer: device.createBuffer({ label: `WaterFFT:Readback:${i}`, size: WATER_FFT_MAX_QUERIES * 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST }),
                state: 'free', points: new Float32Array(0),
            });
        }
        this._createPipelines();
        this._createBindGroups();
    }

    /**
     * Height of the cascades above world (x, z), read back from an earlier
     * frame at the nearest point asked for within a metre; null if none.
     */
    public heightAt(x: number, z: number): number | null {
        let best = 1, found: number | null = null;
        for (const e of this._heights) {
            const d = Math.hypot(e.x - x, e.z - z);
            if (d < best) {
                best = d;
                found = e.h;
            }
        }
        return found;
    }

    /**
     * Computes the heights at these world xz points (x, z pairs, up to
     * {@link WATER_FFT_MAX_QUERIES}) for reading back once submitted
     * ({@link readBack}).
     */
    public queryHeights(command: GPUCommandEncoder, points: number[]): void {
        const count = Math.min(points.length >> 1, WATER_FFT_MAX_QUERIES);
        const slot = this._staging.find((s) => s.state === 'free');
        if (count === 0 || !slot) return;
        const data = new Float32Array(points.slice(0, count * 2));
        this._device.queue.writeBuffer(this._queryPoints, 0, data);
        this._device.queue.writeBuffer(this._uniform, SLOT_QUERY * 256, new Float32Array([
            WATER_FFT_PATCHES[0], WATER_FFT_PATCHES[1], WATER_FFT_PATCHES[2], count,
        ]));
        const pass = command.beginComputePass({ label: 'WaterFFT:query' });
        pass.setPipeline(this._pipelines.query);
        pass.setBindGroup(0, this._groups.query[0]);
        pass.dispatchWorkgroups(Math.ceil(count / 64));
        pass.end();
        command.copyBufferToBuffer(this._queryHeights, 0, slot.buffer, 0, count * 4);
        slot.state = 'copied';
        slot.points = data;
    }

    /** Starts reading back the heights computed in work submitted since the last call. */
    public readBack(): void {
        for (const slot of this._staging) {
            if (slot.state !== 'copied') continue;
            slot.state = 'mapping';
            slot.buffer.mapAsync(GPUMapMode.READ).then(() => {
                const heights = new Float32Array(slot.buffer.getMappedRange().slice(0));
                slot.buffer.unmap();
                // Update the points asked for again, add new ones, forget those not asked for in a while.
                const now = performance.now();
                const kept = this._heights.filter((e) => now - e.time < HEIGHT_KEEP_MS);
                for (let i = 0; i < slot.points.length >> 1; i++) {
                    const x = slot.points[i * 2], z = slot.points[i * 2 + 1];
                    const same = kept.find((e) => Math.abs(e.x - x) < 0.01 && Math.abs(e.z - z) < 0.01);
                    if (same) {
                        same.h = heights[i];
                        same.time = now;
                    } else {
                        kept.push({ x, z, h: heights[i], time: now });
                    }
                }
                this._heights = kept;
                slot.state = 'free';
            }, () => {
                slot.state = 'free';
            });
        }
    }

    /**
     * Advances the waves to `time` seconds and the foam by `dt`.
     * The initial spectrum is rebuilt whenever its shape changes.
     */
    public step(command: GPUCommandEncoder, spectrum: WaterSpectrum, time: number, dt: number): void {
        const device = this._device;
        const N = WATER_FFT_SIZE;
        const cascades = WATER_FFT_PATCHES.length;
        const groups = N / 8;
        if (spectrum.shapeKey !== this._shapeKey) {
            this._shapeKey = spectrum.shapeKey;
            const dir = spectrum.windDirection;
            for (let c = 0; c < cascades; c++) {
                const kMin = c === 0 ? 0 : 2 * Math.PI / WATER_FFT_SHORTEST[c - 1];
                const kMax = 2 * Math.PI / WATER_FFT_SHORTEST[c];
                device.queue.writeBuffer(this._uniform, (SLOT_INIT + c) * 256, new Float32Array([
                    WATER_FFT_PATCHES[c], kMin, kMax, spectrum.seed,
                    spectrum.windSpeed, spectrum.fetch, Math.atan2(dir.y, dir.x), spectrum.amplitude,
                ]));
            }
            const pass = command.beginComputePass({ label: 'WaterFFT:init' });
            pass.setPipeline(this._pipelines.init);
            for (let c = 0; c < cascades; c++) {
                pass.setBindGroup(0, this._groups.init[c]);
                pass.dispatchWorkgroups(groups, groups);
            }
            pass.end();
        }

        for (let c = 0; c < cascades; c++) {
            device.queue.writeBuffer(this._uniform, (SLOT_EVOLVE + c) * 256,
                new Float32Array([WATER_FFT_PATCHES[c], time, spectrum.choppiness, 0]));
        }
        const decay = Math.pow(FOAM_DECAY_PER_SECOND, Math.max(dt, 0));
        device.queue.writeBuffer(this._uniform, SLOT_FOAM * 256, new Float32Array([
            WATER_FFT_PATCHES[0], WATER_FFT_PATCHES[1], WATER_FFT_PATCHES[2], 0,
            decay, FOAM_THRESHOLD, 2.5, 0,
        ]));

        const pass = command.beginComputePass({ label: 'WaterFFT' });
        pass.setPipeline(this._pipelines.evolve);
        for (let c = 0; c < cascades; c++) {
            pass.setBindGroup(0, this._groups.evolve[c]);
            pass.dispatchWorkgroups(groups, groups);
        }
        // Rows then columns of each field texture, through the scratch texture and back.
        pass.setPipeline(this._pipelines.fft);
        for (const g of this._groups.fft) {
            pass.setBindGroup(0, g);
            pass.dispatchWorkgroups(N);
        }
        pass.setPipeline(this._pipelines.assemble);
        for (let c = 0; c < cascades; c++) {
            pass.setBindGroup(0, this._groups.assemble[c]);
            pass.dispatchWorkgroups(groups, groups);
        }
        // Mip levels of the displacement and slope textures, each from the one above.
        pass.setPipeline(this._pipelines.mip);
        for (const g of this._groups.mip) {
            pass.setBindGroup(0, g.group);
            pass.dispatchWorkgroups(Math.ceil(g.size / 8), Math.ceil(g.size / 8));
        }
        pass.setPipeline(this._pipelines.foam);
        pass.setBindGroup(0, this._groups.foam[0]);
        pass.dispatchWorkgroups(groups, groups);
        pass.end();
        command.copyTextureToTexture(
            { texture: this._foamNext.getGPUTexture() as GPUTexture },
            { texture: this.foam.getGPUTexture() as GPUTexture }, [N, N, 1]);
    }

    public destroy(): void {
        [...this._h0, ...this._fieldsA, ...this._fieldsB, this._scratch].forEach((t) => t.destroy());
        [...this.displacement, ...this.slope, this.foam, this._foamNext].forEach((t) => t.destroy());
        this._uniform.destroy();
        this._queryPoints.destroy();
        this._queryHeights.destroy();
        this._staging.forEach((s) => s.buffer.destroy());
    }

    private _createPipelines(): void {
        const device = this._device;
        const make = (name: string, code: string) => {
            this._pipelines[name] = device.createComputePipeline({
                label: `WaterFFT:${name}`, layout: 'auto',
                compute: { module: device.createShaderModule({ label: `WaterFFT:${name}`, code: COMMON_WGSL + code }), entryPoint: 'main' },
            });
        };
        make('init', INIT_WGSL);
        make('evolve', EVOLVE_WGSL);
        make('fft', FFT_WGSL);
        make('assemble', ASSEMBLE_WGSL);
        make('foam', FOAM_WGSL);
        make('query', QUERY_WGSL);
        make('mip', MIP_WGSL);
    }

    private _createBindGroups(): void {
        const device = this._device;
        const buffer = (slot: number) => ({ buffer: this._uniform, offset: slot * 256, size: 64 });
        // Level 0 only: storage bindings take one level, and the passes here read full detail.
        const view = (t: GPUTexture | VirtualTexture, level = 0) =>
            (t instanceof VirtualTexture ? t.getGPUTexture() as GPUTexture : t).createView({ baseMipLevel: level, mipLevelCount: 1 });
        const group = (name: string, entries: GPUBindingResource[]) => device.createBindGroup({
            layout: this._pipelines[name].getBindGroupLayout(0),
            entries: entries.map((resource, binding) => ({ binding, resource })),
        });
        this._groups.init = [];
        this._groups.evolve = [];
        this._groups.assemble = [];
        this._groups.fft = [];
        for (let c = 0; c < WATER_FFT_PATCHES.length; c++) {
            this._groups.init.push(group('init', [buffer(SLOT_INIT + c), view(this._h0[c])]));
            this._groups.evolve.push(group('evolve', [buffer(SLOT_EVOLVE + c), view(this._h0[c]), view(this._fieldsA[c]), view(this._fieldsB[c])]));
            for (const fields of [this._fieldsA[c], this._fieldsB[c]]) {
                this._groups.fft.push(group('fft', [buffer(SLOT_FFT_ROWS), view(fields), view(this._scratch)]));
                this._groups.fft.push(group('fft', [buffer(SLOT_FFT_COLUMNS), view(this._scratch), view(fields)]));
            }
            this._groups.assemble.push(group('assemble', [view(this._fieldsA[c]), view(this._fieldsB[c]), view(this.displacement[c]), view(this.slope[c])]));
        }
        this._groups.mip = [];
        for (const t of [...this.displacement, ...this.slope]) {
            for (let level = 1; level < WATER_FFT_MIPS; level++) {
                this._groups.mip.push({ group: group('mip', [view(t, level - 1), view(t, level)]), size: WATER_FFT_SIZE >> level });
            }
        }
        this._groups.query = [group('query', [
            buffer(SLOT_QUERY), this._sampler,
            view(this.displacement[0]), view(this.displacement[1]), view(this.displacement[2]),
            { buffer: this._queryPoints }, { buffer: this._queryHeights },
        ])];
        this._groups.foam = [group('foam', [
            buffer(SLOT_FOAM), this._sampler,
            view(this.displacement[0]), view(this.slope[0]), view(this.displacement[1]), view(this.slope[1]),
            view(this.displacement[2]), view(this.slope[2]), view(this.foam), view(this._foamNext),
        ])];
    }
}

const SLOT_INIT = 0;
const SLOT_EVOLVE = 3;
const SLOT_FFT_ROWS = 6;
const SLOT_FFT_COLUMNS = 7;
const SLOT_FOAM = 8;
const SLOT_QUERY = 9;
const UNIFORM_SLOTS = 10;

const COMMON_WGSL = /* wgsl */`
const N: u32 = ${WATER_FFT_SIZE}u;
const LOG_N: u32 = ${LOG_SIZE}u;
const G: f32 = 9.81;
const PI: f32 = 3.14159265;

// Wavenumber of texel n of a patch of the given size, the zero frequency at the center.
fn wavenumber(n: vec2i, extent: f32) -> vec2f {
    return 2.0 * PI * (vec2f(n) - f32(N / 2u)) / extent;
}

fn cmul(a: vec2f, b: vec2f) -> vec2f {
    return vec2f(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

// i * a
fn mulI(a: vec2f) -> vec2f {
    return vec2f(-a.y, a.x);
}
`;

const INIT_WGSL = /* wgsl */`
struct Init {
    // x = patch size, y = smallest wavenumber kept, z = largest, w = seed
    extent: vec4f,
    // x = wind speed, y = fetch, z = wind angle, w = amplitude
    wind: vec4f,
};
@group(0) @binding(0) var<uniform> u: Init;
@group(0) @binding(1) var h0: texture_storage_2d<rgba32float, write>;

fn hash(v: vec3u) -> f32 {
    var x = v.x * 1664525u + v.y * 1013904223u + v.z * 2654435769u;
    x ^= x >> 16u;
    x *= 2246822519u;
    x ^= x >> 13u;
    x *= 3266489917u;
    x ^= x >> 16u;
    return f32(x) / 4294967295.0;
}

// Two independent standard normal numbers for texel n (Box-Muller).
fn gauss(n: vec2i) -> vec2f {
    let s = u32(u.extent.w) * 7919u + u32(u.extent.x * 16.0);
    let u1 = max(hash(vec3u(vec2u(n), s)), 1e-7);
    let u2 = hash(vec3u(vec2u(n), s + 1u));
    let r = sqrt(-2.0 * log(u1));
    return r * vec2f(cos(2.0 * PI * u2), sin(2.0 * PI * u2));
}

// JONSWAP frequency spectrum for the wind speed and fetch.
fn jonswap(omega: f32) -> f32 {
    let wind = max(u.wind.x, 0.1);
    let fetch = max(u.wind.y, 1.0);
    let alpha = 0.076 * pow(wind * wind / (fetch * G), 0.22);
    let peak = 22.0 * pow(G * G / (wind * fetch), 1.0 / 3.0);
    let sigma = select(0.09, 0.07, omega <= peak);
    let r = exp(-(omega - peak) * (omega - peak) / (2.0 * sigma * sigma * peak * peak));
    return alpha * G * G / pow(omega, 5.0) * exp(-1.25 * pow(peak / omega, 4.0)) * pow(3.3, r);
}

// Complex amplitude scale of the wave with wavenumber k: from the spectrum around k,
// spread toward the wind (none against it), within this cascade's band.
fn amplitude(k: vec2f) -> f32 {
    let kl = length(k);
    if (kl < max(u.extent.y, 1e-6) || kl >= u.extent.z) {
        return 0.0;
    }
    let omega = sqrt(G * kl);
    let c = cos(atan2(k.y, k.x) - u.wind.z);
    let spread = select(0.0, 2.0 / PI * c * c, c > 0.0);
    let dk = 2.0 * PI / u.extent.x;
    // Energy per wavenumber area: S(omega) D(theta) domega/dk / k.
    let energy = jonswap(omega) * spread * (G / (2.0 * omega)) / kl;
    // The height at k sums this wave and the conjugate of the one at -k, and the two normal
    // numbers add a factor 2: a quarter of the energy each keeps the variance at E dk^2.
    // Ripples under a centimetre or so carry no energy.
    return sqrt(max(energy * dk * dk * 0.25, 0.0)) * exp(-kl * kl * 1e-4) * u.wind.w;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let n = vec2i(id.xy);
    let k = wavenumber(n, u.extent.x);
    let a = gauss(n) * amplitude(k);
    // The wave running the other way, -k, sits at texel N - n.
    let b = gauss((vec2i(i32(N)) - n) % vec2i(i32(N))) * amplitude(-k);
    // Stored: h0(k) and the conjugate of h0(-k).
    textureStore(h0, n, vec4f(a, b.x, -b.y));
}
`;

const EVOLVE_WGSL = /* wgsl */`
struct Evolve {
    // x = patch size, y = time, z = choppiness
    p: vec4f,
};
@group(0) @binding(0) var<uniform> u: Evolve;
@group(0) @binding(1) var h0: texture_2d<f32>;
@group(0) @binding(2) var fieldsA: texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var fieldsB: texture_storage_2d<rgba32float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let n = vec2i(id.xy);
    let k = wavenumber(n, u.p.x);
    let kl = length(k);
    if (kl < 1e-6) {
        textureStore(fieldsA, n, vec4f(0.0));
        textureStore(fieldsB, n, vec4f(0.0));
        return;
    }
    let s = textureLoad(h0, n, 0);
    let phase = sqrt(G * kl) * u.p.y;
    let e = vec2f(cos(phase), sin(phase));
    // Height spectrum at this time: a wave running along k plus one along -k.
    let h = cmul(s.xy, e) + cmul(s.zw, vec2f(e.x, -e.y));
    let kn = k / kl;
    let chop = u.p.z;
    // Horizontal displacement toward the crests, i k/|k| h, and the derivatives.
    let dx = mulI(h) * kn.x * chop;
    let dz = mulI(h) * kn.y * chop;
    let dydx = mulI(h) * k.x;
    let dydz = mulI(h) * k.y;
    let dxdx = -h * kn.x * k.x * chop;
    let dzdz = -h * kn.y * k.y * chop;
    let dxdz = -h * kn.x * k.y * chop;
    // Two real fields per complex transform: A + iB gives A in the real part, B in the imaginary.
    textureStore(fieldsA, n, vec4f(dx + mulI(dz), h + mulI(dxdz)));
    textureStore(fieldsB, n, vec4f(dydx + mulI(dydz), dxdx + mulI(dzdz)));
}
`;

const FFT_WGSL = /* wgsl */`
struct Fft {
    // x = 1 for columns
    p: vec4f,
};
@group(0) @binding(0) var<uniform> u: Fft;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba32float, write>;

// Two halves, read from one and written to the other each stage.
var<workgroup> buf: array<vec4f, ${WATER_FFT_SIZE * 2}>;

// w times each of the two complex numbers in v.
fn cmul2(w: vec2f, v: vec4f) -> vec4f {
    return vec4f(cmul(w, v.xy), cmul(w, v.zw));
}

// Inverse FFT of one row (or column), radix 2, one invocation per element.
@compute @workgroup_size(${WATER_FFT_SIZE})
fn main(@builtin(local_invocation_id) lid: vec3u, @builtin(workgroup_id) wid: vec3u) {
    let j = lid.x;
    let line = wid.x;
    let vertical = u.p.x > 0.5;
    let at = select(vec2i(i32(j), i32(line)), vec2i(i32(line), i32(j)), vertical);
    buf[reverseBits(j) >> (32u - LOG_N)] = textureLoad(src, at, 0);
    workgroupBarrier();
    var cur = 0u;
    for (var s = 0u; s < LOG_N; s++) {
        let size = 2u << s;
        let half = size >> 1u;
        let pos = j % size;
        var v: vec4f;
        if (pos < half) {
            let angle = 2.0 * PI * f32(pos) / f32(size);
            v = buf[cur + j] + cmul2(vec2f(cos(angle), sin(angle)), buf[cur + j + half]);
        } else {
            let angle = 2.0 * PI * f32(pos - half) / f32(size);
            v = buf[cur + j - half] - cmul2(vec2f(cos(angle), sin(angle)), buf[cur + j]);
        }
        buf[(N - cur) + j] = v;
        cur = N - cur;
        workgroupBarrier();
    }
    textureStore(dst, at, buf[cur + j]);
}
`;

const ASSEMBLE_WGSL = /* wgsl */`
@group(0) @binding(0) var fieldsA: texture_2d<f32>;
@group(0) @binding(1) var fieldsB: texture_2d<f32>;
@group(0) @binding(2) var displacement: texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var slope: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let n = vec2i(id.xy);
    // The spectrum's zero frequency sits at the center: undo that shift.
    let s = select(1.0, -1.0, ((n.x + n.y) & 1) == 1);
    let a = textureLoad(fieldsA, n, 0) * s;
    let b = textureLoad(fieldsB, n, 0) * s;
    // x = Dx, y = Dy (height), z = Dz, w = dDx/dz
    textureStore(displacement, n, vec4f(a.x, a.z, a.y, a.w));
    // dDy/dx, dDy/dz, dDx/dx, dDz/dz
    textureStore(slope, n, b);
}
`;

const FOAM_WGSL = /* wgsl */`
struct Foam {
    // patch sizes of the three cascades
    patches: vec4f,
    // x = fraction kept per step, y = Jacobian below which whitecaps form, z = how fast they whiten
    p: vec4f,
};
@group(0) @binding(0) var<uniform> u: Foam;
@group(0) @binding(1) var linearRepeat: sampler;
@group(0) @binding(2) var displacement0: texture_2d<f32>;
@group(0) @binding(3) var slope0: texture_2d<f32>;
@group(0) @binding(4) var displacement1: texture_2d<f32>;
@group(0) @binding(5) var slope1: texture_2d<f32>;
@group(0) @binding(6) var displacement2: texture_2d<f32>;
@group(0) @binding(7) var slope2: texture_2d<f32>;
@group(0) @binding(8) var previous: texture_2d<f32>;
@group(0) @binding(9) var next: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let n = vec2i(id.xy);
    // This texel's point of the first cascade's patch; the others tile it too.
    let p = (vec2f(n) + 0.5) / f32(N) * u.patches.x;
    let uv1 = p / u.patches.y;
    let uv2 = p / u.patches.z;
    let s = textureSampleLevel(slope0, linearRepeat, p / u.patches.x, 0.0)
          + textureSampleLevel(slope1, linearRepeat, uv1, 0.0)
          + textureSampleLevel(slope2, linearRepeat, uv2, 0.0);
    let dxdz = textureSampleLevel(displacement0, linearRepeat, p / u.patches.x, 0.0).w
             + textureSampleLevel(displacement1, linearRepeat, uv1, 0.0).w
             + textureSampleLevel(displacement2, linearRepeat, uv2, 0.0).w;
    // How much the waves squeeze the surface together: below the threshold, whitecaps.
    let jacobian = (1.0 + s.z) * (1.0 + s.w) - dxdz * dxdz;
    let fresh = clamp((u.p.y - jacobian) * u.p.z, 0.0, 1.0);
    let foam = max(textureLoad(previous, n, 0).r * u.p.x, fresh);
    textureStore(next, n, vec4f(foam, jacobian, 0.0, 1.0));
}
`;

const QUERY_WGSL = /* wgsl */`
struct Query {
    // xyz = patch sizes of the three cascades, w = points
    p: vec4f,
};
@group(0) @binding(0) var<uniform> u: Query;
@group(0) @binding(1) var linearRepeat: sampler;
@group(0) @binding(2) var displacement0: texture_2d<f32>;
@group(0) @binding(3) var displacement1: texture_2d<f32>;
@group(0) @binding(4) var displacement2: texture_2d<f32>;
@group(0) @binding(5) var<storage, read> points: array<vec2f>;
@group(0) @binding(6) var<storage, read_write> heights: array<f32>;

fn displaced(p: vec2f) -> vec3f {
    return textureSampleLevel(displacement0, linearRepeat, p / u.p.x, 0.0).xyz
         + textureSampleLevel(displacement1, linearRepeat, p / u.p.y, 0.0).xyz
         + textureSampleLevel(displacement2, linearRepeat, p / u.p.z, 0.0).xyz;
}

// Height of the surface above each point: the waves also move the water sideways, so
// the undisplaced point that lands there is found by fixed-point iteration.
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let i = id.x;
    if (i >= u32(u.p.w)) {
        return;
    }
    let xz = points[i];
    var p = xz;
    for (var it = 0; it < 4; it++) {
        p = xz - displaced(p).xz;
    }
    heights[i] = displaced(p).y;
}
`;

const MIP_WGSL = /* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;

// One mip level: the average of the four texels above each.
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
    let size = textureDimensions(dst);
    if (any(id.xy >= size)) {
        return;
    }
    let c = vec2i(id.xy) * 2;
    let v = textureLoad(src, c, 0) + textureLoad(src, c + vec2i(1, 0), 0)
          + textureLoad(src, c + vec2i(0, 1), 0) + textureLoad(src, c + vec2i(1, 1), 0);
    textureStore(dst, vec2i(id.xy), v * 0.25);
}
`;

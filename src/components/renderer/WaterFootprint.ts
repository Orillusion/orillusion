import { GeometryBase } from '../../core/geometry/GeometryBase';
import { VertexAttributeName } from '../../core/geometry/VertexAttributeName';

/** Texels of the footprint mask along the longer side. */
const MASK_SIZE = 1024;

/**
 * Where a {@link WaterRenderer} with a custom surface mesh has water: the
 * mesh's triangles projected onto its local xz plane, rasterized once into
 * a mask over their bounds. Point tests on the CPU read the mask; the GPU
 * gets the same mask as a texture.
 * @internal
 */
export class WaterFootprint {
    /** Local xz bounds: min x, min z, max x, max z. */
    public readonly bounds: [number, number, number, number];
    /** Mask size in texels; rows run along local z. */
    public readonly maskWidth: number;
    public readonly maskHeight: number;
    /** Number of triangles rasterized. */
    public readonly triangleCount: number;

    /** 255 on water. */
    private _mask: Uint8Array<ArrayBuffer>;
    private _maskTexture: GPUTexture | null = null;
    private _maskView: GPUTextureView | null = null;

    constructor(geometry: GeometryBase) {
        const pos = geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
        const idx = geometry.getAttribute(VertexAttributeName.indices).data as Uint16Array | Uint32Array;
        this.triangleCount = Math.floor(idx.length / 3);
        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (let i = 0; i < this.triangleCount * 3; i++) {
            const v = idx[i] * 3;
            minX = Math.min(minX, pos[v]); maxX = Math.max(maxX, pos[v]);
            minZ = Math.min(minZ, pos[v + 2]); maxZ = Math.max(maxZ, pos[v + 2]);
        }
        if (this.triangleCount === 0) minX = minZ = maxX = maxZ = 0;
        this.bounds = [minX, minZ, maxX, maxZ];
        const w = Math.max(maxX - minX, 1e-6), h = Math.max(maxZ - minZ, 1e-6);
        this.maskWidth = Math.max(16, Math.round(MASK_SIZE * Math.min(1, w / h)));
        this.maskHeight = Math.max(16, Math.round(MASK_SIZE * Math.min(1, h / w)));
        this._mask = new Uint8Array(this.maskWidth * this.maskHeight);
        this._rasterize(pos, idx);
    }

    /** True when local (x, z) lies on the mesh, to the precision of the mask. */
    public contains(x: number, z: number): boolean {
        const [minX, minZ, maxX, maxZ] = this.bounds;
        if (x < minX || x > maxX || z < minZ || z > maxZ) return false;
        const i = Math.min(this.maskWidth - 1, Math.floor((x - minX) / Math.max(maxX - minX, 1e-6) * this.maskWidth));
        const j = Math.min(this.maskHeight - 1, Math.floor((z - minZ) / Math.max(maxZ - minZ, 1e-6) * this.maskHeight));
        return this._mask[j * this.maskWidth + i] > 0;
    }

    /** The mask as an r8unorm texture, uploaded on first use. */
    public getMaskView(device: GPUDevice): GPUTextureView {
        if (!this._maskView) {
            this._maskTexture = device.createTexture({
                label: 'WaterFootprint:Mask',
                size: [this.maskWidth, this.maskHeight, 1],
                format: 'r8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
            device.queue.writeTexture({ texture: this._maskTexture }, this._mask,
                { bytesPerRow: this.maskWidth }, [this.maskWidth, this.maskHeight, 1]);
            this._maskView = this._maskTexture.createView();
        }
        return this._maskView;
    }

    public destroy(): void {
        this._maskTexture?.destroy();
        this._maskTexture = null;
        this._maskView = null;
    }

    // Marks every texel whose center lies in a triangle (edges included, so neighbours leave no cracks).
    private _rasterize(pos: Float32Array, idx: Uint16Array | Uint32Array): void {
        const [minX, minZ, maxX, maxZ] = this.bounds;
        const W = this.maskWidth, H = this.maskHeight;
        const sx = W / Math.max(maxX - minX, 1e-6), sz = H / Math.max(maxZ - minZ, 1e-6);
        const mask = this._mask;
        for (let t = 0; t < this.triangleCount; t++) {
            // Corners in texel units, texel centers at integers.
            const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
            const ax = (pos[a] - minX) * sx - 0.5, az = (pos[a + 2] - minZ) * sz - 0.5;
            const bx = (pos[b] - minX) * sx - 0.5, bz = (pos[b + 2] - minZ) * sz - 0.5;
            const cx = (pos[c] - minX) * sx - 0.5, cz = (pos[c + 2] - minZ) * sz - 0.5;
            const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
            if (area === 0) continue;
            const sign = area > 0 ? 1 : -1;
            const i0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx))), i1 = Math.min(W - 1, Math.floor(Math.max(ax, bx, cx)));
            const j0 = Math.max(0, Math.ceil(Math.min(az, bz, cz))), j1 = Math.min(H - 1, Math.floor(Math.max(az, bz, cz)));
            for (let j = j0; j <= j1; j++) {
                for (let i = i0; i <= i1; i++) {
                    const e0 = ((bx - ax) * (j - az) - (bz - az) * (i - ax)) * sign;
                    const e1 = ((cx - bx) * (j - bz) - (cz - bz) * (i - bx)) * sign;
                    const e2 = ((ax - cx) * (j - cz) - (az - cz) * (i - cx)) * sign;
                    if (e0 >= 0 && e1 >= 0 && e2 >= 0) mask[j * W + i] = 255;
                }
            }
        }
    }
}

/**
 * WGSL for the passes that test points against water footprints. Expects
 * `p.waters[i]` with `invWorld: mat4x4f`, `bounds: vec4f` (local min x, min z,
 * max x, max z) and `mask: vec4f` (x = 1 when the footprint has a mask), and
 * binds four masks and a sampler from `firstBinding` on in group 0.
 * @internal
 */
export function waterFootprintWGSL(firstBinding: number): string {
    return /* wgsl */`
@group(0) @binding(${firstBinding}) var footprintMask0: texture_2d<f32>;
@group(0) @binding(${firstBinding + 1}) var footprintMask1: texture_2d<f32>;
@group(0) @binding(${firstBinding + 2}) var footprintMask2: texture_2d<f32>;
@group(0) @binding(${firstBinding + 3}) var footprintMask3: texture_2d<f32>;
@group(0) @binding(${firstBinding + 4}) var footprintSampler: sampler;

fn footprintMask(i: u32, uv: vec2f) -> f32 {
    switch (i) {
        case 0u: { return textureSampleLevel(footprintMask0, footprintSampler, uv, 0.0).r; }
        case 1u: { return textureSampleLevel(footprintMask1, footprintSampler, uv, 0.0).r; }
        case 2u: { return textureSampleLevel(footprintMask2, footprintSampler, uv, 0.0).r; }
        default: { return textureSampleLevel(footprintMask3, footprintSampler, uv, 0.0).r; }
    }
}

// True when the world point is above or below water i's footprint.
fn insideFootprint(i: u32, world: vec3f) -> bool {
    let local = (p.waters[i].invWorld * vec4f(world, 1.0)).xz;
    let b = p.waters[i].bounds;
    if (any(local < b.xy) || any(local > b.zw)) {
        return false;
    }
    if (p.waters[i].mask.x < 0.5) {
        return true;
    }
    return footprintMask(i, (local - b.xy) / max(b.zw - b.xy, vec2f(1e-6))) > 0.5;
}
`;
}

/**
 * Bind group entries for {@link waterFootprintWGSL}: each water's mask, or
 * a 1x1 placeholder for waters without one.
 * @internal
 */
export class WaterFootprintBindings {
    private _placeholder: GPUTexture | null = null;
    private _placeholderView: GPUTextureView | null = null;
    private _sampler: GPUSampler | null = null;

    /** Layout entries, for the fragment stage, from `firstBinding` on. */
    public static layoutEntries(firstBinding: number): GPUBindGroupLayoutEntry[] {
        const entries: GPUBindGroupLayoutEntry[] = [];
        for (let i = 0; i < 4; i++) {
            entries.push({ binding: firstBinding + i, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } });
        }
        entries.push({ binding: firstBinding + 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } });
        return entries;
    }

    /** Entries for up to four footprints, in the order the waters were written to the uniforms. */
    public entries(device: GPUDevice, footprints: (WaterFootprint | null)[], firstBinding: number): GPUBindGroupEntry[] {
        if (!this._placeholder) {
            this._placeholder = device.createTexture({
                label: 'WaterFootprint:Placeholder',
                size: [1, 1, 1],
                format: 'r8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING,
            });
            this._placeholderView = this._placeholder.createView();
            this._sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
        }
        const entries: GPUBindGroupEntry[] = [];
        for (let i = 0; i < 4; i++) {
            const view = footprints[i]?.getMaskView(device) ?? this._placeholderView!;
            entries.push({ binding: firstBinding + i, resource: view });
        }
        entries.push({ binding: firstBinding + 4, resource: this._sampler! });
        return entries;
    }

    public destroy(): void {
        this._placeholder?.destroy();
        this._placeholder = null;
        this._placeholderView = null;
        this._sampler = null;
    }
}

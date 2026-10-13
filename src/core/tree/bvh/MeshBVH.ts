import { GeometryBase } from '../../geometry/GeometryBase';
import { VertexAttributeName } from '../../geometry/VertexAttributeName';
import { Vector3 } from '../../../math/Vector3';

/**
 * Which triangle faces a ray query ignores. Front faces are counter-clockwise
 * as seen from the ray origin (the engine's default `frontFace: 'ccw'`).
 * - `none`: hit both sides
 * - `back`: skip back faces (what a `cullMode: 'back'` material shows)
 * - `front`: skip front faces (what a `cullMode: 'front'` material shows)
 * @group Core
 */
export type MeshBVHCull = 'none' | 'back' | 'front';

/**
 * Options for `MeshBVH` ray queries. Distances are along the normalized ray
 * direction in the geometry's local space.
 * @group Core
 */
export interface MeshBVHRayOptions {
    /** Faces to ignore; `true` means `'back'`. Default `'none'`. */
    cull?: MeshBVHCull | boolean;
    /** Ignore hits closer than this. Default 0. */
    near?: number;
    /** Ignore hits farther than this. Default Infinity. */
    far?: number;
}

/**
 * Result of a `MeshBVH` ray query. All values are in the geometry's local
 * space; `t` is the distance along the (normalized) ray direction.
 * @group Core
 */
export interface MeshBVHHit {
    /** Distance along the ray. */
    t: number;
    /** Triangle index into the index buffer (`indices[triIndex*3 .. +2]`). */
    triIndex: number;
    /** Barycentric weight of vertex 1 (v0 gets `1-u-v`). */
    u: number;
    /** Barycentric weight of vertex 2. */
    v: number;
    /** Hit point in local space. */
    point: Vector3;
    /** Geometric (face) normal in local space, unit length, from the triangle winding. */
    faceNormal: Vector3;
    /** Whether the ray hit the front (counter-clockwise) side of the triangle. */
    frontFace: boolean;
    /** Index of the `SubGeometry` (and so the renderer material) the triangle belongs to. */
    subGeometryIndex: number;
}

/**
 * Strided view of one vertex attribute: component `k` of vertex `i` is
 * `data[i * stride + offset + k]`. Covers both split attributes and the
 * interleaved `all` buffer of `compose_bin` (prefab) geometry.
 * @group Core
 */
export interface MeshAttributeView {
    data: ArrayLike<number>;
    stride: number;
    offset: number;
}

/** A run of triangles `[start, start + count)` belonging to one sub-geometry. */
interface TriRange {
    start: number;
    count: number;
    sub: number;
}

/** Triangle data shared by the tree and the tree-less queries. */
interface TriSource {
    pos: MeshAttributeView;
    /** null → non-indexed: triangle t uses vertices 3t, 3t+1, 3t+2. */
    indices: ArrayLike<number> | null;
    ranges: TriRange[];
    triCount: number;
}

const EPS_DET = 1e-12;
const EPS_T = 1e-7;
// Scratch written by rayTri: u, v, det.
let _u = 0, _v = 0, _det = 0;

/**
 * Möller–Trumbore. Returns t, or -1 on a miss; leaves u/v/det in the module
 * scratch. `cull`: 0 none, 1 skip back faces, 2 skip front faces.
 */
function rayTri(P: ArrayLike<number>, ia: number, ib: number, ic: number,
    ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cull: number): number {
    const ax = P[ia], ay = P[ia + 1], az = P[ia + 2];
    const e1x = P[ib] - ax, e1y = P[ib + 1] - ay, e1z = P[ib + 2] - az;
    const e2x = P[ic] - ax, e2y = P[ic + 1] - ay, e2z = P[ic + 2] - az;
    // p = d × e2
    const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    // det > 0 ⇔ the ray sees the counter-clockwise (front) side.
    if (cull === 1) { if (det < EPS_DET) return -1; }
    else if (cull === 2) { if (det > -EPS_DET) return -1; }
    else if (det > -EPS_DET && det < EPS_DET) return -1;
    const inv = 1 / det;
    const tx = ox - ax, ty = oy - ay, tz = oz - az;
    const u = (tx * px + ty * py + tz * pz) * inv;
    if (u < 0 || u > 1) return -1;
    // q = t × e1
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
    const v = (dx * qx + dy * qy + dz * qz) * inv;
    if (v < 0 || u + v > 1) return -1;
    _u = u; _v = v; _det = det;
    return (e2x * qx + e2y * qy + e2z * qz) * inv;
}

function cullCode(cull: MeshBVHCull | boolean | undefined): number {
    if (cull === true || cull === 'back') return 1;
    if (cull === 'front') return 2;
    return 0;
}

function newHit(): MeshBVHHit {
    return { t: 0, triIndex: -1, u: 0, v: 0, point: new Vector3(), faceNormal: new Vector3(), frontFace: true, subGeometryIndex: 0 };
}

/**
 * Bounding-volume hierarchy over the triangles of a `GeometryBase`, for fast
 * CPU ray queries (picking, placement, line-of-sight). Built once per
 * geometry and cached in a `WeakMap`; brute-force scanning every triangle
 * is O(n) per ray, the BVH is O(log n).
 *
 * Nodes are stored flat in typed arrays (6 floats of bounds + 2 uints per
 * node) so traversal allocates nothing until a hit is reported. Leaves hold
 * up to `maxLeafTris` triangles; interior nodes split on the longest
 * centroid axis at the midpoint of the centroid bounds, falling back to a
 * median split when one side would be empty.
 *
 * Only triangles drawn at LOD 0 of each `SubGeometry` are indexed (the
 * whole index buffer when the geometry has no sub-geometries). Positions
 * are read from the `position` attribute, or from the interleaved `all`
 * buffer of `compose_bin` (prefab) geometry. Skinning and morph targets are
 * not applied: the tree describes the bind pose.
 *
 * The cache follows `GeometryBase.version`: when positions are re-uploaded
 * in place the tree is refit, when the vertex/index arrays are replaced it
 * is rebuilt. After editing positions in place without an upload, call
 * `refit()` (or `MeshBVH.invalidate`).
 *
 * ```ts
 * const bvh = MeshBVH.get(meshRenderer.geometry);
 * const hit = bvh.raycast(localOrigin, localDirection, { cull: 'back', far: 100 });
 * ```
 *
 * The static `raycastGeometry` / `raycastGeometryAll` run the same queries
 * without building a tree, for one-off rays or tiny meshes.
 * @group Core
 */
export class MeshBVH {
    private static _cache: WeakMap<GeometryBase, MeshBVH> = new WeakMap();

    /**
     * Fetch the cached BVH for a geometry, building it on first use. A cached
     * tree whose geometry changed since (see `GeometryBase.version`) is
     * refit or rebuilt first.
     * @param maxLeafTris only used when a tree has to be built; use
     * `build` to force a different leaf size.
     */
    public static get(geometry: GeometryBase, maxLeafTris: number = 8): MeshBVH {
        let bvh = MeshBVH._cache.get(geometry);
        if (bvh) {
            if (bvh._version !== geometry.version) {
                const src = MeshBVH._source(geometry);
                if (src.pos.data === bvh._pos.data && src.indices === bvh._srcIndices && src.triCount === bvh._srcTriCount) {
                    bvh.refit();
                } else {
                    bvh = MeshBVH.build(geometry, maxLeafTris);
                }
            }
            return bvh;
        }
        return MeshBVH.build(geometry, maxLeafTris);
    }

    /** Build (or rebuild) the BVH for a geometry and cache it, replacing any cached tree. */
    public static build(geometry: GeometryBase, maxLeafTris: number = 8): MeshBVH {
        const bvh = new MeshBVH(geometry, maxLeafTris);
        MeshBVH._cache.set(geometry, bvh);
        return bvh;
    }

    /** Drop the cached BVH (the next `get` rebuilds it). */
    public static invalidate(geometry: GeometryBase): void {
        MeshBVH._cache.delete(geometry);
    }

    /** Whether a BVH has been built (and not invalidated) for this geometry. */
    public static has(geometry: GeometryBase): boolean {
        return MeshBVH._cache.has(geometry);
    }

    /**
     * Strided view of a vertex attribute (`position`, `normal`, `uv`,
     * `TEXCOORD_1`, …), whether the geometry stores it as its own array or
     * interleaved in a `compose_bin` buffer. null when absent.
     */
    public static getAttributeView(geometry: GeometryBase, name: string): MeshAttributeView | null {
        const attr = geometry.getAttribute(name);
        if (attr && attr.data && attr.data.length > 0) {
            const dim = MeshBVH._attributeDim(name);
            return { data: attr.data as ArrayLike<number>, stride: dim, offset: 0 };
        }
        const all = geometry.getAttribute(VertexAttributeName.all);
        if (all && all.data && all.data.length > 0 && geometry.vertexDim > 0) {
            const layout = geometry.vertexBuffer?.composeBinLayout;
            if (layout) {
                for (let i = 0; i < layout.length; i++) {
                    if (layout[i].name === name) return { data: all.data as ArrayLike<number>, stride: geometry.vertexDim, offset: layout[i].offset / 4 };
                }
                return null;
            }
            // Legacy packed buffers without a recorded layout start with position.
            if (name === VertexAttributeName.position) return { data: all.data as ArrayLike<number>, stride: geometry.vertexDim, offset: 0 };
        }
        return null;
    }

    private static _attributeDim(name: string): number {
        switch (name) {
            case VertexAttributeName.position:
            case VertexAttributeName.normal:
                return 3;
            case VertexAttributeName.TANGENT:
            case VertexAttributeName.color:
            case VertexAttributeName.joints0:
            case VertexAttributeName.joints1:
            case VertexAttributeName.weights0:
            case VertexAttributeName.weights1:
                return 4;
            case VertexAttributeName.vIndex:
                return 1;
        }
        return name.startsWith('a_morph') ? 3 : 2;
    }

    /**
     * Closest hit without a tree: tests every triangle (O(n)). Same options
     * and result as `raycast`.
     */
    public static raycastGeometry(geometry: GeometryBase, origin: Vector3, direction: Vector3, options?: MeshBVHRayOptions, target?: MeshBVHHit): MeshBVHHit | null {
        const src = MeshBVH._source(geometry);
        const cull = cullCode(options?.cull);
        const near = options?.near ?? 0;
        let best = options?.far ?? Infinity, bestTri = -1, bu = 0, bv = 0, bdet = 0;
        const P = src.pos.data, ps = src.pos.stride, po = src.pos.offset, I = src.indices;
        const ox = origin.x, oy = origin.y, oz = origin.z, dx = direction.x, dy = direction.y, dz = direction.z;
        for (const r of src.ranges) {
            for (let tri = r.start, e = r.start + r.count; tri < e; tri++) {
                const k = tri * 3;
                const a = I ? I[k] : k, b = I ? I[k + 1] : k + 1, c = I ? I[k + 2] : k + 2;
                const t = rayTri(P, a * ps + po, b * ps + po, c * ps + po, ox, oy, oz, dx, dy, dz, cull);
                if (t > EPS_T && t >= near && t < best) { best = t; bestTri = tri; bu = _u; bv = _v; bdet = _det; }
            }
        }
        if (bestTri < 0) return null;
        return MeshBVH._fill(target || newHit(), src, bestTri, best, bu, bv, bdet, ox, oy, oz, dx, dy, dz);
    }

    /** Every hit without a tree, sorted by distance. Same options as `raycastAll`. */
    public static raycastGeometryAll(geometry: GeometryBase, origin: Vector3, direction: Vector3, options?: MeshBVHRayOptions, out: MeshBVHHit[] = []): MeshBVHHit[] {
        const src = MeshBVH._source(geometry);
        const cull = cullCode(options?.cull);
        const near = options?.near ?? 0, far = options?.far ?? Infinity;
        const P = src.pos.data, ps = src.pos.stride, po = src.pos.offset, I = src.indices;
        const ox = origin.x, oy = origin.y, oz = origin.z, dx = direction.x, dy = direction.y, dz = direction.z;
        const first = out.length;
        for (const r of src.ranges) {
            for (let tri = r.start, e = r.start + r.count; tri < e; tri++) {
                const k = tri * 3;
                const a = I ? I[k] : k, b = I ? I[k + 1] : k + 1, c = I ? I[k + 2] : k + 2;
                const t = rayTri(P, a * ps + po, b * ps + po, c * ps + po, ox, oy, oz, dx, dy, dz, cull);
                if (t > EPS_T && t >= near && t <= far) out.push(MeshBVH._fill(newHit(), src, tri, t, _u, _v, _det, ox, oy, oz, dx, dy, dz));
            }
        }
        MeshBVH._sortFrom(out, first, src);
        return out;
    }

    /** Number of triangles indexed. */
    public readonly triCount: number;
    /** Number of BVH nodes (interior + leaf). */
    public nodeCount: number = 0;
    /** Deepest leaf level (root = 0). */
    public depth: number = 0;
    /** The geometry this tree was built for. */
    public readonly geometry: GeometryBase;

    private readonly _src: TriSource;
    private readonly _pos: MeshAttributeView;
    /** Index array the tree reads (a generated sequence for non-indexed geometry). */
    private readonly _indices: ArrayLike<number>;
    /** The geometry's own index array (null when non-indexed), for change detection. */
    private readonly _srcIndices: ArrayLike<number> | null;
    private readonly _srcTriCount: number;
    private _version: number;
    /** Per-node [minX, minY, minZ, maxX, maxY, maxZ]. */
    private _bounds: Float32Array;
    /**
     * Per-node [a, b]: leaf → a = first slot in `_triOrder`, b = triangle
     * count (≥1); interior → a = left child index, b = 0 (right = a + 1).
     * Children always have larger indices than their parent.
     */
    private _info: Uint32Array;
    /** Triangle indices (into the index buffer) grouped per leaf. */
    private _triOrder: Uint32Array;
    private readonly _maxLeafTris: number;
    private _stack: Int32Array;

    private constructor(geometry: GeometryBase, maxLeafTris: number) {
        this.geometry = geometry;
        const src = MeshBVH._source(geometry);
        this._src = src;
        this._pos = src.pos;
        this._srcIndices = src.indices;
        this._srcTriCount = src.triCount;
        if (src.indices) {
            this._indices = src.indices;
        } else {
            const n = src.triCount * 3;
            const seq = new Uint32Array(n);
            for (let i = 0; i < n; i++) seq[i] = i;
            this._indices = seq;
        }
        let count = 0;
        for (const r of src.ranges) count += r.count;
        this.triCount = count;
        this._maxLeafTris = Math.max(1, maxLeafTris | 0);
        this._version = geometry.version;
        this._build();
    }

    /** Triangle source of a geometry: positions, indices and LOD-0 sub-geometry ranges. */
    private static _source(geometry: GeometryBase): TriSource {
        const pos = MeshBVH.getAttributeView(geometry, VertexAttributeName.position);
        if (!pos) throw new Error('MeshBVH: geometry has no position attribute');
        const idx = geometry.getAttribute(VertexAttributeName.indices);
        const indices = idx && idx.data && idx.data.length > 0 ? idx.data as ArrayLike<number> : null;
        const triCount = indices ? (indices.length / 3) | 0 : (((pos.data.length - pos.offset) / pos.stride) / 3) | 0;
        const ranges: TriRange[] = [];
        const subs = geometry.subGeometries;
        if (indices && subs && subs.length > 0) {
            for (let i = 0; i < subs.length; i++) {
                const lod = subs[i].lodLevels && subs[i].lodLevels[0];
                if (!lod) continue;
                const start = Math.min(triCount, Math.floor(lod.indexStart / 3));
                const count = Math.min(triCount - start, Math.floor(lod.indexCount / 3));
                if (count > 0) ranges.push({ start, count, sub: i });
            }
        }
        if (ranges.length === 0 && triCount > 0) ranges.push({ start: 0, count: triCount, sub: 0 });
        return { pos, indices, ranges, triCount };
    }

    // ------------------------------------------------------------------ build

    private _build(): void {
        const n = this.triCount;
        const P = this._pos.data, ps = this._pos.stride, po = this._pos.offset, I = this._indices;

        // Local slot → triangle index.
        const tris = new Uint32Array(n);
        let k = 0;
        for (const r of this._src.ranges) for (let t = r.start, e = r.start + r.count; t < e; t++) tris[k++] = t;

        // Per-triangle AABB + centroid, computed once.
        const triMin = new Float32Array(n * 3), triMax = new Float32Array(n * 3), cen = new Float32Array(n * 3);
        for (let s = 0; s < n; s++) {
            const t = tris[s];
            const a = I[t * 3] * ps + po, b = I[t * 3 + 1] * ps + po, c = I[t * 3 + 2] * ps + po;
            for (let j = 0; j < 3; j++) {
                const pa = P[a + j], pb = P[b + j], pc = P[c + j];
                const mn = pa < pb ? (pa < pc ? pa : pc) : (pb < pc ? pb : pc);
                const mx = pa > pb ? (pa > pc ? pa : pc) : (pb > pc ? pb : pc);
                triMin[s * 3 + j] = mn;
                triMax[s * 3 + j] = mx;
                cen[s * 3 + j] = (mn + mx) * 0.5;
            }
        }

        const order = new Uint32Array(n);
        for (let i = 0; i < n; i++) order[i] = i;

        // Upper bound on node count for a binary tree with ≥1 tri per leaf.
        const maxNodes = Math.max(1, 2 * n - 1);
        const bounds = new Float32Array(maxNodes * 6);
        const info = new Uint32Array(maxNodes * 2);
        let nodeCount = 0;
        let depth = 0;

        if (n > 0) {
            // Iterative build with an explicit work stack: [nodeIndex, start, end, level].
            const work: number[] = [];
            const root = nodeCount++;
            work.push(root, 0, n, 0);

            while (work.length) {
                const level = work.pop()!, end = work.pop()!, start = work.pop()!, node = work.pop()!;
                if (level > depth) depth = level;

                // Node bounds + centroid bounds over [start, end).
                let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
                let cmnx = Infinity, cmny = Infinity, cmnz = Infinity, cmxx = -Infinity, cmxy = -Infinity, cmxz = -Infinity;
                for (let i = start; i < end; i++) {
                    const t = order[i] * 3;
                    if (triMin[t] < mnx) mnx = triMin[t]; if (triMax[t] > mxx) mxx = triMax[t];
                    if (triMin[t + 1] < mny) mny = triMin[t + 1]; if (triMax[t + 1] > mxy) mxy = triMax[t + 1];
                    if (triMin[t + 2] < mnz) mnz = triMin[t + 2]; if (triMax[t + 2] > mxz) mxz = triMax[t + 2];
                    const cx = cen[t], cy = cen[t + 1], cz = cen[t + 2];
                    if (cx < cmnx) cmnx = cx; if (cx > cmxx) cmxx = cx;
                    if (cy < cmny) cmny = cy; if (cy > cmxy) cmxy = cy;
                    if (cz < cmnz) cmnz = cz; if (cz > cmxz) cmxz = cz;
                }
                const b = node * 6;
                bounds[b] = mnx; bounds[b + 1] = mny; bounds[b + 2] = mnz;
                bounds[b + 3] = mxx; bounds[b + 4] = mxy; bounds[b + 5] = mxz;

                const count = end - start;
                const ex = cmxx - cmnx, ey = cmxy - cmny, ez = cmxz - cmnz;
                if (count <= this._maxLeafTris || (ex === 0 && ey === 0 && ez === 0)) {
                    info[node * 2] = start;
                    info[node * 2 + 1] = count;
                    continue;
                }

                // Split on the longest centroid axis at the centroid-bounds midpoint.
                const axis = ex >= ey && ex >= ez ? 0 : (ey >= ez ? 1 : 2);
                const split = axis === 0 ? (cmnx + cmxx) * 0.5 : axis === 1 ? (cmny + cmxy) * 0.5 : (cmnz + cmxz) * 0.5;
                let mid = MeshBVH._partition(order, cen, start, end, axis, split);
                if (mid === start || mid === end) {
                    // Degenerate (all centroids on one side): median split by count.
                    mid = (start + end) >>> 1;
                    MeshBVH._nthElement(order, cen, start, end, mid, axis);
                }

                const left = nodeCount, right = nodeCount + 1;
                nodeCount += 2;
                info[node * 2] = left;
                info[node * 2 + 1] = 0;
                work.push(right, mid, end, level + 1);
                work.push(left, start, mid, level + 1);
            }
        }

        this.nodeCount = nodeCount;
        this.depth = depth;
        this._bounds = bounds.subarray(0, nodeCount * 6);
        this._info = info.subarray(0, nodeCount * 2);
        // Leaves reference triangle indices directly from here on.
        for (let i = 0; i < n; i++) order[i] = tris[order[i]];
        this._triOrder = order;
        // DFS keeps at most one pending sibling per level, plus the node in hand.
        this._stack = new Int32Array(depth + 2);
    }

    /** Hoare-style partition of `order[start,end)` by centroid[axis] < split. Returns first index of the right side. */
    private static _partition(order: Uint32Array, cen: Float32Array, start: number, end: number, axis: number, split: number): number {
        let i = start, j = end - 1;
        while (i <= j) {
            if (cen[order[i] * 3 + axis] < split) { i++; continue; }
            const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
            j--;
        }
        return i;
    }

    /** Quickselect so that order[k] is the k-th smallest by centroid[axis] and sides are partitioned around it. */
    private static _nthElement(order: Uint32Array, cen: Float32Array, start: number, end: number, k: number, axis: number): void {
        let lo = start, hi = end - 1;
        while (lo < hi) {
            const pivot = cen[order[(lo + hi) >>> 1] * 3 + axis];
            let i = lo, j = hi;
            while (i <= j) {
                while (cen[order[i] * 3 + axis] < pivot) i++;
                while (cen[order[j] * 3 + axis] > pivot) j--;
                if (i <= j) { const t = order[i]; order[i] = order[j]; order[j] = t; i++; j--; }
            }
            if (k <= j) hi = j; else if (k >= i) lo = i; else break;
        }
    }

    /**
     * Recompute node bounds from the current vertex positions, keeping the
     * tree topology. Cheap (O(n)); use after moving vertices in place. Large
     * deformations make the tree slower but never wrong; rebuild with
     * `MeshBVH.build` if queries degrade.
     */
    public refit(): void {
        const B = this._bounds, N = this._info, order = this._triOrder;
        const P = this._pos.data, ps = this._pos.stride, po = this._pos.offset, I = this._indices;
        // Children have larger indices than their parent: walk backwards.
        for (let node = this.nodeCount - 1; node >= 0; node--) {
            const b = node * 6, a = N[node * 2], cnt = N[node * 2 + 1];
            let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
            if (cnt > 0) {
                for (let i = a, e = a + cnt; i < e; i++) {
                    const t = order[i] * 3;
                    for (let j = 0; j < 3; j++) {
                        const p = I[t + j] * ps + po;
                        const x = P[p], y = P[p + 1], z = P[p + 2];
                        if (x < mnx) mnx = x; if (x > mxx) mxx = x;
                        if (y < mny) mny = y; if (y > mxy) mxy = y;
                        if (z < mnz) mnz = z; if (z > mxz) mxz = z;
                    }
                }
            } else {
                const l = a * 6, r = (a + 1) * 6;
                mnx = Math.min(B[l], B[r]); mny = Math.min(B[l + 1], B[r + 1]); mnz = Math.min(B[l + 2], B[r + 2]);
                mxx = Math.max(B[l + 3], B[r + 3]); mxy = Math.max(B[l + 4], B[r + 4]); mxz = Math.max(B[l + 5], B[r + 5]);
            }
            B[b] = mnx; B[b + 1] = mny; B[b + 2] = mnz;
            B[b + 3] = mxx; B[b + 4] = mxy; B[b + 5] = mxz;
        }
        this._version = this.geometry.version;
    }

    // ---------------------------------------------------------------- queries

    /**
     * Closest hit along a ray (local space). `null` on miss.
     * @param origin ray origin
     * @param direction ray direction (normalized for `t` to be a distance)
     * @param options culling and near/far limits
     * @param target object to write the result into (a new one by default)
     */
    public raycast(origin: Vector3, direction: Vector3, options?: MeshBVHRayOptions, target?: MeshBVHHit): MeshBVHHit | null {
        if (this.nodeCount === 0) return null;
        const cull = cullCode(options?.cull);
        const near = options?.near ?? 0;
        let best = options?.far ?? Infinity, bestTri = -1, bu = 0, bv = 0, bdet = 0;
        const ox = origin.x, oy = origin.y, oz = origin.z;
        const dx = direction.x, dy = direction.y, dz = direction.z;
        const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
        const B = this._bounds, N = this._info, order = this._triOrder;
        const P = this._pos.data, ps = this._pos.stride, po = this._pos.offset, I = this._indices;
        const stack = this._stack;
        let sp = 0;
        stack[sp++] = 0;
        while (sp > 0) {
            const node = stack[--sp];
            const b = node * 6;
            // Slab test against [near, current best].
            let t0 = ((ix >= 0 ? B[b] : B[b + 3]) - ox) * ix;
            let t1 = ((ix >= 0 ? B[b + 3] : B[b]) - ox) * ix;
            const ty0 = ((iy >= 0 ? B[b + 1] : B[b + 4]) - oy) * iy;
            const ty1 = ((iy >= 0 ? B[b + 4] : B[b + 1]) - oy) * iy;
            if (t0 > ty1 || ty0 > t1) continue;
            if (ty0 > t0) t0 = ty0;
            if (ty1 < t1) t1 = ty1;
            const tz0 = ((iz >= 0 ? B[b + 2] : B[b + 5]) - oz) * iz;
            const tz1 = ((iz >= 0 ? B[b + 5] : B[b + 2]) - oz) * iz;
            if (t0 > tz1 || tz0 > t1) continue;
            if (tz0 > t0) t0 = tz0;
            if (tz1 < t1) t1 = tz1;
            if (t1 < near || t0 > best) continue;

            const a = N[node * 2], cnt = N[node * 2 + 1];
            if (cnt > 0) {
                for (let i = a, e = a + cnt; i < e; i++) {
                    const tri = order[i], k = tri * 3;
                    const t = rayTri(P, I[k] * ps + po, I[k + 1] * ps + po, I[k + 2] * ps + po, ox, oy, oz, dx, dy, dz, cull);
                    if (t > EPS_T && t >= near && t < best) { best = t; bestTri = tri; bu = _u; bv = _v; bdet = _det; }
                }
            } else {
                // Visit the child nearer along the dominant axis first so the
                // best-t pruning kicks in early.
                const axis = MeshBVH._longestAxis(B, a * 6, (a + 1) * 6);
                const dirNeg = axis === 0 ? dx < 0 : axis === 1 ? dy < 0 : dz < 0;
                if (dirNeg) { stack[sp++] = a; stack[sp++] = a + 1; }
                else { stack[sp++] = a + 1; stack[sp++] = a; }
            }
        }
        if (bestTri < 0) return null;
        return MeshBVH._fill(target || newHit(), this._src, bestTri, best, bu, bv, bdet, ox, oy, oz, dx, dy, dz);
    }

    /**
     * Every hit along a ray (local space), sorted by distance. Each result is
     * a new object appended to `out`. A crossing through an edge or vertex
     * shared by several triangles is reported once.
     */
    public raycastAll(origin: Vector3, direction: Vector3, options?: MeshBVHRayOptions, out: MeshBVHHit[] = []): MeshBVHHit[] {
        if (this.nodeCount === 0) return out;
        const cull = cullCode(options?.cull);
        const near = options?.near ?? 0, far = options?.far ?? Infinity;
        const ox = origin.x, oy = origin.y, oz = origin.z;
        const dx = direction.x, dy = direction.y, dz = direction.z;
        const first = out.length;
        this._traverse(ox, oy, oz, dx, dy, dz, near, far, (tri, k) => {
            const P = this._pos.data, ps = this._pos.stride, po = this._pos.offset, I = this._indices;
            const t = rayTri(P, I[k] * ps + po, I[k + 1] * ps + po, I[k + 2] * ps + po, ox, oy, oz, dx, dy, dz, cull);
            if (t > EPS_T && t >= near && t <= far) out.push(MeshBVH._fill(newHit(), this._src, tri, t, _u, _v, _det, ox, oy, oz, dx, dy, dz));
            return false;
        });
        MeshBVH._sortFrom(out, first, this._src);
        return out;
    }

    /** Whether the ray hits any triangle; stops at the first one found. */
    public intersectsRay(origin: Vector3, direction: Vector3, options?: MeshBVHRayOptions): boolean {
        if (this.nodeCount === 0) return false;
        const cull = cullCode(options?.cull);
        const near = options?.near ?? 0, far = options?.far ?? Infinity;
        const ox = origin.x, oy = origin.y, oz = origin.z;
        const dx = direction.x, dy = direction.y, dz = direction.z;
        const P = this._pos.data, ps = this._pos.stride, po = this._pos.offset, I = this._indices;
        return this._traverse(ox, oy, oz, dx, dy, dz, near, far, (_tri, k) => {
            const t = rayTri(P, I[k] * ps + po, I[k + 1] * ps + po, I[k + 2] * ps + po, ox, oy, oz, dx, dy, dz, cull);
            return t > EPS_T && t >= near && t <= far;
        });
    }

    /**
     * Brute-force closest hit over this tree's triangles. O(n); exists to
     * validate the tree in tests and benchmarks.
     */
    public raycastBruteForce(origin: Vector3, direction: Vector3, options?: MeshBVHRayOptions, target?: MeshBVHHit): MeshBVHHit | null {
        return MeshBVH.raycastGeometry(this.geometry, origin, direction, options, target);
    }

    /** Local-space AABB of the whole mesh (root node bounds). */
    public getRootBounds(outMin: Vector3, outMax: Vector3): void {
        const B = this._bounds;
        if (this.nodeCount === 0) { outMin.set(0, 0, 0); outMax.set(0, 0, 0); return; }
        outMin.set(B[0], B[1], B[2]);
        outMax.set(B[3], B[4], B[5]);
    }

    /** Vertex indices of a triangle. */
    public getTriangle(triIndex: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
        out[0] = this._indices[triIndex * 3];
        out[1] = this._indices[triIndex * 3 + 1];
        out[2] = this._indices[triIndex * 3 + 2];
        return out;
    }

    /** Sub-geometry index of a triangle (0 when the geometry has a single range). */
    public getSubGeometryIndex(triIndex: number): number {
        return MeshBVH._subOf(this._src.ranges, triIndex);
    }

    /**
     * Visit candidate triangles whose node boxes overlap [near, far] along
     * the ray; `visit` returning true stops the walk (and makes this return true).
     */
    private _traverse(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, near: number, far: number,
        visit: (tri: number, k: number) => boolean): boolean {
        const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
        const B = this._bounds, N = this._info, order = this._triOrder;
        const stack = this._stack;
        let sp = 0;
        stack[sp++] = 0;
        while (sp > 0) {
            const node = stack[--sp];
            const b = node * 6;
            let t0 = ((ix >= 0 ? B[b] : B[b + 3]) - ox) * ix;
            let t1 = ((ix >= 0 ? B[b + 3] : B[b]) - ox) * ix;
            const ty0 = ((iy >= 0 ? B[b + 1] : B[b + 4]) - oy) * iy;
            const ty1 = ((iy >= 0 ? B[b + 4] : B[b + 1]) - oy) * iy;
            if (t0 > ty1 || ty0 > t1) continue;
            if (ty0 > t0) t0 = ty0;
            if (ty1 < t1) t1 = ty1;
            const tz0 = ((iz >= 0 ? B[b + 2] : B[b + 5]) - oz) * iz;
            const tz1 = ((iz >= 0 ? B[b + 5] : B[b + 2]) - oz) * iz;
            if (t0 > tz1 || tz0 > t1) continue;
            if (tz0 > t0) t0 = tz0;
            if (tz1 < t1) t1 = tz1;
            if (t1 < near || t0 > far) continue;

            const a = N[node * 2], cnt = N[node * 2 + 1];
            if (cnt > 0) {
                for (let i = a, e = a + cnt; i < e; i++) {
                    const tri = order[i];
                    if (visit(tri, tri * 3)) return true;
                }
            } else {
                stack[sp++] = a + 1;
                stack[sp++] = a;
            }
        }
        return false;
    }

    private static _subOf(ranges: TriRange[], tri: number): number {
        for (let i = 0; i < ranges.length; i++) {
            const r = ranges[i];
            if (tri >= r.start && tri < r.start + r.count) return r.sub;
        }
        return 0;
    }

    private static _fill(hit: MeshBVHHit, src: TriSource, tri: number, t: number, u: number, v: number, det: number,
        ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): MeshBVHHit {
        hit.t = t; hit.triIndex = tri; hit.u = u; hit.v = v;
        hit.frontFace = det > 0;
        hit.subGeometryIndex = MeshBVH._subOf(src.ranges, tri);
        hit.point.set(ox + dx * t, oy + dy * t, oz + dz * t);
        const P = src.pos.data, ps = src.pos.stride, po = src.pos.offset, I = src.indices;
        const k = tri * 3;
        const a = (I ? I[k] : k) * ps + po, b = (I ? I[k + 1] : k + 1) * ps + po, c = (I ? I[k + 2] : k + 2) * ps + po;
        const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2];
        const e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
        const n = hit.faceNormal;
        n.set(e1y * e2z - e1z * e2y, e1z * e2x - e1x * e2z, e1x * e2y - e1y * e2x);
        const l = n.length;
        if (l > 0) n.multiplyScalar(1 / l);
        return hit;
    }

    /**
     * Sort `out[first..]` by distance and drop repeats of the same crossing:
     * a ray through an edge or vertex shared by several triangles hits each
     * of them at the same t (on the same side).
     */
    private static _sortFrom(out: MeshBVHHit[], first: number, src: TriSource): void {
        if (out.length - first < 2) return;
        const tail = out.splice(first).sort((x, y) => x.t - y.t);
        let prev: MeshBVHHit = null;
        for (const h of tail) {
            if (prev && h.frontFace === prev.frontFace && h.t - prev.t <= 1e-7 * Math.max(1, prev.t)
                && MeshBVH._shareVertex(src, h.triIndex, prev.triIndex)) continue;
            out.push(h);
            prev = h;
        }
    }

    /** Whether two triangles share a vertex (by index, or by position for unwelded meshes). */
    private static _shareVertex(src: TriSource, ta: number, tb: number): boolean {
        const I = src.indices, P = src.pos.data, ps = src.pos.stride, po = src.pos.offset;
        for (let i = 0; i < 3; i++) {
            const a = I ? I[ta * 3 + i] : ta * 3 + i;
            for (let j = 0; j < 3; j++) {
                const b = I ? I[tb * 3 + j] : tb * 3 + j;
                if (a === b) return true;
                const pa = a * ps + po, pb = b * ps + po;
                if (P[pa] === P[pb] && P[pa + 1] === P[pb + 1] && P[pa + 2] === P[pb + 2]) return true;
            }
        }
        return false;
    }

    private static _longestAxis(B: Float32Array, l: number, r: number): number {
        // Extent of the union of both children along each axis.
        const ex = Math.max(B[l + 3], B[r + 3]) - Math.min(B[l], B[r]);
        const ey = Math.max(B[l + 4], B[r + 4]) - Math.min(B[l + 1], B[r + 1]);
        const ez = Math.max(B[l + 5], B[r + 5]) - Math.min(B[l + 2], B[r + 2]);
        return ex >= ey && ex >= ez ? 0 : (ey >= ez ? 1 : 2);
    }
}

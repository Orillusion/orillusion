import { GeometryBase } from '../../geometry/GeometryBase';
import { VertexAttributeName } from '../../geometry/VertexAttributeName';
import { Vector3 } from '../../../math/Vector3';

/**
 * Result of a `MeshBVH` ray query. All values are in the geometry's local
 * space; `t` is the distance along the (normalized) ray direction.
 * @group Core
 */
export interface MeshBVHHit {
    /** Distance along the ray. */
    t: number;
    /** Triangle index (i.e. `indices[triIndex*3 .. +2]`). */
    triIndex: number;
    /** Barycentric weight of vertex 1 (v0 gets `1-u-v`). */
    u: number;
    /** Barycentric weight of vertex 2. */
    v: number;
    /** Hit point in local space. */
    point: Vector3;
    /** Geometric (face) normal in local space, unit length, facing the ray origin side is NOT enforced. */
    faceNormal: Vector3;
}

/**
 * Bounding-volume hierarchy over the triangles of a `GeometryBase`, for fast
 * CPU ray queries (picking, placement, line-of-sight). Built once per
 * geometry and cached in a `WeakMap`; brute-force scanning every triangle
 * is O(n) per ray, the BVH is O(log n).
 *
 * Nodes are stored flat in typed arrays (6 floats of bounds + 2 uints per
 * node) so traversal allocates nothing. Leaves hold up to `maxLeafTris`
 * triangles; interior nodes split on the longest centroid axis at the
 * centroid mean, falling back to a median split when one side is empty.
 *
 * ```ts
 * const bvh = MeshBVH.get(meshRenderer.geometry);
 * const hit = bvh.raycast(localOrigin, localDirection);
 * ```
 * @group Core
 */
export class MeshBVH {
    private static _cache: WeakMap<GeometryBase, MeshBVH> = new WeakMap();

    /** Build (or fetch the cached) BVH for a geometry. */
    public static get(geometry: GeometryBase, maxLeafTris: number = 8): MeshBVH {
        let bvh = MeshBVH._cache.get(geometry);
        if (!bvh) {
            bvh = new MeshBVH(geometry, maxLeafTris);
            MeshBVH._cache.set(geometry, bvh);
        }
        return bvh;
    }

    /** Drop the cached BVH (call after rewriting the geometry's vertices/indices). */
    public static invalidate(geometry: GeometryBase): void {
        MeshBVH._cache.delete(geometry);
    }

    /** Whether a BVH has already been built for this geometry. */
    public static has(geometry: GeometryBase): boolean {
        return MeshBVH._cache.has(geometry);
    }

    /** Number of triangles indexed. */
    public readonly triCount: number;
    /** Number of BVH nodes (interior + leaf). */
    public nodeCount: number = 0;
    /** Deepest leaf level (root = 0). */
    public depth: number = 0;

    private readonly _positions: Float32Array | Float64Array;
    private readonly _indices: ArrayLike<number>;
    /** Per-node [minX, minY, minZ, maxX, maxY, maxZ]. */
    private _bounds: Float32Array;
    /**
     * Per-node [a, b]: leaf → a = first slot in `_triOrder`, b = triangle
     * count (≥1); interior → a = left child index, b = 0 (right = a + 1).
     */
    private _info: Uint32Array;
    /** Triangle indices grouped per leaf. */
    private _triOrder: Uint32Array;
    private readonly _maxLeafTris: number;

    // Scratch (traversal allocates nothing).
    private static _stack: Int32Array = new Int32Array(128);
    private static _hit: MeshBVHHit = { t: 0, triIndex: -1, u: 0, v: 0, point: new Vector3(), faceNormal: new Vector3() };

    private constructor(geometry: GeometryBase, maxLeafTris: number) {
        const pos = geometry.getAttribute(VertexAttributeName.position);
        const idx = geometry.getAttribute(VertexAttributeName.indices);
        if (!pos || !pos.data) throw new Error('MeshBVH: geometry has no position attribute');
        this._positions = pos.data as Float32Array;
        if (idx && idx.data && idx.data.length > 0) {
            this._indices = idx.data as ArrayLike<number>;
        } else {
            // Non-indexed: every 3 consecutive vertices form a triangle.
            const n = (this._positions.length / 3) | 0;
            const seq = new Uint32Array(n);
            for (let i = 0; i < n; i++) seq[i] = i;
            this._indices = seq;
        }
        this.triCount = (this._indices.length / 3) | 0;
        this._maxLeafTris = Math.max(1, maxLeafTris | 0);
        this._build();
    }

    // ------------------------------------------------------------------ build

    private _build(): void {
        const n = this.triCount;
        const P = this._positions, I = this._indices;

        // Per-triangle AABB + centroid, computed once.
        const triMin = new Float32Array(n * 3), triMax = new Float32Array(n * 3), cen = new Float32Array(n * 3);
        for (let t = 0; t < n; t++) {
            const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
            for (let k = 0; k < 3; k++) {
                const pa = P[a + k], pb = P[b + k], pc = P[c + k];
                const mn = pa < pb ? (pa < pc ? pa : pc) : (pb < pc ? pb : pc);
                const mx = pa > pb ? (pa > pc ? pa : pc) : (pb > pc ? pb : pc);
                triMin[t * 3 + k] = mn;
                triMax[t * 3 + k] = mx;
                cen[t * 3 + k] = (mn + mx) * 0.5;
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

            // Split on the longest centroid axis at the centroid mean.
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

        this.nodeCount = nodeCount;
        this.depth = depth;
        this._bounds = bounds.subarray(0, nodeCount * 6);
        this._info = info.subarray(0, nodeCount * 2);
        this._triOrder = order;
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

    // ---------------------------------------------------------------- queries

    /**
     * Closest hit along a ray (local space). Returns a shared, reused hit
     * object — copy what you need before the next query. `null` on miss.
     * @param origin ray origin
     * @param direction ray direction (normalized for `t` to be a distance)
     * @param backfaceCulling skip triangles facing away from the ray
     * @param maxT ignore hits farther than this
     */
    public raycast(origin: Vector3, direction: Vector3, backfaceCulling: boolean = false, maxT: number = Infinity): MeshBVHHit | null {
        const hit = MeshBVH._hit;
        hit.triIndex = -1;
        hit.t = maxT;
        const ox = origin.x, oy = origin.y, oz = origin.z;
        const dx = direction.x, dy = direction.y, dz = direction.z;
        const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
        const B = this._bounds, N = this._info;
        const stack = MeshBVH._stack;
        let sp = 0;
        stack[sp++] = 0;
        while (sp > 0) {
            const node = stack[--sp];
            const b = node * 6;
            // Slab test against current best t.
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
            if (t1 < 0 || t0 > hit.t) continue;

            const a = N[node * 2], cnt = N[node * 2 + 1];
            if (cnt > 0) {
                for (let i = a, e = a + cnt; i < e; i++) {
                    this._intersectTri(this._triOrder[i], ox, oy, oz, dx, dy, dz, backfaceCulling, hit);
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
        if (hit.triIndex < 0) return null;
        hit.point.set(ox + dx * hit.t, oy + dy * hit.t, oz + dz * hit.t);
        this._faceNormal(hit.triIndex, hit.faceNormal);
        return hit;
    }

    /** Whether the ray hits any triangle (early-out, no closest search). */
    public intersectsRay(origin: Vector3, direction: Vector3, maxT: number = Infinity): boolean {
        // A closest-hit query with maxT is already cheap thanks to pruning;
        // keep one code path.
        return this.raycast(origin, direction, false, maxT) !== null;
    }

    /**
     * Brute-force closest hit over every triangle. O(n); exists to validate
     * the tree in tests and benchmarks, and as a reference for edge cases.
     */
    public raycastBruteForce(origin: Vector3, direction: Vector3, backfaceCulling: boolean = false, maxT: number = Infinity): MeshBVHHit | null {
        const hit = MeshBVH._hit;
        hit.triIndex = -1;
        hit.t = maxT;
        for (let t = 0; t < this.triCount; t++) {
            this._intersectTri(t, origin.x, origin.y, origin.z, direction.x, direction.y, direction.z, backfaceCulling, hit);
        }
        if (hit.triIndex < 0) return null;
        hit.point.set(origin.x + direction.x * hit.t, origin.y + direction.y * hit.t, origin.z + direction.z * hit.t);
        this._faceNormal(hit.triIndex, hit.faceNormal);
        return hit;
    }

    /** Local-space AABB of the whole mesh (root node bounds). */
    public getRootBounds(outMin: Vector3, outMax: Vector3): void {
        const B = this._bounds;
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

    // Möller–Trumbore, writes into `hit` only when closer than hit.t.
    private _intersectTri(tri: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cull: boolean, hit: MeshBVHHit): void {
        const P = this._positions, I = this._indices;
        const a = I[tri * 3] * 3, b = I[tri * 3 + 1] * 3, c = I[tri * 3 + 2] * 3;
        const ax = P[a], ay = P[a + 1], az = P[a + 2];
        const e1x = P[b] - ax, e1y = P[b + 1] - ay, e1z = P[b + 2] - az;
        const e2x = P[c] - ax, e2y = P[c + 1] - ay, e2z = P[c + 2] - az;
        // p = d × e2
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (cull) { if (det < 1e-12) return; }
        else if (det > -1e-12 && det < 1e-12) return;
        const inv = 1 / det;
        const tx = ox - ax, ty = oy - ay, tz = oz - az;
        const u = (tx * px + ty * py + tz * pz) * inv;
        if (u < 0 || u > 1) return;
        // q = t × e1
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
        const v = (dx * qx + dy * qy + dz * qz) * inv;
        if (v < 0 || u + v > 1) return;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (t <= 1e-7 || t >= hit.t) return;
        hit.t = t; hit.u = u; hit.v = v; hit.triIndex = tri;
    }

    private _faceNormal(tri: number, out: Vector3): void {
        const P = this._positions, I = this._indices;
        const a = I[tri * 3] * 3, b = I[tri * 3 + 1] * 3, c = I[tri * 3 + 2] * 3;
        const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2];
        const e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
        out.set(e1y * e2z - e1z * e2y, e1z * e2x - e1x * e2z, e1x * e2y - e1y * e2x);
        const l = out.length;
        if (l > 0) out.multiplyScalar(1 / l);
    }

    private static _longestAxis(B: Float32Array, l: number, r: number): number {
        // Extent of the union of both children along each axis.
        const ex = Math.max(B[l + 3], B[r + 3]) - Math.min(B[l], B[r]);
        const ey = Math.max(B[l + 4], B[r + 4]) - Math.min(B[l + 1], B[r + 1]);
        const ez = Math.max(B[l + 5], B[r + 5]) - Math.min(B[l + 2], B[r + 2]);
        return ex >= ey && ex >= ez ? 0 : (ey >= ez ? 1 : 2);
    }
}

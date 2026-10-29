import { FluidUniforms_wgsl } from './FluidParticle_shader';

/**
 * Per-particle ellipsoids from the neighbor distribution (Yu & Turk 2013).
 *
 * Neighbor search uses a hashed uniform grid with cell size equal to the
 * search radius, rebuilt every frame:
 *   clearCells → countCells → scanBlocks → scanBlockSums → addBlockOffsets → scatter
 * which yields the positions sorted by hash bucket, so the neighbor loop
 * reads contiguous memory.
 *
 * computeEllipsoids then gathers neighbors within the radius with weight
 * 1 - (d / R)^3, moves the particle toward their weighted mean (Laplacian
 * smoothing) and takes the eigen decomposition of their weighted
 * covariance. The axes keep the particle volume, with the shortest axis
 * at least 1 / maxRatio of the longest; particles with few neighbors stay
 * spheres.
 *
 * Output per particle (4 × vec4f): smoothed center, then the three
 * semi-axes scaled to their radius, in the particles' local space.
 *
 * Params layout (bytes):
 *   0  count, stride (floats), position offset (floats), table size : u32
 *   16 cell size, search radius, particle radius, max axis ratio     : f32
 *   32 min neighbors, smoothing                                       : f32
 * @internal
 */
export let FluidAnisotropy_wgsl: string = /*wgsl*/ `
struct AnisoParams {
    count: u32,
    stride: u32,
    offset: u32,
    tableSize: u32,
    cellSize: f32,
    radius: f32,
    particleRadius: f32,
    maxRatio: f32,
    minNeighbors: f32,
    smoothing: f32,
    pad0: f32,
    pad1: f32,
};

@group(0) @binding(0) var<uniform> P: AnisoParams;
@group(0) @binding(1) var<storage, read_write> particles: array<f32>;
@group(0) @binding(2) var<storage, read_write> cellCount: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> cellStart: array<u32>;
@group(0) @binding(4) var<storage, read_write> blockSums: array<u32>;
// x = hash bucket, y = rank inside the bucket.
@group(0) @binding(5) var<storage, read_write> particleCell: array<vec2u>;
@group(0) @binding(6) var<storage, read_write> sortedPos: array<vec4f>;
@group(0) @binding(7) var<storage, read_write> ellipsoids: array<vec4f>;

const SCAN_BLOCK: u32 = 1024u;

fn position(i: u32) -> vec3f {
    let b = i * P.stride + P.offset;
    return vec3f(particles[b], particles[b + 1u], particles[b + 2u]);
}

fn cellOf(p: vec3f) -> vec3i {
    return vec3i(floor(p / P.cellSize));
}

fn hashCell(c: vec3i) -> u32 {
    let h = (bitcast<u32>(c.x) * 73856093u) ^ (bitcast<u32>(c.y) * 19349663u) ^ (bitcast<u32>(c.z) * 83492791u);
    return h & (P.tableSize - 1u);
}

@compute @workgroup_size(256)
fn clearCells(@builtin(global_invocation_id) id: vec3u) {
    if (id.x < P.tableSize) {
        atomicStore(&cellCount[id.x], 0u);
    }
}

@compute @workgroup_size(256)
fn countCells(@builtin(global_invocation_id) id: vec3u) {
    if (id.x >= P.count) {
        return;
    }
    let h = hashCell(cellOf(position(id.x)));
    particleCell[id.x] = vec2u(h, atomicAdd(&cellCount[h], 1u));
}

var<workgroup> scanShared: array<u32, 256>;

// Inclusive prefix sum of one value per invocation across the workgroup.
fn scanWorkgroup(lid: u32, value: u32) -> u32 {
    scanShared[lid] = value;
    workgroupBarrier();
    for (var offset = 1u; offset < 256u; offset <<= 1u) {
        var add = 0u;
        if (lid >= offset) {
            add = scanShared[lid - offset];
        }
        workgroupBarrier();
        scanShared[lid] += add;
        workgroupBarrier();
    }
    return scanShared[lid];
}

// Exclusive scan of cellCount into cellStart, per block of SCAN_BLOCK buckets.
@compute @workgroup_size(256)
fn scanBlocks(@builtin(local_invocation_id) lid: vec3u, @builtin(workgroup_id) wid: vec3u) {
    let base = wid.x * SCAN_BLOCK + lid.x * 4u;
    var v = vec4u(0u);
    for (var k = 0u; k < 4u; k++) {
        if (base + k < P.tableSize) {
            v[k] = atomicLoad(&cellCount[base + k]);
        }
    }
    let local = v.x + v.y + v.z + v.w;
    let inclusive = scanWorkgroup(lid.x, local);
    var run = inclusive - local;
    for (var k = 0u; k < 4u; k++) {
        if (base + k < P.tableSize) {
            cellStart[base + k] = run;
        }
        run += v[k];
    }
    if (lid.x == 255u) {
        blockSums[wid.x] = inclusive;
    }
}

// Exclusive scan of the block totals in place (one workgroup, up to SCAN_BLOCK blocks).
@compute @workgroup_size(256)
fn scanBlockSums(@builtin(local_invocation_id) lid: vec3u) {
    let blocks = (P.tableSize + SCAN_BLOCK - 1u) / SCAN_BLOCK;
    let base = lid.x * 4u;
    var v = vec4u(0u);
    for (var k = 0u; k < 4u; k++) {
        if (base + k < blocks) {
            v[k] = blockSums[base + k];
        }
    }
    let local = v.x + v.y + v.z + v.w;
    let inclusive = scanWorkgroup(lid.x, local);
    var run = inclusive - local;
    for (var k = 0u; k < 4u; k++) {
        if (base + k < blocks) {
            blockSums[base + k] = run;
        }
        run += v[k];
    }
}

@compute @workgroup_size(256)
fn addBlockOffsets(@builtin(global_invocation_id) id: vec3u) {
    if (id.x < P.tableSize) {
        cellStart[id.x] += blockSums[id.x / SCAN_BLOCK];
    }
}

@compute @workgroup_size(256)
fn scatter(@builtin(global_invocation_id) id: vec3u) {
    if (id.x >= P.count) {
        return;
    }
    let c = particleCell[id.x];
    sortedPos[cellStart[c.x] + c.y] = vec4f(position(id.x), 0.0);
}

// Eigen decomposition of a symmetric 3x3 matrix by cyclic Jacobi rotations.
// Returns eigenvalues; eigenvectors are written as the columns of vecs.
fn eigenSymmetric(m: mat3x3f, vecs: ptr<function, mat3x3f>) -> vec3f {
    var a = m;
    var v = mat3x3f(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
    for (var sweep = 0; sweep < 6; sweep++) {
        for (var k = 0; k < 3; k++) {
            let p = select(0, 1, k == 2);
            let q = select(2, 1, k == 0);
            let apq = a[q][p];
            if (abs(apq) < 1e-12) {
                continue;
            }
            let theta = (a[q][q] - a[p][p]) / (2.0 * apq);
            let t = select(1.0, -1.0, theta < 0.0) / (abs(theta) + sqrt(theta * theta + 1.0));
            let c = inverseSqrt(t * t + 1.0);
            let s = t * c;
            var j = mat3x3f(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
            j[p][p] = c;
            j[q][q] = c;
            j[q][p] = s;
            j[p][q] = -s;
            a = transpose(j) * a * j;
            v = v * j;
        }
    }
    *vecs = v;
    return vec3f(a[0][0], a[1][1], a[2][2]);
}

@compute @workgroup_size(128)
fn computeEllipsoids(@builtin(global_invocation_id) id: vec3u) {
    let i = id.x;
    if (i >= P.count) {
        return;
    }
    let pi = position(i);
    let ci = cellOf(pi);

    var wsum = 0.0;
    var n = 0.0;
    var s1 = vec3f(0.0);
    var sxx = 0.0; var sxy = 0.0; var sxz = 0.0;
    var syy = 0.0; var syz = 0.0; var szz = 0.0;
    for (var dz = -1; dz <= 1; dz++) {
        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                let cell = ci + vec3i(dx, dy, dz);
                let h = hashCell(cell);
                let start = cellStart[h];
                let count = atomicLoad(&cellCount[h]);
                for (var k = 0u; k < count; k++) {
                    let pj = sortedPos[start + k].xyz;
                    // Skip other cells that share this hash bucket.
                    if (any(cellOf(pj) != cell)) {
                        continue;
                    }
                    let r = pj - pi;
                    let d = length(r);
                    if (d >= P.radius) {
                        continue;
                    }
                    let q = d / P.radius;
                    let w = 1.0 - q * q * q;
                    wsum += w;
                    n += 1.0;
                    s1 += w * r;
                    sxx += w * r.x * r.x; sxy += w * r.x * r.y; sxz += w * r.x * r.z;
                    syy += w * r.y * r.y; syz += w * r.y * r.z; szz += w * r.z * r.z;
                }
            }
        }
    }

    // wsum >= 1: the particle itself is always found.
    let mean = s1 / wsum;
    let center = pi + P.smoothing * mean;
    let pr = P.particleRadius;
    var a1 = vec3f(pr, 0.0, 0.0);
    var a2 = vec3f(0.0, pr, 0.0);
    var a3 = vec3f(0.0, 0.0, pr);

    if (n >= P.minNeighbors) {
        let cov = mat3x3f(
            sxx / wsum - mean.x * mean.x, sxy / wsum - mean.x * mean.y, sxz / wsum - mean.x * mean.z,
            sxy / wsum - mean.x * mean.y, syy / wsum - mean.y * mean.y, syz / wsum - mean.y * mean.z,
            sxz / wsum - mean.x * mean.z, syz / wsum - mean.y * mean.z, szz / wsum - mean.z * mean.z,
        );
        var vecs: mat3x3f;
        let vals = eigenSymmetric(cov, &vecs);
        // Spread along each axis (standard deviation), longest first.
        var sd = sqrt(max(vals, vec3f(0.0)));
        var e0 = vecs[0];
        var e1 = vecs[1];
        var e2 = vecs[2];
        if (sd.y > sd.x) { let t = sd.x; sd.x = sd.y; sd.y = t; let tv = e0; e0 = e1; e1 = tv; }
        if (sd.z > sd.x) { let t = sd.x; sd.x = sd.z; sd.z = t; let tv = e0; e0 = e2; e2 = tv; }
        if (sd.z > sd.y) { let t = sd.y; sd.y = sd.z; sd.z = t; let tv = e1; e1 = e2; e2 = tv; }
        if (sd.x > 1e-8) {
            sd = max(sd, vec3f(sd.x / P.maxRatio));
            // Keep the volume of a sphere of the particle radius.
            let scale = pr / pow(sd.x * sd.y * sd.z, 1.0 / 3.0);
            a1 = normalize(e0) * sd.x * scale;
            a2 = normalize(e1) * sd.y * scale;
            a3 = normalize(e2) * sd.z * scale;
        }
    }

    ellipsoids[i * 4u] = vec4f(center, 1.0);
    ellipsoids[i * 4u + 1u] = vec4f(a1, 0.0);
    ellipsoids[i * 4u + 2u] = vec4f(a2, 0.0);
    ellipsoids[i * 4u + 3u] = vec4f(a3, 0.0);
}
`;

/**
 * Ellipsoid splatting: same stages as FluidParticle_wgsl, but each particle
 * is the ellipsoid from FluidAnisotropy_wgsl. The quad covers the longest
 * semi-axis; the fragment shader intersects the view ray with the
 * ellipsoid.
 * - fsDepth: linear view-space depth of the nearest hit (negated when hidden by the scene).
 * - fsThickness: chord length, normalized so a sphere's center gives the thickness alpha.
 * - fsBackDepth: far hit, clamped to the opaque scene (see FluidParticle_wgsl).
 * @internal
 */
export let FluidEllipsoid_wgsl: string = /*wgsl*/ `
${FluidUniforms_wgsl}

@group(0) @binding(0) var<uniform> u: FluidUniforms;
@group(0) @binding(1) var<storage, read> ellipsoids: array<vec4f>;
@group(0) @binding(2) var sceneDepth: texture_depth_2d;

struct VOut {
    @builtin(position) pos: vec4f,
    @location(0) viewPos: vec3f,
    @location(1) @interpolate(flat) center: vec3f,
    @location(2) @interpolate(flat) a1: vec3f,
    @location(3) @interpolate(flat) a2: vec3f,
    @location(4) @interpolate(flat) a3: vec3f,
};

struct DepthOut {
    @location(0) depth: f32,
    @builtin(frag_depth) fragDepth: f32,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
    var corners = array<vec2f, 6>(
        vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0),
    );
    let base = ii * 4u;
    let center = (u.modelView * vec4f(ellipsoids[base].xyz, 1.0)).xyz;
    let a1 = (u.modelView * vec4f(ellipsoids[base + 1u].xyz, 0.0)).xyz;
    let a2 = (u.modelView * vec4f(ellipsoids[base + 2u].xyz, 0.0)).xyz;
    let a3 = (u.modelView * vec4f(ellipsoids[base + 3u].xyz, 0.0)).xyz;
    let extent = max(length(a1), max(length(a2), length(a3)));
    let p = center + vec3f(corners[vi] * extent, 0.0);

    var out: VOut;
    out.pos = u.proj * vec4f(p, 1.0);
    out.viewPos = p;
    out.center = center;
    out.a1 = a1;
    out.a2 = a2;
    out.a3 = a3;
    return out;
}

// Ray from the camera through this fragment against the ellipsoid; returns (near, far) or (-1, -1).
fn hitEllipsoid(in: VOut) -> vec2f {
    let dir = normalize(in.viewPos);
    // Rows of the inverse of [a1 a2 a3]: the axes are orthogonal.
    let q1 = in.a1 / dot(in.a1, in.a1);
    let q2 = in.a2 / dot(in.a2, in.a2);
    let q3 = in.a3 / dot(in.a3, in.a3);
    let o = vec3f(dot(q1, -in.center), dot(q2, -in.center), dot(q3, -in.center));
    let d = vec3f(dot(q1, dir), dot(q2, dir), dot(q3, dir));
    let a = dot(d, d);
    let b = dot(o, d);
    let c = dot(o, o) - 1.0;
    let disc = b * b - a * c;
    if (disc < 0.0) {
        return vec2f(-1.0);
    }
    let s = sqrt(disc);
    return vec2f((-b - s) / a, (-b + s) / a);
}

fn sceneViewZ(fragXY: vec2f, mapSize: vec2f) -> f32 {
    let dim = vec2f(textureDimensions(sceneDepth));
    let p = vec2i(fragXY * dim / mapSize);
    let d = textureLoad(sceneDepth, p, 0);
    #if USE_LOGDEPTH
        return pow(u.camera.y + 1.0, d) - 1.0;
    #else
        let v = u.projInv * vec4f(0.0, 0.0, d, 1.0);
        return v.z / v.w;
    #endif
}

@fragment
fn fsDepth(in: VOut) -> DepthOut {
    let t = hitEllipsoid(in);
    if (t.y <= 0.0) {
        discard;
    }
    let viewPos = normalize(in.viewPos) * max(t.x, 0.0);
    // Hidden by the scene: stored negated, see FluidParticle_wgsl.
    let hidden = viewPos.z > sceneViewZ(in.pos.xy, u.size.xy);
    let clip = u.proj * vec4f(viewPos, 1.0);
    var out: DepthOut;
    out.depth = select(viewPos.z, -viewPos.z, hidden);
    out.fragDepth = clip.z / clip.w;
    return out;
}

@fragment
fn fsThickness(in: VOut) -> @location(0) f32 {
    let t = hitEllipsoid(in);
    if (t.y <= 0.0) {
        discard;
    }
    let near = max(t.x, 0.0);
    if ((normalize(in.viewPos) * near).z > sceneViewZ(in.pos.xy, u.thickSize.xy)) {
        discard;
    }
    return u.particle.w * (t.y - near) / (2.0 * u.particle.x);
}

@fragment
fn fsBackDepth(in: VOut) -> DepthOut {
    let t = hitEllipsoid(in);
    if (t.y <= 0.0) {
        discard;
    }
    let dir = normalize(in.viewPos);
    let sceneZ = sceneViewZ(in.pos.xy, u.size.xy);
    if ((dir * max(t.x, 0.0)).z > sceneZ) {
        discard;
    }
    var far = dir * t.y;
    if (far.z > sceneZ) {
        far = far * (sceneZ / far.z);
    }
    let clip = u.proj * vec4f(far, 1.0);
    var out: DepthOut;
    out.depth = far.z;
    out.fragDepth = clamp(clip.z / clip.w, 0.0, 1.0);
    return out;
}
`;

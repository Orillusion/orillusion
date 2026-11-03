import { test, expect, end } from '../util'
import { BoundingBox, BoundingSphere, BoxGeometry, Engine3D, GeometryBase, GeometryVertexType, Matrix4, MeshBVH, MeshColliderShape, Quaternion, Ray, SphereGeometry, Vector3, VertexAttributeName } from '@orillusion/core';

await Engine3D.init();

// Deterministic PRNG so failures reproduce.
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const randomDir = () => new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();

/** Quads facing +z at the given z values, one sub-geometry each. */
function quadStack(zs: number[], half = 1): GeometryBase {
    const geo = new GeometryBase();
    const pos: number[] = [], idx: number[] = [];
    zs.forEach((z, i) => {
        const b = i * 4;
        pos.push(-half, -half, z, half, -half, z, half, half, z, -half, half, z);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    geo.setAttribute(VertexAttributeName.position, new Float32Array(pos));
    geo.setIndices(new Uint32Array(idx));
    zs.forEach((_, i) => geo.addSubGeometry({ indexStart: i * 6, indexCount: 6, vertexStart: 0, vertexCount: 0, firstStart: 0, index: i, topology: 0 }));
    return geo;
}

await test('build stats: every triangle indexed, tree is balanced-ish', async () => {
    const geo = new SphereGeometry(1, 64, 64);
    const bvh = MeshBVH.get(geo);
    expect(bvh.triCount).tobe(geo.getAttribute('indices').data.length / 3);
    expect(bvh.nodeCount > bvh.triCount / 8).tobe(true);       // more nodes than leaves-at-capacity
    expect(bvh.depth < 40).tobe(true);                          // log2(8192)=13, midpoint split can be deeper but not pathological
    expect(MeshBVH.get(geo) === bvh).tobe(true);                // cached
    MeshBVH.invalidate(geo);
    expect(MeshBVH.has(geo)).tobe(false);
})

await test('500 random rays: BVH closest hit == brute force', async () => {
    const geo = new SphereGeometry(2, 96, 96);
    const bvh = MeshBVH.get(geo);
    let hits = 0, misses = 0;
    for (let i = 0; i < 500; i++) {
        const o = randomDir().multiplyScalar(6);
        const aim = new Vector3(rnd() * 5 - 2.5, rnd() * 5 - 2.5, rnd() * 5 - 2.5);   // some rays miss the r=2 sphere
        const d = new Vector3(aim.x - o.x, aim.y - o.y, aim.z - o.z).normalize();
        const a = bvh.raycast(o, d);
        const at = a ? a.t : -1;
        const b = bvh.raycastBruteForce(o, d);
        const bt = b ? b.t : -1;
        // A shared edge can legitimately report either triangle, so compare t.
        expect(at).toSubequal(bt, 1e-5);
        if (a) hits++; else misses++;
        // Any-hit agrees with closest-hit.
        expect(bvh.intersectsRay(o, d)).tobe(a != null);
    }
    expect(hits > 200 && misses > 50).tobe(true);
})

await test('closest hit is the front face; culling, near/far and inside-out rays', async () => {
    const geo = new SphereGeometry(1, 32, 32);
    const bvh = MeshBVH.get(geo);
    const o = new Vector3(0, 0, 5), d = new Vector3(0, 0, -1);
    const h = bvh.raycast(o, d);
    expect(h != null).tobe(true);
    expect(h.t).toSubequal(4, 2e-2);                             // r=1 tessellated: slightly inside the true sphere
    expect(h.point.z).toSubequal(1, 2e-2);
    expect(h.faceNormal.z > 0.9).tobe(true);                     // outward facing
    expect(h.frontFace).tobe(true);
    // Back-face culling keeps the front face; front-face culling skips it and finds the inside of the far side.
    expect(bvh.raycast(o, d, { cull: 'back' }).t).toSubequal(4, 2e-2);
    expect(bvh.raycast(o, d, { cull: true }).t).toSubequal(4, 2e-2);
    const far = bvh.raycast(o, d, { cull: 'front' });
    expect(far.t).toSubequal(6, 2e-2);
    expect(far.frontFace).tobe(false);
    // From inside: nearest surface is a back face → culled away, visible otherwise.
    const inside = new Vector3(0, 0, 0);
    expect(bvh.raycast(inside, d, { cull: 'back' })).tobe(null);
    expect(bvh.raycast(inside, d).t).toSubequal(1, 2e-2);
    // far below the surface → miss; near past the first surface → the far side.
    expect(bvh.raycast(o, d, { far: 3.5 })).tobe(null);
    expect(bvh.raycast(o, d, { near: 5 }).t).toSubequal(6, 2e-2);
    expect(bvh.intersectsRay(o, d, { far: 3.5 })).tobe(false);
    // Away from the mesh → miss.
    expect(bvh.raycast(o, new Vector3(0, 0, 1))).tobe(null);
    // Results are fresh objects unless a target is passed.
    const h2 = bvh.raycast(o, d);
    expect(h2 !== h).tobe(true);
    const tgt = bvh.raycast(new Vector3(0, 0, -5), new Vector3(0, 0, 1), undefined, h2);
    expect(tgt === h2).tobe(true);
    expect(h.point.z).toSubequal(1, 2e-2);
})

await test('raycastAll returns every crossing sorted; tree-less queries match the tree', async () => {
    const geo = new SphereGeometry(1, 32, 32);
    const o = new Vector3(0.1, 0.05, 5), d = new Vector3(0, 0, -1);
    // No tree yet: the static queries must not build one.
    const noTree = MeshBVH.raycastGeometry(geo, o, d);
    const noTreeAll = MeshBVH.raycastGeometryAll(geo, o, d);
    expect(MeshBVH.has(geo)).tobe(false);
    const bvh = MeshBVH.get(geo);
    const all = bvh.raycastAll(o, d);
    expect(all.length).tobe(2);
    expect(all[0].t < all[1].t).tobe(true);
    expect(all[0].frontFace).tobe(true);
    expect(all[1].frontFace).tobe(false);
    expect(all[0].t).toSubequal(bvh.raycast(o, d).t, 1e-9);
    expect(noTree.t).toSubequal(all[0].t, 1e-9);
    expect(noTreeAll.length).tobe(2);
    expect(noTreeAll[1].t).toSubequal(all[1].t, 1e-9);
    expect(bvh.raycastAll(o, d, { cull: 'back' }).length).tobe(1);
    expect(bvh.raycastAll(o, d, { far: 5 }).length).tobe(1);
    // Appends to `out` without disturbing earlier entries.
    const out = [all[1]];
    bvh.raycastAll(o, d, undefined, out);
    expect(out.length).tobe(3);
    expect(out[0] === all[1]).tobe(true);
    // A ray along the shared diagonal of a quad crosses it once, not once per triangle.
    const quad = new GeometryBase();
    quad.setAttribute(VertexAttributeName.position, new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]));
    quad.setIndices(new Uint16Array([0, 1, 2, 0, 2, 3]));
    const diag = new Vector3(0.25, 0.25, 4);
    expect(MeshBVH.get(quad).raycastAll(diag, d).length).tobe(1);
    expect(MeshBVH.raycastGeometryAll(quad, diag, d).length).tobe(1);
})

await test('non-indexed geometry builds and hits', async () => {
    // Two triangles forming the quad z=0, [-1,1]², no index buffer.
    const geo = new GeometryBase();
    geo.setAttribute(VertexAttributeName.position, new Float32Array([
        -1, -1, 0, 1, -1, 0, 1, 1, 0,
        -1, -1, 0, 1, 1, 0, -1, 1, 0,
    ]));
    const bvh = MeshBVH.get(geo);
    expect(bvh.triCount).tobe(2);
    const h = bvh.raycast(new Vector3(-0.5, 0.5, 3), new Vector3(0, 0, -1));
    expect(h.t).toSubequal(3, 1e-6);
    expect(h.triIndex).tobe(1);
    expect(bvh.getTriangle(1)[2]).tobe(5);
    expect(MeshBVH.raycastGeometry(geo, new Vector3(0.5, -0.5, 3), new Vector3(0, 0, -1)).triIndex).tobe(0);
    // Indexed cube.
    const box = MeshBVH.get(new BoxGeometry(2, 2, 2));
    expect(box.triCount).tobe(12);
    const hb = box.raycast(new Vector3(0.3, 0.2, 10), new Vector3(0, 0, -1));
    expect(hb.t).toSubequal(9, 1e-5);
    expect(hb.faceNormal.z).toSubequal(1, 1e-6);
})

await test('compose_bin (interleaved prefab) geometry: positions and attributes read from the packed buffer', async () => {
    // [pos3, normal3, uv2] per vertex, quad at z = 2.
    const v = (x: number, y: number, u: number, w: number) => [x, y, 2, 0, 0, 1, u, w];
    const data = new Float32Array([...v(-1, -1, 0, 0), ...v(1, -1, 1, 0), ...v(1, 1, 1, 1), ...v(-1, 1, 0, 1)]);
    const geo = new GeometryBase();
    geo.vertexDim = 8;
    geo.geometryType = GeometryVertexType.compose_bin;
    geo.setIndices(new Uint16Array([0, 1, 2, 0, 2, 3]));
    geo.setAttribute(VertexAttributeName.all, data);
    geo.vertexBuffer.setComposeBinLayout([
        { name: 'position', format: 'float32x3', offset: 0, shaderLocation: 0, stride: 3 },
        { name: 'normal', format: 'float32x3', offset: 12, shaderLocation: 1, stride: 3 },
        { name: 'uv', format: 'float32x2', offset: 24, shaderLocation: 2, stride: 2 },
    ] as any);
    const uv = MeshBVH.getAttributeView(geo, VertexAttributeName.uv);
    expect(uv.stride).tobe(8);
    expect(uv.offset).tobe(6);
    expect(MeshBVH.getAttributeView(geo, VertexAttributeName.TEXCOORD_1)).tobe(null);
    const h = MeshBVH.get(geo).raycast(new Vector3(0.5, 0.25, 10), new Vector3(0, 0, -1));
    expect(h.t).toSubequal(8, 1e-6);
    expect(h.point.x).toSubequal(0.5, 1e-6);
})

await test('sub-geometries: hits report their sub-geometry, only LOD 0 is indexed', async () => {
    const geo = quadStack([0, -2, 5]);
    // Third quad (z=5) becomes LOD 1 of sub-geometry 0, so it is never drawn at LOD 0.
    geo.subGeometries.length = 2;
    geo.subGeometries[0].lodLevels.push({ indexStart: 12, indexCount: 6, vertexStart: 0, vertexCount: 0, firstStart: 0, index: 0, topology: 0 });
    const bvh = MeshBVH.get(geo);
    expect(bvh.triCount).tobe(4);
    const o = new Vector3(0.2, 0.3, 10), d = new Vector3(0, 0, -1);
    const all = bvh.raycastAll(o, d);
    expect(all.length).tobe(2);                                 // z=5 quad skipped
    expect(all[0].subGeometryIndex).tobe(0);
    expect(all[1].subGeometryIndex).tobe(1);
    expect(bvh.getSubGeometryIndex(all[1].triIndex)).tobe(1);
    expect(MeshBVH.raycastGeometryAll(geo, o, d).length).tobe(2);
})

await test('cache follows GeometryBase.version: upload refits, replaced arrays rebuild', async () => {
    const geo = quadStack([0]);
    const bvh = MeshBVH.get(geo);
    const o = new Vector3(0, 0, 10), d = new Vector3(0, 0, -1);
    expect(bvh.raycast(o, d).t).toSubequal(10, 1e-6);
    // Move the quad to z=3 in place and re-upload (what dynamic meshes do).
    const posAttr = geo.getAttribute(VertexAttributeName.position);
    const p = posAttr.data as Float32Array;
    for (let i = 2; i < p.length; i += 3) p[i] = 3;
    const v0 = geo.version;
    geo.vertexBuffer.upload(VertexAttributeName.position, posAttr);
    expect(geo.version > v0).tobe(true);
    const again = MeshBVH.get(geo);
    expect(again === bvh).tobe(true);                           // refit, not rebuilt
    expect(again.raycast(o, d).t).toSubequal(7, 1e-6);
    // Moving it in place *without* an upload (here: sideways, out of the old
    // bounds) is invisible until refit().
    for (let i = 0; i < p.length; i += 3) p[i] += 5;
    const side = new Vector3(5.2, 0, 10);
    expect(MeshBVH.get(geo).raycast(side, d)).tobe(null);
    bvh.refit();
    expect(bvh.raycast(side, d).t).toSubequal(7, 1e-6);
    // Replacing the position array rebuilds.
    geo.setAttribute(VertexAttributeName.position, new Float32Array([-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1]));
    const rebuilt = MeshBVH.get(geo);
    expect(rebuilt !== bvh).tobe(true);
    expect(rebuilt.raycast(o, d).t).toSubequal(9, 1e-6);
})

await test('very deep trees do not overflow the traversal stack', async () => {
    // Planes x = 3^k: each midpoint split peels off only the largest plane,
    // so with one triangle per leaf the tree is n-1 levels deep (> 128).
    const n = 135;
    const pos: number[] = [];
    for (let k = 0; k < n; k++) { const x = Math.pow(3, k - 55); pos.push(x, 0, 0, x, 1, 0, x, 0, 1); }
    const geo = new GeometryBase();
    geo.setAttribute(VertexAttributeName.position, new Float32Array(pos));
    const bvh = MeshBVH.get(geo, 1);
    expect(bvh.depth > 128).tobe(true);
    // A ray along +x crosses every plane, including the deepest leaves.
    const o = new Vector3(-1, 0.2, 0.2), d = new Vector3(1, 0, 0);
    expect(bvh.raycastAll(o, d).length).tobe(n);
    expect(bvh.raycast(o, d).t).toSubequal(bvh.raycastBruteForce(o, d).t, 1e-9);
    // Coming from the far end, the closest plane is the shallowest one.
    const back = bvh.raycast(new Vector3(1e38, 0.2, 0.2), new Vector3(-1, 0, 0));
    expect(back.triIndex).tobe(n - 1);
})

await test('MeshColliderShape.rayPick: world-space distance/point/normal under scale + translation', async () => {
    const shape = new MeshColliderShape();
    shape.mesh = new SphereGeometry(1, 48, 48);
    const world = new Matrix4();
    world.compose(new Vector3(5, 0, 0), new Quaternion(), new Vector3(2, 2, 2));  // radius 2 at x=5
    const ray = new Ray();
    ray.origin.set(5, 0, 10);
    ray.direction.set(0, 0, -1);
    const hit = shape.rayPick(ray, world);
    expect(hit != null).tobe(true);
    expect(hit.distance).toSubequal(8, 5e-2);
    expect(hit.intersectPoint.x).toSubequal(5, 1e-3);
    expect(hit.intersectPoint.z).toSubequal(2, 5e-2);
    expect(hit.normal.z).toSubequal(1, 1e-2);
    // Nearest hit, not first-in-index-order: a ray from the other side hits the far pole.
    ray.origin.set(5, 0, -10); ray.direction.set(0, 0, 1);
    const back = shape.rayPick(ray, world);
    expect(back.intersectPoint.z).toSubequal(-2, 5e-2);
    expect(back.normal.z).toSubequal(-1, 1e-2);
    // Miss.
    ray.origin.set(50, 0, 10);
    expect(shape.rayPick(ray, world)).tobe(null);
})

await test('BoundingBox.intersectsRay and BoundingSphere.updateBound no longer throw', async () => {
    const box = new BoundingBox(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
    const ray = new Ray();
    ray.origin.set(0, 0, 5); ray.direction.set(0, 0, -1);
    const p = new Vector3();
    expect(box.intersectsRay(ray, p)).tobe(true);
    expect(p.z).toSubequal(1, 1e-6);
    ray.origin.set(5, 5, 5);
    expect(box.intersectsRay(ray, p)).tobe(false);

    const s = new BoundingSphere(new Vector3(1, 2, 3), 4);
    s.updateBound();
    expect(s.min.x).toSubequal(-3, 1e-6);
    expect(s.max.y).toSubequal(6, 1e-6);
    expect(s.size.z).toSubequal(8, 1e-6);
    expect(s.extents.x).toSubequal(4, 1e-6);
    s.setFromCenterAndSize(new Vector3(0, 0, 0), 1);
    expect(s.max.x).toSubequal(1, 1e-6);
})

await test('BVH is at least 5× faster than brute force on a 320k-tri mesh', async () => {
    const geo = new SphereGeometry(10, 400, 400);
    const t0 = performance.now();
    const bvh = MeshBVH.get(geo);
    const buildMs = performance.now() - t0;
    console.log(`[MeshBVH] build ${bvh.triCount} tris: ${buildMs.toFixed(1)} ms, ${bvh.nodeCount} nodes, depth ${bvh.depth}`);
    const N = 300;
    const os: Vector3[] = [], ds: Vector3[] = [];
    for (let i = 0; i < N; i++) { const o = randomDir().multiplyScalar(30); os.push(o); ds.push(new Vector3(-o.x, -o.y, -o.z).normalize()); }
    let t = performance.now();
    for (let i = 0; i < N; i++) bvh.raycast(os[i], ds[i]);
    const bvhMs = performance.now() - t;
    t = performance.now();
    for (let i = 0; i < N; i++) bvh.raycastBruteForce(os[i], ds[i]);
    const bruteMs = performance.now() - t;
    console.log(`[MeshBVH] ${N} rays: BVH ${bvhMs.toFixed(2)} ms, brute ${bruteMs.toFixed(2)} ms, ×${(bruteMs / bvhMs).toFixed(0)}`);
    expect(bruteMs / bvhMs > 5).tobe(true);
    expect(buildMs < 5000).tobe(true);
})

Engine3D.pause();
setTimeout(end, 500)

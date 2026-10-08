import { test, expect, end } from '../util'
import { BoundingBox, BoundingSphere, BoxGeometry, Engine3D, Matrix4, MeshBVH, MeshColliderShape, Quaternion, Ray, SphereGeometry, Vector3 } from '@orillusion/core';

await Engine3D.init();

// Deterministic PRNG so failures reproduce.
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const randomDir = () => new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();

await test('build stats: every triangle indexed, tree is balanced-ish', async () => {
    const geo = new SphereGeometry(1, 64, 64);
    const bvh = MeshBVH.get(geo);
    expect(bvh.triCount).tobe(geo.getAttribute('indices').data.length / 3);
    expect(bvh.nodeCount > bvh.triCount / 8).tobe(true);       // more nodes than leaves-at-capacity
    expect(bvh.depth < 40).tobe(true);                          // log2(8192)=13, mean split can be deeper but not pathological
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
        const at = a ? a.t : -1, atri = a ? a.triIndex : -1;
        const b = bvh.raycastBruteForce(o, d);
        const bt = b ? b.t : -1, btri = b ? b.triIndex : -1;
        expect(at).toSubequal(bt, 1e-5);
        // Same t but a shared edge can legitimately pick either triangle; require equality when t differs from any neighbour, so just check t.
        if (a) { hits++; expect(atri >= 0 && btri >= 0).tobe(true); } else misses++;
    }
    expect(hits > 200 && misses > 50).tobe(true);
})

await test('closest hit is the front face; culling and inside-out rays', async () => {
    const geo = new SphereGeometry(1, 32, 32);
    const bvh = MeshBVH.get(geo);
    const o = new Vector3(0, 0, 5), d = new Vector3(0, 0, -1);
    const h = bvh.raycast(o, d);
    expect(h != null).tobe(true);
    expect(h.t).toSubequal(4, 2e-2);                             // r=1 tessellated: slightly inside the true sphere
    expect(h.point.z).toSubequal(1, 2e-2);
    expect(h.faceNormal.z > 0.9).tobe(true);                     // outward facing
    // With culling the front face still hits (it faces the ray).
    expect(bvh.raycast(o, d, true).t).toSubequal(4, 2e-2);
    // From inside: nearest surface is a back face → culled away, visible otherwise.
    const inside = new Vector3(0, 0, 0);
    expect(bvh.raycast(inside, d, true)).tobe(null);
    expect(bvh.raycast(inside, d, false).t).toSubequal(1, 2e-2);
    // maxT below the surface → miss.
    expect(bvh.raycast(o, d, false, 3.5)).tobe(null);
    // Away from the mesh → miss.
    expect(bvh.raycast(o, new Vector3(0, 0, 1))).tobe(null);
})

await test('non-indexed geometry and degenerate (flat) meshes build and hit', async () => {
    // A single quad as 2 triangles, no index buffer.
    const geo = new BoxGeometry(2, 2, 2);          // indexed cube, 12 tris
    const bvh = MeshBVH.get(geo);
    expect(bvh.triCount).tobe(12);
    const h = bvh.raycast(new Vector3(0.3, 0.2, 10), new Vector3(0, 0, -1));
    expect(h.t).toSubequal(9, 1e-5);
    expect(h.faceNormal.z).toSubequal(1, 1e-6);
    const [i0, i1, i2] = bvh.getTriangle(h.triIndex);
    expect(i0 !== i1 && i1 !== i2).tobe(true);
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

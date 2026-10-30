import { test, expect, end } from '../util'
import {
    CameraUtil, Engine3D, GeometryBase, InstanceDrawComponent, LitMaterial, MeshBVH, MeshRenderer, Object3D, PlaneGeometry,
    Raycaster, Scene3D, SphereGeometry, Vector3, VertexAttributeName, View3D,
} from '@orillusion/core';

const engine = await Engine3D.init();

/**
 * Quads facing +z at the given z values (one sub-geometry each), with
 * normals and a uv that maps [-1,1]² → [0,1]².
 */
function quads(zs: number[]): GeometryBase {
    const geo = new GeometryBase();
    const pos: number[] = [], nrm: number[] = [], uv: number[] = [], idx: number[] = [];
    zs.forEach((z, i) => {
        const b = i * 4;
        pos.push(-1, -1, z, 1, -1, z, 1, 1, z, -1, 1, z);
        nrm.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
        uv.push(0, 0, 1, 0, 1, 1, 0, 1);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    geo.setAttribute(VertexAttributeName.position, new Float32Array(pos));
    geo.setAttribute(VertexAttributeName.normal, new Float32Array(nrm));
    geo.setAttribute(VertexAttributeName.uv, new Float32Array(uv));
    geo.setIndices(new Uint32Array(idx));
    zs.forEach((_, i) => geo.addSubGeometry({ indexStart: i * 6, indexCount: 6, vertexStart: 0, vertexCount: 0, firstStart: 0, index: i, topology: 0 }));
    return geo;
}

function mesh(geometry: GeometryBase, pos = new Vector3(), scale = new Vector3(1, 1, 1), name = ''): Object3D {
    const obj = new Object3D();
    obj.name = name;
    obj.localPosition = pos;
    obj.localScale = scale;
    const mr = obj.addComponent(MeshRenderer);
    mr.geometry = geometry;
    mr.material = new LitMaterial();
    return obj;
}

const down = (x = 0, y = 0, z = 10) => new Raycaster(new Vector3(x, y, z), new Vector3(0, 0, -1));

await test('hit data: point, distance, normals, faceIndex, barycentric, uv', async () => {
    const obj = mesh(quads([0]), new Vector3(0, 0, -2), new Vector3(2, 2, 2), 'quad');
    const hits = down(1, -1).intersectObject(obj);
    expect(hits.length).tobe(1);
    const h = hits[0];
    expect(h.object3D === obj).tobe(true);
    expect(h.renderer === obj.getComponent(MeshRenderer)).tobe(true);
    expect(h.distance).toSubequal(12, 1e-5);
    expect(h.point.x).toSubequal(1, 1e-5);
    expect(h.point.z).toSubequal(-2, 1e-5);
    expect(h.localPoint.x).toSubequal(0.5, 1e-5);
    expect(h.localPoint.y).toSubequal(-0.5, 1e-5);
    expect(h.uv.x).toSubequal(0.75, 1e-5);
    expect(h.uv.y).toSubequal(0.25, 1e-5);
    expect(h.uv1).tobe(null);
    expect(h.faceIndex).tobe(0);                                // lower-right triangle (0,1,2)
    expect(h.barycentric.x + h.barycentric.y + h.barycentric.z).toSubequal(1, 1e-6);
    expect(h.normal.z).toSubequal(1, 1e-6);
    expect(h.faceNormal.z).toSubequal(1, 1e-6);
    expect(h.frontFace).tobe(true);
    expect(h.subGeometryIndex).tobe(0);
    // PlaneGeometry (y-up) centre → uv (0.5, 0.5).
    const plane = mesh(new PlaneGeometry(4, 4));
    const ph = new Raycaster(new Vector3(0.001, 5, 0.001), new Vector3(0, -1, 0)).intersectObject(plane)[0];
    expect(ph.uv.x).toSubequal(0.5, 1e-3);
    expect(ph.uv.y).toSubequal(0.5, 1e-3);
})

await test('recursive traversal, sorting, near/far, layerMask and filter', async () => {
    const root = mesh(quads([0]), new Vector3(0, 0, 0), undefined, 'root');
    const a = mesh(quads([0]), new Vector3(0, 0, 3), undefined, 'a');
    const b = mesh(quads([0]), new Vector3(0, 0, -3), undefined, 'b');
    root.addChild(a);
    a.addChild(b);                                              // b at z = 0 in world (nested)
    const names = (hs: any[]) => hs.map(h => h.object3D.name).join(',');
    const rc = down();
    const hits = rc.intersectObject(root);
    expect(names(hits)).tobe('a,root,b');                       // sorted; a(z=3) then root and b (both z=0)
    expect(hits[0].distance).toSubequal(7, 1e-5);
    expect(names(rc.intersectObject(root, false))).tobe('root');
    rc.far = 9;
    expect(names(rc.intersectObject(root))).tobe('a');
    rc.far = Infinity; rc.near = 8;
    expect(names(rc.intersectObject(root)).startsWith('root')).tobe(true);
    rc.near = 0;
    a.getComponent(MeshRenderer).visibleLayer = 1 << 3;
    rc.layerMask = ~(1 << 3);
    expect(names(rc.intersectObject(root)).includes('a')).tobe(false);
    rc.layerMask = 0xFFFFFFFF;
    rc.filter = r => r.object3D.name !== 'root';
    expect(names(rc.intersectObject(root))).tobe('a,b');
    rc.filter = null;
    // intersectObjects over several roots; intersectFirst finds the same closest hit.
    const other = mesh(quads([0]), new Vector3(0, 0, 5), undefined, 'other');
    expect(names(rc.intersectObjects([root, other]))).tobe('other,a,root,b');
    expect(rc.intersectFirst([root, other]).object3D === other).tobe(true);
    expect(rc.intersectFirst(root).object3D === a).tobe(true);
    expect(down(5, 5).intersectFirst(root)).tobe(null);
})

await test('sides: material cull mode, explicit side, mirrored transforms', async () => {
    const sphere = mesh(new SphereGeometry(1, 32, 32));
    const mat = sphere.getComponent(MeshRenderer).material;
    const fromInside = new Raycaster(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
    // LitMaterial culls back faces: the inside of the sphere is invisible.
    expect(fromInside.intersectObject(sphere).length).tobe(0);
    fromInside.side = 'double';
    expect(fromInside.intersectObject(sphere).length).tobe(1);
    fromInside.side = 'back';
    expect(fromInside.intersectObject(sphere)[0].frontFace).tobe(false);
    fromInside.side = 'material';
    mat.cullMode = 'none';
    expect(fromInside.intersectObject(sphere).length).tobe(1);
    mat.cullMode = 'back';
    // All hits vs first hit only.
    const outside = down(0.1, 0.1);
    expect(outside.intersectObject(sphere).length).tobe(1); // far side is a back face
    outside.side = 'double';
    expect(outside.intersectObject(sphere).length).tobe(2);
    outside.firstHitOnly = true;
    expect(outside.intersectObject(sphere).length).tobe(1);
    // A mirroring transform reverses the winding the rasterizer sees (the
    // engine does not flip frontFace per object), so with back-face culling a
    // mirrored sphere shows its inner far side; 'material' picks what is drawn.
    const mirrored = mesh(new SphereGeometry(1, 32, 32), new Vector3(), new Vector3(-1, 1, 1));
    const mh = down(0.1, 0.1).intersectObject(mirrored);
    expect(mh.length).tobe(1);
    expect(mh[0].frontFace).tobe(true);
    expect(mh[0].point.z).toSubequal(-1, 2e-2);
    const md = down(0.1, 0.1);
    md.side = 'double';
    const both = md.intersectObject(mirrored);
    expect(both.length).tobe(2);
    expect(both[0].frontFace).tobe(false);                      // near side is a back face once mirrored
})

await test('per-sub-mesh materials: non-triangle and culled sub-meshes are skipped', async () => {
    const obj = mesh(quads([2, 0]));
    const mr = obj.getComponent(MeshRenderer);
    const lines = new LitMaterial();
    lines.topology = 'line-list';
    mr.materials = [lines, new LitMaterial()];
    const hits = down().intersectObject(obj);
    expect(hits.length).tobe(1);
    expect(hits[0].subGeometryIndex).tobe(1);
    // Closest-hit mode must also skip to the next valid hit, not report none.
    const rc = down();
    rc.firstHitOnly = true;
    expect(rc.intersectObject(obj)[0].subGeometryIndex).tobe(1);
    expect(rc.intersectFirst(obj).subGeometryIndex).tobe(1);
})

await test('BVH usage: auto uses an existing tree, never/auto do not build one', async () => {
    const geo = new SphereGeometry(1, 24, 24);
    const obj = mesh(geo);
    const rc = down(0.2, 0.1);
    rc.side = 'double';
    rc.useBVH = 'never';
    const brute = rc.intersectObject(obj);
    expect(MeshBVH.has(geo)).tobe(false);
    rc.useBVH = 'auto';
    const auto = rc.intersectObject(obj);
    expect(MeshBVH.has(geo)).tobe(false);
    rc.useBVH = 'always';
    const tree = rc.intersectObject(obj);
    expect(MeshBVH.has(geo)).tobe(true);
    expect(brute.length).tobe(2);
    for (let i = 0; i < 2; i++) {
        expect(auto[i].distance).toSubequal(brute[i].distance, 1e-9);
        expect(tree[i].distance).toSubequal(brute[i].distance, 1e-9);
        expect(tree[i].faceIndex).tobe(brute[i].faceIndex);
    }
})

await test('non-uniform scale: world distance and perpendicular normals', async () => {
    const obj = mesh(new SphereGeometry(1, 96, 96), new Vector3(0, 0, 0), new Vector3(4, 1, 1));
    const target = new Vector3(4 / Math.SQRT2, 1 / Math.SQRT2, 0);
    const h = new Raycaster(new Vector3(target.x, 10, 0), new Vector3(0, -1, 0)).intersectFirst(obj);
    expect(h.distance).toSubequal(10 - target.y, 2e-2);
    const g = new Vector3(h.point.x / 16, h.point.y, h.point.z).normalize();
    expect(h.normal.dotProduct(g)).toSubequal(1, 5e-3);
})

await test('instanced batches stay pickable; disabled renderers do not', async () => {
    const root = new Object3D();
    const child = mesh(quads([0]));
    root.addChild(child);
    child.getComponent(MeshRenderer).enable = false;
    expect(down().intersectObject(root).length).tobe(0);
    root.addComponent(InstanceDrawComponent);
    expect(down().intersectObject(root).length).tobe(1);
    expect(down().intersectObject(child).length).tobe(1);     // ancestor batch is found from a child root too
})

await test('setFromCamera / setFromCameraNDC aim through the same pixel', async () => {
    const view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
    const canvas = engine.context3D.canvas as HTMLCanvasElement;
    view.camera.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    view.camera.lookAt(new Vector3(3, 4, 12), new Vector3(0, 0, 0));
    const target = mesh(new SphereGeometry(1, 32, 32), new Vector3(0, 0, 0), undefined, 'target');
    view.scene.addChild(target);
    engine.startRenderView(view);
    await new Promise(r => setTimeout(r, 100));

    const s = view.camera.worldToScreenPoint(new Vector3(0, 0, 0), new Vector3());
    const a = new Raycaster().setFromCamera(view.camera, s.x, s.y);
    const ndcX = s.x / canvas.clientWidth * 2 - 1, ndcY = 1 - s.y / canvas.clientHeight * 2;
    const b = new Raycaster().setFromCameraNDC(view.camera, ndcX, ndcY);
    expect(a.ray.direction.dotProduct(b.ray.direction)).toSubequal(1, 1e-6);
    const ha = a.intersectFirst(view.scene), hb = b.intersectFirst(view.scene);
    expect(ha.object3D.name).tobe('target');
    expect(Vector3.distance(ha.point, hb.point)).toSubequal(0, 1e-3);
    // The ray through the sphere centre hits the surface facing the camera.
    const toCam = new Vector3(3, 4, 12).normalize();
    expect(ha.normal.dotProduct(toCam)).toSubequal(1, 2e-2);
})

Engine3D.pause();
setTimeout(end, 500)

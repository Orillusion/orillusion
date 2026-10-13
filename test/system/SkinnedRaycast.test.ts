import { test, expect, end, delay, waitUntil } from '../util'
import {
    AnimatorComponent, CameraUtil, ColliderComponent, DirectLight, Engine3D, GeometryBase, LitMaterial, MeshColliderShape, MeshDeformer,
    MeshRenderer, Object3D, Ray, Raycaster, Scene3D, SkinnedMeshRenderer2, Vector3, VertexAttributeName, View3D,
} from '@orillusion/core';

// Pixel picking reads the rendered G-buffer back: the GPU's own answer to
// "what surface is under this pixel", which the CPU raycast must reproduce.
const engine = await Engine3D.init({ setting: { pick: { enable: true, mode: 'pixel' } } });

const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
const canvas = engine.context3D.canvas as HTMLCanvasElement;
view.camera.perspective(45, canvas.clientWidth / canvas.clientHeight, 1, 5000);
const light = new Object3D();
light.rotationX = 45;
light.addComponent(DirectLight).intensity = 3;
view.scene.addChild(light);
engine.startRenderView(view);

/** GPU pick at a canvas pixel: waits until the read-back result is for this pixel. */
async function gpuPick(x: number, y: number): Promise<{ id: number, pos: Vector3 } | null> {
    const pc: any = (view.pickFire as any)._pickCompute;
    const buf = pc._outBuffer;
    const pr = (engine.context3D as any).pixelRatio || 1;
    engine.inputSystem.mouseX = x;
    engine.inputSystem.mouseY = y;
    for (let attempt = 0; attempt < 6; attempt++) {
        await delay(100);
        pc.compute(view);
        const ok = await waitUntil(() => {
            const a = buf.outFloat32Array;
            return a && Math.abs(a[2] - x * pr) < 0.5 && Math.abs(a[3] - y * pr) < 0.5;
        }, 3000);
        if (ok) return { id: pc.getPickMeshID(), pos: pc.getPickWorldPosition() };
    }
    return null;
}

/**
 * Pixels on the deformed surface (projected deformed vertices that the CPU
 * ray hits on `root`), spread over the mesh.
 */
function surfacePixels(root: Object3D, renderers: MeshRenderer[], count: number): { x: number, y: number }[] {
    const rc = new Raycaster();
    const out: { x: number, y: number }[] = [];
    const all: Vector3[] = [];
    for (const r of renderers) {
        const d = MeshDeformer.deform(r);
        const p = d.geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
        const m = d.worldSpace ? null : r.transform.worldMatrix;
        for (let i = 0; i < p.length; i += 3) {
            const v = new Vector3(p[i], p[i + 1], p[i + 2]);
            all.push(m ? m.transformPoint(v) : v);
        }
    }
    const step = Math.max(1, Math.floor(all.length / (count * 4)));
    for (let i = 0; i < all.length && out.length < count; i += step) {
        const s = view.camera.worldToScreenPoint(all[i], new Vector3());
        const x = Math.round(s.x) + 0.5, y = Math.round(s.y) + 0.5;
        if (x < 1 || y < 1 || x > canvas.clientWidth - 1 || y > canvas.clientHeight - 1) continue;
        if (rc.setFromCamera(view.camera, x, y).intersectFirst(root)) out.push({ x, y });
    }
    return out;
}

/** Compare CPU hits (as drawn and bind pose) with the GPU surface at `pixels`. */
async function compare(root: Object3D, renderers: MeshRenderer[], pixels: { x: number, y: number }[], tol: number) {
    const rc = new Raycaster();
    const ids = renderers.map(r => r.transform.worldMatrix.index);
    let samples = 0, cpuOk = 0, bindOk = 0;
    const rows: string[] = [];
    for (const { x, y } of pixels) {
        const g = await gpuPick(x, y);
        if (!g || !ids.includes(g.id)) continue;                // GPU sees something else (or nothing) there
        samples++;
        rc.setFromCamera(view.camera, x, y);
        rc.deformation = 'cpu';
        const c = rc.intersectFirst(root);
        rc.deformation = 'bindPose';
        const b = rc.intersectFirst(root);
        const dc = c ? Vector3.distance(c.point, g.pos) : Infinity, db = b ? Vector3.distance(b.point, g.pos) : Infinity;
        if (dc < tol) cpuOk++;
        if (db < tol) bindOk++;
        rows.push(`(${x},${y}) cpu ${dc.toFixed(3)} bind ${db.toFixed(3)}`);
    }
    console.log(rows.join('\n'));
    return { samples, cpuOk, bindOk };
}

await test('skinned glTF (Soldier, frozen mid-run): CPU-skinned hits land on the GPU-rendered surface', async () => {
    const soldier = await engine.res.loadGltf('gltfs/glb/Soldier.glb');
    soldier.scaleX = soldier.scaleY = soldier.scaleZ = 20;
    soldier.rotationY = 180;
    view.scene.addChild(soldier);
    view.camera.lookAt(new Vector3(25, 25, 80), new Vector3(0, 18, 0));
    const animator = soldier.getComponentsInChild(AnimatorComponent)[0];
    animator.playAnim('Run');
    await delay(2500);
    animator.timeScale = 0;                                    // freeze so CPU and G-buffer see the same pose
    await delay(1200);

    const renderers = soldier.getComponentsInChild(SkinnedMeshRenderer2);
    expect(renderers.length > 0 && renderers.every(r => MeshDeformer.isDeformed(r))).tobe(true);
    const pixels = surfacePixels(soldier, renderers, 10);
    const { samples, cpuOk, bindOk } = await compare(soldier, renderers, pixels, 0.3);   // the soldier is ~36 units tall
    console.log(`[skin] samples ${samples}, cpu ok ${cpuOk}, bind pose ok ${bindOk}`);
    expect(samples >= 6).tobe(true);
    expect(cpuOk >= samples - 1).tobe(true);                    // allow one silhouette-edge pixel
    expect(bindOk <= samples / 2).tobe(true);                   // the bind pose is visibly elsewhere

    // Unchanged pose → cached result, no recomputation.
    const v0 = MeshDeformer.deform(renderers[0]).geometry.version;
    const v1 = MeshDeformer.deform(renderers[0]).geometry.version;
    expect(v1).tobe(v0);
    // Resume: once a frame advances the pose, the next query recomputes.
    animator.timeScale = 1;
    const moved = await waitUntil(() => MeshDeformer.deform(renderers[0]).geometry.version > v0, 15000, 200);
    expect(!!moved).tobe(true);
    view.scene.removeChild(soldier);
})

await test('morph targets (glTF lion): CPU-morphed hits land on the GPU-rendered surface', async () => {
    const lion = await engine.res.loadGltf('gltfs/glb/lion.glb');
    view.scene.addChild(lion);
    const animator = lion.addComponent(AnimatorComponent);
    const targets = animator.cloneMorphRenderers();
    const keys = Object.keys(targets);
    expect(keys.length > 0).tobe(true);
    for (const key of keys) animator.updateBlendShape(['blendShape', 'blendShape', key], 'blendShape.blendShape.' + key, 1);
    const renderers = lion.getComponentsInChild(MeshRenderer).filter(r => r.morphData && r.morphData.enable);
    expect(renderers.length > 0 && renderers.every(r => MeshDeformer.isDeformed(r))).tobe(true);
    // Frame the morphed lion.
    const c = new Vector3(), lo = new Vector3(Infinity, Infinity, Infinity), hi = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const r of renderers) {
        const d = MeshDeformer.deform(r);
        const p = d.geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
        for (let i = 0; i < p.length; i += 3) {
            const v = r.transform.worldMatrix.transformPoint(new Vector3(p[i], p[i + 1], p[i + 2]));
            lo.set(Math.min(lo.x, v.x), Math.min(lo.y, v.y), Math.min(lo.z, v.z));
            hi.set(Math.max(hi.x, v.x), Math.max(hi.y, v.y), Math.max(hi.z, v.z));
        }
    }
    c.set((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, (lo.z + hi.z) / 2);
    const size = Vector3.distance(lo, hi);
    view.camera.lookAt(new Vector3(c.x + size * 0.3, c.y + size * 0.2, c.z + size * 1.1), c);
    await delay(1500);

    const pixels = surfacePixels(lion, renderers, 10);
    const { samples, cpuOk } = await compare(lion, renderers, pixels, size * 0.01);
    console.log(`[morph] size ${size.toFixed(1)}, samples ${samples}, cpu ok ${cpuOk}`);
    expect(samples >= 6).tobe(true);
    expect(cpuOk >= samples - 1).tobe(true);
    view.scene.removeChild(lion);
})

/** Quad z=0 over [-1,1]² with one morph target. */
function morphQuad(relative: boolean, target: number[]): Object3D {
    const geo = new GeometryBase();
    geo.setAttribute(VertexAttributeName.position, new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]));
    geo.setAttribute(VertexAttributeName.normal, new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]));
    geo.setAttribute(VertexAttributeName.uv, new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    geo.setAttribute(VertexAttributeName.vIndex, new Float32Array([0, 1, 2, 3]));
    geo.setAttribute('a_morphPositions_0', new Float32Array(target));
    geo.setIndices(new Uint16Array([0, 1, 2, 0, 2, 3]));
    geo.addSubGeometry({ indexStart: 0, indexCount: 6, vertexStart: 0, vertexCount: 4, firstStart: 0, index: 0, topology: 0 });
    geo.morphTargetDictionary = { up: 0 };
    geo.morphTargetsRelative = relative;
    const obj = new Object3D();
    const mr = obj.addComponent(MeshRenderer);
    mr.geometry = geo;
    mr.material = new LitMaterial();
    return obj;
}

await test('morph math: relative and absolute targets, bind-pose / skip modes, cache', async () => {
    const down = () => new Raycaster(new Vector3(0.3, 0.2, 10), new Vector3(0, 0, -1));
    // Relative: delta +2 in z at weight 0.5 → z = 1.
    const rel = morphQuad(true, [0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2]);
    const mr = rel.getComponent(MeshRenderer);
    expect(MeshDeformer.isDeformed(mr)).tobe(false);           // all weights 0 → nothing to deform
    expect(down().intersectFirst(rel).point.z).toSubequal(0, 1e-6);
    mr.setMorphInfluence('up', 0.5);
    expect(MeshDeformer.isDeformed(mr)).tobe(true);
    const h = down().intersectFirst(rel);
    expect(h.point.z).toSubequal(1, 1e-6);
    expect(h.uv.x).toSubequal(0.65, 1e-6);
    expect(h.localPoint.z).toSubequal(1, 1e-6);
    const bind = down(); bind.deformation = 'bindPose';
    expect(bind.intersectFirst(rel).point.z).toSubequal(0, 1e-6);
    const skip = down(); skip.deformation = 'skip';
    expect(skip.intersectFirst(rel)).tobe(null);
    // Cached until the weights change.
    const g = MeshDeformer.deform(mr).geometry, v = g.version;
    expect(MeshDeformer.deform(mr).geometry.version).tobe(v);
    mr.setMorphInfluence('up', 1);
    expect(MeshDeformer.deform(mr).geometry.version > v).tobe(true);
    expect(down().intersectFirst(rel).point.z).toSubequal(2, 1e-6);
    // Absolute: base weight 1 - 0.25, target at z = 4 → z = 1.
    const abs = morphQuad(false, [-1, -1, 4, 1, -1, 4, 1, 1, 4, -1, 1, 4]);
    abs.getComponent(MeshRenderer).setMorphInfluence('up', 0.25);
    expect(down().intersectFirst(abs).point.z).toSubequal(1, 1e-6);
})

await test('mesh colliders pick deformed meshes as drawn', async () => {
    const obj = morphQuad(true, [0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2]);
    obj.getComponent(MeshRenderer).setMorphInfluence('up', 0.5);
    const collider = obj.addComponent(ColliderComponent);
    const shape = new MeshColliderShape();
    collider.shape = shape;
    const ray = new Ray(new Vector3(0.3, 0.2, 10), new Vector3(0, 0, -1));
    expect(collider.rayPick(ray).intersectPoint.z).toSubequal(1, 1e-6);
    expect(shape.renderer === obj.getComponent(MeshRenderer)).tobe(true);
    shape.deformation = 'bindPose';
    expect(collider.rayPick(ray).intersectPoint.z).toSubequal(0, 1e-6);
})

Engine3D.pause();
setTimeout(end, 500)

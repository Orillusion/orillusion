import { test, expect, end, delay, waitUntil } from '../util'
import {
    AnimatorComponent, CameraUtil, ColliderComponent, DirectLight, Engine3D, GeometryBase, LitMaterial, Matrix4, MeshColliderShape, MeshDeformer,
    MeshRenderer, Object3D, PrefabAvatarData, PrefabBoneData, Quaternion, Ray, Raycaster, Scene3D, SkinnedMeshRenderer2, Vector3, VertexAttributeName, View3D,
} from '@orillusion/core';

// Pixel picking reads the rendered G-buffer back: the GPU's own answer to
// "what surface is under this pixel", which the CPU raycast must reproduce.
const engine = await Engine3D.init({ setting: { pick: { enable: true, mode: 'pixel' } } });

const view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
const canvas = engine.context3D.canvas as HTMLCanvasElement;
view.camera.perspective(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
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
 * Pixels on the deformed surface: projected triangle centroids (never on a
 * silhouette edge) that the CPU ray hits on `root`, spread over the mesh.
 */
function surfacePixels(root: Object3D, renderers: MeshRenderer[], count: number): { x: number, y: number }[] {
    const rc = new Raycaster();
    const out: { x: number, y: number }[] = [];
    const all: Vector3[] = [];
    for (const r of renderers) {
        const d = MeshDeformer.deform(r);
        const p = d.geometry.getAttribute(VertexAttributeName.position).data as Float32Array;
        const idx = d.geometry.getAttribute(VertexAttributeName.indices).data as ArrayLike<number>;
        const m = d.worldSpace ? null : r.transform.worldMatrix;
        for (let t = 0; t + 2 < idx.length; t += 3) {
            const c = new Vector3();
            for (let k = 0; k < 3; k++) {
                const i = idx[t + k] * 3;
                c.x += p[i] / 3; c.y += p[i + 1] / 3; c.z += p[i + 2] / 3;
            }
            all.push(m ? m.transformPoint(c) : c);
        }
    }
    const step = Math.max(1, Math.floor(all.length / count));
    for (let i = step >> 1; i < all.length && out.length < count; i += step) {
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

/** Indexed grid of (nx × ny) quads on the XY plane over [x0, x0 + w] × [y0, y0 + h], facing +z. */
function gridGeometry(nx: number, ny: number, x0: number, y0: number, w: number, h: number): GeometryBase {
    const vx = nx + 1, vy = ny + 1;
    const pos = new Float32Array(vx * vy * 3), nrm = new Float32Array(vx * vy * 3), uv = new Float32Array(vx * vy * 2);
    for (let j = 0; j < vy; j++) {
        for (let i = 0; i < vx; i++) {
            const v = j * vx + i;
            pos.set([x0 + w * i / nx, y0 + h * j / ny, 0], v * 3);
            nrm.set([0, 0, 1], v * 3);
            uv.set([i / nx, j / ny], v * 2);
        }
    }
    const idx = new Uint16Array(nx * ny * 6);
    for (let j = 0, k = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++, k += 6) {
            const a = j * vx + i, b = a + 1, c = a + vx + 1, d = a + vx;
            idx.set([a, b, c, a, c, d], k);
        }
    }
    const geo = new GeometryBase();
    geo.setAttribute(VertexAttributeName.position, pos);
    geo.setAttribute(VertexAttributeName.normal, nrm);
    geo.setAttribute(VertexAttributeName.uv, uv);
    geo.setAttribute(VertexAttributeName.TEXCOORD_1, uv);
    geo.setIndices(idx);
    geo.addSubGeometry({ indexStart: 0, indexCount: idx.length, vertexStart: 0, vertexCount: vx * vy, firstStart: 0, index: 0, topology: 0 });
    return geo;
}

function bone(name: string, id: number, parent: PrefabBoneData | null, t: Vector3): PrefabBoneData {
    const b = new PrefabBoneData();
    b.boneName = name;
    b.bonePath = parent ? parent.bonePath + '/' + name : name;
    b.parentBoneName = parent ? parent.boneName : '';
    b.boneID = id;
    b.parentBoneID = parent ? parent.boneID : -1;
    b.instanceID = b.parentInstanceID = '';
    b.t = t;
    b.q = new Quaternion();
    b.s = new Vector3(1, 1, 1);
    return b;
}

/**
 * Two-bone rig: b0 at the origin, b1 two units up. The skinned strip spans
 * y ∈ [0, 4]; vertices below y = 1.5 follow b0, above y = 2.5 follow b1,
 * and blend linearly in between.
 */
function skinnedStrip(): { rig: Object3D, animator: AnimatorComponent, renderer: SkinnedMeshRenderer2 } {
    const avatar = new PrefabAvatarData();
    avatar.name = 'test-two-bone-rig';
    const b0 = bone('b0', 0, null, new Vector3(0, 0, 0));
    const b1 = bone('b1', 1, b0, new Vector3(0, 2, 0));
    avatar.boneData = [b0, b1];
    avatar.boneMap = new Map([[b0.boneName, b0], [b1.boneName, b1]]);
    avatar.count = 2;
    engine.res.addObj(avatar.name, avatar);

    const geo = gridGeometry(4, 16, -0.5, 0, 1, 4);
    const pos = geo.getAttribute(VertexAttributeName.position).data as Float32Array;
    const n = pos.length / 3;
    const joints = new Float32Array(n * 4), weights = new Float32Array(n * 4);
    for (let v = 0; v < n; v++) {
        const t = Math.min(1, Math.max(0, pos[v * 3 + 1] - 1.5));
        joints.set([0, 1, 0, 0], v * 4);
        weights.set([1 - t, t, 0, 0], v * 4);
    }
    geo.setAttribute(VertexAttributeName.joints0, joints);
    geo.setAttribute(VertexAttributeName.weights0, weights);
    geo.skinNames = ['b0', 'b1'];
    const invB1 = new Matrix4();
    invB1.rawData[13] = -2;                                     // inverse of b1's bind world matrix (translate y + 2)
    geo.bindPose = [new Matrix4(), invB1];

    const rig = new Object3D();
    view.scene.addChild(rig);
    const animNode = new Object3D();
    rig.addChild(animNode);
    const animator = animNode.addComponent(AnimatorComponent);
    animator.avatar = avatar.name;                              // the root joint is parented under `rig`

    const meshNode = new Object3D();
    rig.addChild(meshNode);
    const renderer = meshNode.addComponent(SkinnedMeshRenderer2);
    renderer.geometry = geo;
    const mat = new LitMaterial();
    mat.cullMode = 'none';
    renderer.material = mat;
    renderer.skeletonAnimation = animator;
    return { rig, animator, renderer };
}

await test('skinned two-bone strip: CPU-skinned hits land on the GPU-rendered surface', async () => {
    const { rig, animator, renderer } = skinnedStrip();
    // Tilt the whole strip towards the camera and bend the upper half sideways,
    // so no part of the drawn surface coincides with the bind pose.
    animator.getJointObject('b0').rotationX = -25;
    animator.getJointObject('b1').rotationZ = 60;
    view.camera.lookAt(new Vector3(1, 2, 9), new Vector3(-0.5, 2, 0));
    await delay(1000);

    expect(MeshDeformer.isDeformed(renderer)).tobe(true);
    const pixels = surfacePixels(rig, [renderer], 8);
    const { samples, cpuOk, bindOk } = await compare(rig, [renderer], pixels, 0.05);
    console.log(`[skin] samples ${samples}, cpu ok ${cpuOk}, bind pose ok ${bindOk}`);
    expect(samples >= 6).tobe(true);
    expect(cpuOk >= samples - 1).tobe(true);
    expect(bindOk <= samples / 2).tobe(true);                   // the bind pose is visibly elsewhere

    // Unchanged pose → cached result, no recomputation.
    const v0 = MeshDeformer.deform(renderer).geometry.version;
    expect(MeshDeformer.deform(renderer).geometry.version).tobe(v0);
    // Once a frame applies a new pose, the next query recomputes.
    animator.getJointObject('b1').rotationZ = 30;
    const moved = await waitUntil(() => MeshDeformer.deform(renderer).geometry.version > v0, 3000);
    expect(!!moved).tobe(true);
    view.scene.removeChild(rig);
})

await test('morph targets (bump grid): CPU-morphed hits land on the GPU-rendered surface', async () => {
    const geo = gridGeometry(12, 12, -2, -2, 4, 4);
    const pos = geo.getAttribute(VertexAttributeName.position).data as Float32Array;
    const n = pos.length / 3;
    const bump = new Float32Array(n * 3), vIndex = new Float32Array(n);
    for (let v = 0; v < n; v++) {
        const x = pos[v * 3], y = pos[v * 3 + 1];
        bump[v * 3 + 2] = 1.5 * Math.exp(-(x * x + y * y));     // relative z offset, a bump in the middle
        vIndex[v] = v;
    }
    geo.setAttribute(VertexAttributeName.vIndex, vIndex);
    geo.setAttribute('a_morphPositions_0', bump);
    geo.morphTargetDictionary = { bump: 0 };
    geo.morphTargetsRelative = true;

    const obj = new Object3D();
    obj.rotationY = 20;                                         // morphs are mesh-local: exercise the world transform too
    const renderer = obj.addComponent(MeshRenderer);
    renderer.geometry = geo;
    const mat = new LitMaterial();
    mat.cullMode = 'none';
    renderer.material = mat;
    renderer.setMorphInfluence('bump', 0.8);
    view.scene.addChild(obj);
    view.camera.lookAt(new Vector3(2.5, 2.5, 6), new Vector3(0, 0, 0));
    await delay(1000);

    expect(MeshDeformer.isDeformed(renderer)).tobe(true);
    const pixels = surfacePixels(obj, [renderer], 8);
    const { samples, cpuOk, bindOk } = await compare(obj, [renderer], pixels, 0.05);
    console.log(`[morph] samples ${samples}, cpu ok ${cpuOk}, bind pose ok ${bindOk}`);
    expect(samples >= 6).tobe(true);
    expect(cpuOk >= samples - 1).tobe(true);
    view.scene.removeChild(obj);
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

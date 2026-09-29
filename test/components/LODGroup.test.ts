import { test, expect, end, waitUntil } from '../util'
import { BoxGeometry, CameraUtil, Engine3D, LitMaterial, LODGroup, LODMode, MeshRenderer, Object3D, Scene3D, SphereGeometry, View3D } from '@orillusion/core';

const engine = await Engine3D.init();

let view = new View3D();
view.scene = new Scene3D();
view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
view.camera.perspective(60, 1, 0.1, 5000);
view.camera.object3D.z = 10;
view.camera.lookAt(view.camera.object3D.localPosition, new Object3D().localPosition);
engine.startRenderViews([view]);

function makeGroup(radius = 1): { root: Object3D, lod: LODGroup, levels: Object3D[] } {
    const root = new Object3D();
    const lod = root.addComponent(LODGroup);
    const levels: Object3D[] = [];
    const geos = [new SphereGeometry(radius, 16, 16), new SphereGeometry(radius, 6, 6), new BoxGeometry(radius * 2, radius * 2, radius * 2)];
    for (let i = 0; i < 3; i++) {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geos[i];
        mr.material = new LitMaterial();
        root.addChild(o);
        levels.push(o);
    }
    view.scene.addChild(root);
    return { root, lod, levels };
}

function shownLevels(levels: Object3D[]): number[] {
    const r: number[] = [];
    levels.forEach((o, i) => { if (o.transform.enable) r.push(i); });
    return r;
}

// Camera at z = 10, fov 60°, radius 1 → metric = r / (d · tan30°) = 0.1732
await test('ScreenSize metric matches r / (d·tan(fov/2))', async () => {
    const { lod, root } = makeGroup(1);
    // Levels added out of order on purpose; they must be sorted finest-first.
    lod.addLevel(root.entityChildren[2] as Object3D, 0.02);
    lod.addLevel(root.entityChildren[0] as Object3D, 0.10);
    lod.addLevel(root.entityChildren[1] as Object3D, 0.04);
    expect(lod.levels.map(l => l.threshold)).toEqual([0.10, 0.04, 0.02]);
    lod.radius = 1;
    const m = lod.measure(view.camera);
    expect(m).toSubequal(1 / (10 * Math.tan(Math.PI / 6)), 1e-4);
    root.destroy(true);
})

await test('auto radius from level bounds', async () => {
    const { lod, root, levels } = makeGroup(2);
    levels.forEach((o, i) => lod.addLevel(o, [0.1, 0.04, 0.02][i]));
    // Sphere radius 2 → AABB half-extent 2 → corner distance 2√3
    const m = lod.measure(view.camera);
    expect(m).toSubequal(2 * Math.sqrt(3) / (10 * Math.tan(Math.PI / 6)), 1e-3);
    root.destroy(true);
})

await test('exactly one level enabled, switches with camera distance, culls beyond last', async () => {
    const { lod, root, levels } = makeGroup(1);
    lod.radius = 1;
    lod.hysteresis = 0;
    levels.forEach((o, i) => lod.addLevel(o, [0.10, 0.04, 0.02][i]));
    // Nothing shown until the first update runs.
    expect(shownLevels(levels)).toEqual([]);

    await waitUntil(() => lod.currentLevel === 0, 5000);
    expect(shownLevels(levels)).toEqual([0]);

    view.camera.object3D.z = 30;      // metric 0.0577 → level 1
    await waitUntil(() => lod.currentLevel === 1, 5000);
    expect(shownLevels(levels)).toEqual([1]);

    view.camera.object3D.z = 60;      // metric 0.0289 → level 2
    await waitUntil(() => lod.currentLevel === 2, 5000);
    expect(shownLevels(levels)).toEqual([2]);

    view.camera.object3D.z = 200;     // metric 0.0087 → culled
    await waitUntil(() => lod.currentLevel === LODGroup.CULLED, 5000);
    expect(shownLevels(levels)).toEqual([]);

    lod.cullBeyondLast = false;       // same distance → coarsest level instead of nothing
    await waitUntil(() => lod.currentLevel === 2, 5000);
    expect(shownLevels(levels)).toEqual([2]);

    view.camera.object3D.z = 10;      // back to the front → level 0 again
    await waitUntil(() => lod.currentLevel === 0, 5000);
    expect(shownLevels(levels)).toEqual([0]);
    root.destroy(true);
})

await test('hysteresis: promotion needs extra margin, demotion does not', async () => {
    const { lod, root, levels } = makeGroup(1);
    lod.radius = 1;
    lod.hysteresis = 0.2;
    levels.forEach((o, i) => lod.addLevel(o, [0.10, 0.04, 0.02][i]));
    // Pure selection logic, no frames needed.
    expect(lod.selectLevel(0.105, 1)).tobe(1);   // just above 0.10, coming from coarser → stays
    expect(lod.selectLevel(0.125, 1)).tobe(0);   // above 0.10 × 1.2 → promoted
    expect(lod.selectLevel(0.099, 0)).tobe(1);   // below 0.10, coming from finer → dropped immediately
    expect(lod.selectLevel(0.105, 0)).tobe(0);   // still above → keeps level 0
    expect(lod.selectLevel(0.019, 2)).tobe(LODGroup.CULLED);
    expect(lod.selectLevel(0.5, LODGroup.CULLED)).tobe(0); // from culled: no margin
    root.destroy(true);
})

await test('Distance mode uses world distance / bias', async () => {
    const { lod, root, levels } = makeGroup(1);
    lod.mode = LODMode.Distance;
    lod.hysteresis = 0;
    levels.forEach((o, i) => lod.addLevel(o, [50, 20, 100][i]));   // deliberately unsorted
    expect(lod.levels.map(l => l.threshold)).toEqual([20, 50, 100]);
    expect(lod.levels.map(l => levels.indexOf(l.objects[0]))).toEqual([1, 0, 2]);
    view.camera.object3D.z = 10;
    expect(lod.measure(view.camera)).toSubequal(10, 1e-6);
    expect(lod.selectLevel(10)).tobe(0);
    expect(lod.selectLevel(35)).tobe(1);
    expect(lod.selectLevel(99)).tobe(2);
    expect(lod.selectLevel(101)).tobe(LODGroup.CULLED);
    lod.bias = 2;                      // bias 2 halves the effective distance
    expect(lod.measure(view.camera)).toSubequal(5, 1e-6);
    root.destroy(true);
})

await test('mode switch + setThresholds keeps object↔level mapping', async () => {
    const { lod, root, levels } = makeGroup(1);
    levels.forEach((o, i) => lod.addLevel(o, [0.10, 0.04, 0.02][i]));   // hi, mid, low
    lod.mode = LODMode.Distance;
    lod.setThresholds([20, 50, 100]);
    expect(lod.levels.map(l => l.threshold)).toEqual([20, 50, 100]);
    expect(lod.levels.map(l => levels.indexOf(l.objects[0]))).toEqual([0, 1, 2]);
    lod.mode = LODMode.ScreenSize;
    lod.setThresholds([0.10, 0.04, 0.02]);
    expect(lod.levels.map(l => levels.indexOf(l.objects[0]))).toEqual([0, 1, 2]);
    root.destroy(true);
})

await test('forceLevel overrides the metric, null restores auto', async () => {
    const { lod, root, levels } = makeGroup(1);
    lod.radius = 1;
    levels.forEach((o, i) => lod.addLevel(o, [0.10, 0.04, 0.02][i]));
    view.camera.object3D.z = 10;
    lod.forceLevel = 2;
    await waitUntil(() => lod.currentLevel === 2, 5000);
    expect(shownLevels(levels)).toEqual([2]);
    lod.forceLevel = 99;               // clamped to last level
    expect(lod.selectLevel(1)).tobe(2);
    lod.forceLevel = LODGroup.CULLED;
    await waitUntil(() => lod.currentLevel === LODGroup.CULLED, 5000);
    expect(shownLevels(levels)).toEqual([]);
    lod.forceLevel = null;
    await waitUntil(() => lod.currentLevel === 0, 5000);
    expect(shownLevels(levels)).toEqual([0]);
    root.destroy(true);
})

await test('onLevelChange fires once per switch; removeLevel re-enables objects', async () => {
    const { lod, root, levels } = makeGroup(1);
    lod.radius = 1;
    lod.hysteresis = 0;
    levels.forEach((o, i) => lod.addLevel(o, [0.10, 0.04, 0.02][i]));
    const changes: number[][] = [];
    lod.onLevelChange = (l, p) => changes.push([l, p]);
    view.camera.object3D.z = 10;
    await waitUntil(() => lod.currentLevel === 0, 5000);
    view.camera.object3D.z = 30;
    await waitUntil(() => lod.currentLevel === 1, 5000);
    await new Promise(r => setTimeout(r, 200));   // a few more frames: no duplicate events
    expect(changes).toEqual([[0, -1], [1, 0]]);

    lod.removeLevel(1);
    expect(levels[1].transform.enable).tobe(true);
    expect(lod.levels.length).tobe(2);
    root.destroy(true);
})

Engine3D.pause();
setTimeout(end, 500)

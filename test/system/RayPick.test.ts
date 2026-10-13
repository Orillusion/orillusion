import { test, expect, end, waitUntil } from '../util'
import { BoxColliderShape, BoxGeometry, CameraUtil, ColliderComponent, ComponentCollect, Engine3D, LitMaterial, Matrix4, MeshColliderShape, MeshRenderer, Object3D, Quaternion, Ray, Scene3D, SphereColliderShape, SphereGeometry, Vector3, View3D } from '@orillusion/core';

const engine = await Engine3D.init();

const makeRay = (o: Vector3, d: Vector3) => { const r = new Ray(); r.origin.copy(o); r.direction = d; return r; };
const compose = (pos: Vector3, scale: Vector3, rotY = 0) => {
    const m = new Matrix4();
    const q = new Quaternion();
    q.setFromEuler(0, rotY, 0);
    m.compose(pos, q, scale);
    return m;
};

await test('BoxColliderShape: world-space point/distance/normal, local point kept', async () => {
    const box = new BoxColliderShape();
    box.setFromCenterAndSize(new Vector3(), new Vector3(1, 1, 1));
    // Unit box scaled ×10 at the origin: world faces at ±5.
    const world = compose(new Vector3(0, 0, 0), new Vector3(10, 10, 10));
    const hit = box.rayPick(makeRay(new Vector3(1, 2, 20), new Vector3(0, 0, -1)), world);
    expect(hit != null).tobe(true);
    expect(hit.distance).toSubequal(15, 1e-4);                 // was 1.5 (local units)
    expect(hit.intersectPoint.z).toSubequal(5, 1e-4);
    expect(hit.intersectPoint.x).toSubequal(1, 1e-4);
    expect(hit.localPoint.z).toSubequal(0.5, 1e-4);
    expect(hit.normal.z).toSubequal(1, 1e-6);
    // Side face under rotation: normal follows the transform.
    const rotated = compose(new Vector3(0, 0, 0), new Vector3(2, 2, 2), 90);
    const side = box.rayPick(makeRay(new Vector3(10, 0, 0), new Vector3(-1, 0, 0)), rotated);
    expect(side.distance).toSubequal(9, 1e-4);
    expect(side.normal.x).toSubequal(1, 1e-5);
    // Miss.
    expect(box.rayPick(makeRay(new Vector3(30, 0, 20), new Vector3(0, 0, -1)), world)).tobe(null);
})

await test('SphereColliderShape: world-space hit, uses its own hit point, inside origin hits exit', async () => {
    const sphere = new SphereColliderShape(1);
    const world = compose(new Vector3(0, 0, 0), new Vector3(3, 3, 3));
    const hit = sphere.rayPick(makeRay(new Vector3(0, 0, 10), new Vector3(0, 0, -1)), world);
    expect(hit.distance).toSubequal(7, 1e-4);
    expect(hit.intersectPoint.z).toSubequal(3, 1e-4);
    expect(hit.localPoint.z).toSubequal(1, 1e-4);
    expect(hit.normal.z).toSubequal(1, 1e-6);
    // Ray from the centre exits on the far side.
    const inside = sphere.rayPick(makeRay(new Vector3(0, 0, 0), new Vector3(1, 0, 0)), world);
    expect(inside.distance).toSubequal(3, 1e-4);
    expect(sphere.rayPick(makeRay(new Vector3(0, 10, 10), new Vector3(0, 0, -1)), world)).tobe(null);
})

await test('mixed shapes: distances are comparable (nearest object wins)', async () => {
    // A big box behind a small mesh sphere: the box's old local distance
    // (1.5) would have beaten the sphere's world distance (~4).
    const box = new BoxColliderShape();
    box.setFromCenterAndSize(new Vector3(), new Vector3(1, 1, 1));
    const boxWorld = compose(new Vector3(0, 0, 0), new Vector3(10, 10, 10));
    const mesh = new MeshColliderShape();
    mesh.mesh = new SphereGeometry(1, 24, 24);
    const meshWorld = compose(new Vector3(0, 0, 15), new Vector3(1, 1, 1));
    const ray = makeRay(new Vector3(0, 0, 20), new Vector3(0, 0, -1));
    const a = box.rayPick(ray, boxWorld), b = mesh.rayPick(ray, meshWorld);
    expect(b.distance < a.distance).tobe(true);
    expect(b.distance).toSubequal(4, 2e-2);
})

await test('MeshColliderShape: normal stays perpendicular under non-uniform scale', async () => {
    const shape = new MeshColliderShape();
    shape.mesh = new SphereGeometry(1, 96, 96);
    // Ellipsoid with semi-axes (4, 1, 1). Hit it at 45° in the XY plane of the
    // *local* sphere: local point p = (1,1,0)/√2 → world (4/√2, 1/√2, 0).
    const world = compose(new Vector3(), new Vector3(4, 1, 1));
    const target = new Vector3(4 / Math.SQRT2, 1 / Math.SQRT2, 0);
    const o = new Vector3(target.x, target.y + 10, 0);
    const hit = shape.rayPick(makeRay(o, new Vector3(0, -1, 0)), world);
    expect(hit != null).tobe(true);
    // Ellipsoid gradient at (x,y,z): (x/16, y/1, z/1) → normalize.
    const g = new Vector3(hit.intersectPoint.x / 16, hit.intersectPoint.y, hit.intersectPoint.z).normalize();
    expect(hit.normal.dotProduct(g)).toSubequal(1, 5e-3);
    // Transforming with M instead would point at (4,1,0) — far off.
    const wrong = new Vector3(4, 1, 0).normalize();
    expect(hit.normal.dotProduct(wrong) < 0.9).tobe(true);
    // Results are fresh objects: a second pick does not overwrite the first.
    const again = shape.rayPick(makeRay(new Vector3(0, 0, 10), new Vector3(0, 0, -1)), world);
    expect(again.intersectPoint !== hit.intersectPoint).tobe(true);
    expect(hit.intersectPoint.x).toSubequal(target.x, 5e-2);
})

await test('Camera3D.screenPointToRay round-trips worldToScreenPoint on an offset canvas', async () => {
    const view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
    const canvas = engine.context3D.canvas as HTMLCanvasElement;
    view.camera.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    view.camera.lookAt(new Vector3(0, 5, 20), new Vector3(0, 0, 0));
    engine.startRenderView(view);
    await new Promise(r => setTimeout(r, 100));

    const prev = { position: canvas.style.position, left: canvas.style.left, top: canvas.style.top };
    canvas.style.position = 'absolute';
    canvas.style.left = '120px';
    canvas.style.top = '60px';
    try {
        expect(canvas.offsetLeft).tobe(120);
        const pts = [new Vector3(0, 0, 0), new Vector3(3, 1, -2), new Vector3(-4, 2, 1)];
        for (const p of pts) {
            const s = view.camera.worldToScreenPoint(p, new Vector3());
            const ray = view.camera.screenPointToRay(s.x, s.y);
            // Distance from p to the ray line.
            const v = new Vector3(p.x - ray.origin.x, p.y - ray.origin.y, p.z - ray.origin.z);
            const t = v.dotProduct(ray.direction);
            const closest = new Vector3(ray.origin.x + ray.direction.x * t, ray.origin.y + ray.direction.y * t, ray.origin.z + ray.direction.z * t);
            expect(Vector3.distance(closest, p)).toSubequal(0, 1e-2);
        }
    } finally {
        canvas.style.position = prev.position;
        canvas.style.left = prev.left;
        canvas.style.top = prev.top;
    }
})

await test('PickFire (bound mode): nearest collider wins, full hit data, all hits, filters', async () => {
    const view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
    const canvas = engine.context3D.canvas as HTMLCanvasElement;
    view.camera.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    view.camera.lookAt(new Vector3(0, 0, 30), new Vector3(0, 0, 0));

    const add = (name: string, pos: Vector3, scale: number, meshShape: boolean) => {
        const obj = new Object3D();
        obj.name = name;
        obj.localPosition = pos;
        obj.localScale = new Vector3(scale, scale, scale);
        const mr = obj.addComponent(MeshRenderer);
        mr.geometry = meshShape ? new SphereGeometry(1, 32, 32) : new BoxGeometry(1, 1, 1);
        mr.material = new LitMaterial();
        const col = obj.addComponent(ColliderComponent);
        if (meshShape) col.shape = new MeshColliderShape();       // no .mesh: taken from the MeshRenderer
        else (col.shape as BoxColliderShape).setFromCenterAndSize(new Vector3(), new Vector3(1, 1, 1));
        view.scene.addChild(obj);
        return obj;
    };
    // A big scaled box behind a small sphere: in local units the box looks closer.
    const box = add('box', new Vector3(0, 0, -5), 10, false);
    const ball = add('ball', new Vector3(0, 0, 3), 1, true);
    engine.startRenderView(view);
    // Colliders register for picking when the render loop starts them.
    const ready = await waitUntil(() => ComponentCollect.componentsEnablePickerList.get(view)?.size === 2, 20000);
    expect(!!ready).tobe(true);

    const pf: any = view.pickFire;
    const s = view.camera.worldToScreenPoint(new Vector3(0.2, 0.3, 3), new Vector3());
    engine.inputSystem.mouseX = s.x;
    engine.inputSystem.mouseY = s.y;
    const pick = () => { pf.pick(view.camera); return pf.findNearestObj(pf._interestList, view.camera); };

    const target = pick();
    expect(target.object3D === ball).tobe(true);
    const data = pf.getPickInfo();
    expect(data.hits.length).tobe(2);
    expect(data.hits[1].collider.object3D === box).tobe(true);
    expect(data.distance < data.hits[1].distance).tobe(true);
    expect(data.faceIndex >= 0).tobe(true);
    expect(data.uv != null && data.barycentric != null && data.localPos != null).tobe(true);
    expect(data.frontFace).tobe(true);
    expect(data.worldNormal.z > 0.5).tobe(true);
    // The next pick must not mutate the data handed out above.
    const z = data.worldPos.z;
    engine.inputSystem.mouseX = s.x + 40;
    pick();
    expect(data.worldPos.z).tobe(z);
    engine.inputSystem.mouseX = s.x;

    pf.filter = (c: ColliderComponent) => c.object3D !== ball;
    expect(pick().object3D === box).tobe(true);
    pf.filter = null;
    ball.getComponent(ColliderComponent).visibleLayer = 1 << 2;
    pf.layerMask = ~(1 << 2);
    expect(pick().object3D === box).tobe(true);
    pf.layerMask = 0xFFFFFFFF;
    expect(pick().object3D === ball).tobe(true);
})

Engine3D.pause();
setTimeout(end, 500)

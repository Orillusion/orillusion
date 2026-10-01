import { test, expect, end } from '../util';
import { BoxGeometry, CameraUtil, ComponentBase, Engine3D, GeometryBase, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, PointerEvent3D, Ray, Scene3D, Vector3, View3D } from '@orillusion/core';
import { installGraphicRayPick, installRayPick, Raycaster, SceneRayPick, uninstallRayPick } from '@orillusion/ray-pick';

const engine = await Engine3D.init();
engine.frameRate = 10;

function createBox(): Object3D {
    const object = new Object3D();
    const renderer = object.addComponent(MeshRenderer);
    renderer.geometry = new BoxGeometry(2, 2, 2);
    renderer.material = new LitMaterial();
    renderer.material.cullMode = 'none';
    return object;
}

await test('ray pick is injected and removable', async () => {
    const object = createBox();
    const raycaster = new Raycaster(new Ray(new Vector3(0, 3, 0), new Vector3(0, -1, 0)));

    uninstallRayPick();
    expect(raycaster.intersectObject(object).length).toEqual(0);

    installRayPick();
    const hits = raycaster.intersectObject(object);
    expect(hits.length).toEqual(4);
    expect(hits[0].object).tobe(object);
    expect(hits[0].distance).toSubequal(2, 0.001);
    expect(hits[0].faceIndex).toRange(0, 11);
    expect(hits[0].uv.x).toSubequal(0.5, 0.001);
    expect(hits[0].barycoord.x + hits[0].barycoord.y + hits[0].barycoord.z).toSubequal(1, 0.001);

    uninstallRayPick();
    expect(raycaster.intersectObject(object).length).toEqual(0);
});

await test('scene traversal returns sorted world-space hits', async () => {
    installRayPick();
    const root = new Object3D();
    const near = createBox();
    const far = createBox();
    near.y = 2;
    far.y = -3;
    root.addChild(far);
    root.addChild(near);

    const hits = new Raycaster(new Ray(new Vector3(0, 6, 0), new Vector3(0, -1, 0)))
        .intersectObject(root, true);
    expect(hits.length).toEqual(8);
    expect(hits[0].object).tobe(near);
    expect(hits[0].point.y).toSubequal(3, 0.001);
    expect(hits[0].distance).toSubequal(3, 0.001);
    for (let i = 1; i < hits.length; i++) {
        expect(hits[i].distance >= hits[i - 1].distance).tobe(true);
    }
});

await test('external instanced renderer can be injected without a package dependency', async () => {
    class GraphicLikeRenderer extends MeshRenderer {
        public sourceGeometry: GeometryBase;
        public object3Ds: Object3D[] = [];

        public create(source: GeometryBase): void {
            this.geometry = source;
        }
    }

    installRayPick();
    installGraphicRayPick(GraphicLikeRenderer);
    const owner = new Object3D();
    const renderer = owner.addComponent(GraphicLikeRenderer);
    renderer.material = new LitMaterial();
    renderer.material.cullMode = 'none';
    renderer.create(new BoxGeometry(2, 2, 2));
    const instance = new Object3D();
    instance.x = 4;
    owner.addChild(instance);
    renderer.object3Ds.push(instance);

    const hits = new Raycaster(new Ray(new Vector3(4, 3, 0), new Vector3(0, -1, 0)))
        .intersectObject(owner, false);
    expect(hits.length).toEqual(4);
    expect(hits[0].object).tobe(instance);
    expect(hits[0].point.x).toSubequal(4, 0.001);
});

await test('scene pointer bridge casts through the active camera', async () => {
    installRayPick();
    const scene = new Scene3D();
    const camera = CameraUtil.createCamera3DObject(scene, 'ray-pick-camera');
    camera.perspective(60, engine.aspect, 0.1, 100);
    camera.lookAt(new Vector3(0, 0, 10), Vector3.ZERO, Vector3.Y_AXIS);
    const view = new View3D();
    view.scene = scene;
    view.camera = camera;
    engine.startRenderView(view);

    const box = createBox();
    scene.addChild(box);
    engine.inputSystem.mouseX = engine.inputSystem.canvas.clientWidth / 2;
    engine.inputSystem.mouseY = engine.inputSystem.canvas.clientHeight / 2;

    const hits = new SceneRayPick(view).pick();
    expect(hits.length).toEqual(4);
    expect(hits[0].object).tobe(box);
    expect(hits[0].point.z).toSubequal(1, 0.05);
});

await test('world normal follows rotation and inverse-transpose scale', async () => {
    installRayPick();
    const object = new Object3D();
    const renderer = object.addComponent(MeshRenderer);
    renderer.geometry = new PlaneGeometry(2, 2, 1, 1, Vector3.Y_AXIS);
    renderer.material = new LitMaterial();
    renderer.material.cullMode = 'none';
    object.scaleX = 3;
    object.scaleY = 0.5;
    const rotatedParent = new Object3D();
    rotatedParent.rotationX = 90;
    rotatedParent.addChild(object);

    const hits = new Raycaster(new Ray(new Vector3(0, 0, 3), new Vector3(0, 0, -1)))
        .intersectObject(rotatedParent);
    expect(hits.length).toRange(1, 2);
    expect(Math.abs(hits[0].normal.y)).toSubequal(1, 0.001);
    expect(hits[0].worldNormal.x).toSubequal(0, 0.001);
    expect(hits[0].worldNormal.y).toSubequal(0, 0.001);
    expect(hits[0].worldNormal.z).toSubequal(1, 0.001);
});


await test('multi-material sub-geometries use their own cull mode and material index', async () => {
    installRayPick();
    const object = new Object3D();
    const renderer = object.addComponent(MeshRenderer);
    const geometry = new PlaneGeometry(2, 2, 1, 1, Vector3.Z_AXIS);
    geometry.subGeometries.length = 0;
    geometry.addSubGeometry({ indexStart: 0, indexCount: 3, vertexStart: 0, vertexCount: 0, firstStart: 0, index: 0, topology: 0 });
    geometry.addSubGeometry({ indexStart: 3, indexCount: 3, vertexStart: 0, vertexCount: 0, firstStart: 0, index: 0, topology: 0 });
    renderer.geometry = geometry;
    const first = new LitMaterial();
    first.cullMode = 'back';
    const second = new LitMaterial();
    second.cullMode = 'none';
    renderer.materials = [first, second];

    const leftFront = new Raycaster(new Ray(new Vector3(-0.5, 0, 2), new Vector3(0, 0, -1))).intersectObject(object);
    const rightFront = new Raycaster(new Ray(new Vector3(0.5, 0, 2), new Vector3(0, 0, -1))).intersectObject(object);
    expect(leftFront.length).toEqual(1);
    expect(rightFront.length).toEqual(1);
    expect(leftFront[0].face.materialIndex).toEqual(0);
    expect(rightFront[0].face.materialIndex).toEqual(1);

    const leftBack = new Raycaster(new Ray(new Vector3(-0.5, 0, -2), new Vector3(0, 0, 1))).intersectObject(object);
    const rightBack = new Raycaster(new Ray(new Vector3(0.5, 0, -2), new Vector3(0, 0, 1))).intersectObject(object);
    expect(leftBack.length).toEqual(0);
    expect(rightBack.length).toEqual(1);
    expect(rightBack[0].face.materialIndex).toEqual(1);
});

await test('raycaster instances keep independent scratch state', async () => {
    installRayPick();
    const object = createBox();
    const fromTop = new Raycaster(new Ray(new Vector3(0, 3, 0), new Vector3(0, -1, 0)));
    const fromRight = new Raycaster(new Ray(new Vector3(3, 0, 0), new Vector3(-1, 0, 0)));
    const topHits = fromTop.intersectObject(object);
    const rightHits = fromRight.intersectObject(object);
    expect(topHits[0].point.y).toSubequal(1, 0.001);
    expect(rightHits[0].point.x).toSubequal(1, 0.001);
    expect(topHits[0].point.y).toSubequal(1, 0.001);
});

await test('scene picker destroy removes listeners and is idempotent', async () => {
    const scene = new Scene3D();
    const camera = CameraUtil.createCamera3DObject(scene, 'destroy-camera');
    const view = new View3D();
    view.scene = scene;
    view.camera = camera;
    engine.startRenderView(view);
    const picker = new SceneRayPick(view).start();
    let pickCalls = 0;
    (picker as any).pick = () => { pickCalls++; return []; };
    picker.destroy();
    picker.destroy();
    (engine.setting.pick.mode as any) = 'ray';
    engine.inputSystem.dispatchEvent(new PointerEvent3D(PointerEvent3D.POINTER_MOVE));
    expect(pickCalls).toEqual(0);
    let rejected = false;
    try { picker.start(); } catch { rejected = true; }
    expect(rejected).tobe(true);
});


await test('same raycaster restores scratch after a nested query', async () => {
    installRayPick();
    const nestedTarget = createBox();
    nestedTarget.x = 10;

    class NestedQueryComponent extends ComponentBase {
        public restored = false;
        public raycast(raycaster: Raycaster): void {
            raycaster.prepareObject(this.object3D);
            const before = raycaster._localRay.origin.clone();
            raycaster.intersectObject(nestedTarget);
            const after = raycaster._localRay.origin;
            this.restored = Vector3.distance(before, after) < 0.000001;
        }
    }

    const outer = createBox();
    const nested = outer.addComponent(NestedQueryComponent);
    const raycaster = new Raycaster(new Ray(new Vector3(0, 3, 0), new Vector3(0, -1, 0)));
    const hits = raycaster.intersectObject(outer);
    expect(hits.length).toEqual(4);
    expect(nested.restored).tobe(true);
});

setTimeout(end, 100);

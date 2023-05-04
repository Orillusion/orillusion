import { test, expect, end } from '../util'
import { BoxColliderShape, Camera3D, ColliderComponent, Engine3D, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Ray, Scene3D, Vector3 } from '@orillusion/core';

await test('ecs remove Component', async () => {
    await Engine3D.init();
    let obj = new Object3D();
    obj.addComponent(ColliderComponent);
    obj.removeComponent(ColliderComponent);

    let nullComponent = obj.hasComponent(ColliderComponent);
    expect(nullComponent).toEqual(false);
}, true)

await test('ecs create MeshRenderer', async () => {
    await Engine3D.init();
    let obj = new Object3D();
    let renderder = obj.addComponent(MeshRenderer);
    let material = new LitMaterial();
    let geometry = new PlaneGeometry(10, 10);
    renderder.material = material;
    renderder.geometry = geometry;

    expect(renderder.materials[0]).toEqual(renderder.material);
}, true)

await test('ecs test ColliderComponent', async () => {
    await Engine3D.init();
    let obj = new Object3D();
    let component = obj.addComponent(ColliderComponent);
    let size: number = 1;

    let boxShape = new BoxColliderShape().setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(size, size, size));
    component.shape = boxShape;
    component.enable = true;

    let ray = new Ray(new Vector3(0, 0, -5), new Vector3(0, 0, 1));

    let pick = component.rayPick(ray);
    let success = pick && pick.intersect;

    expect(success).toEqual(true);
}, true)


setTimeout(end, 500)

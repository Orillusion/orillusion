import { test, expect, end } from '../util'
import { BoxColliderShape, Camera3D, ColliderComponent, Engine3D, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Ray, Scene3D, Vector3 } from '@orillusion/core';

await Engine3D.init();
Engine3D.frameRate = 10;

await test('ecs remove Component', async () => {
    let obj = new Object3D();
    obj.addComponent(ColliderComponent);
    obj.removeComponent(ColliderComponent);

    let nullComponent = obj.hasComponent(ColliderComponent);
    expect(nullComponent).toEqual(false);
})

await test('ecs create MeshRenderer', async () => {
    let obj = new Object3D();
    let renderder = obj.addComponent(MeshRenderer);
    let material = new LitMaterial();
    let geometry = new PlaneGeometry(10, 10);
    renderder.material = material;
    renderder.geometry = geometry;

    expect(renderder.materials[0]).toEqual(renderder.material);
})

await test('ecs test ColliderComponent', async () => {
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
})


setTimeout(end, 500)

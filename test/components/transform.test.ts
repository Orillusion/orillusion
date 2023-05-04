import { test, expect, end, delay } from '../util'
import { Camera3D, Engine3D, Object3D, Scene3D } from '@orillusion/core';

await test('Transform not repeat', async () => {
    await Engine3D.init();
    let objA = new Object3D();
    let objB = new Object3D();
    let objC = new Object3D();

    expect(objA.transform).toEqual(objA.transform.object3D.transform)
    expect(objB.transform).toEqual(objB.transform.object3D.transform)
    expect(objC.transform).toEqual(objC.transform.object3D.transform)
}, true)

await test('Transform parent', async () => {
    await Engine3D.init();
    let objA = new Object3D();
    let objB = new Object3D();
    let objC = new Object3D();

    objA.addChild(objB);
    objB.addChild(objC);

    expect(objB.transform.parent).toEqual(objA.transform)
    expect(objC.transform.parent).toEqual(objB.transform)
}, true)

await test('Transform position', async () => {
    await Engine3D.init();
    let objA = new Object3D();
    let objB = new Object3D();
    let objC = new Object3D();

    objA.x = 100;

    objB.y = 100;

    objC.z = 100;

    objA.addChild(objB);
    objB.addChild(objC);

    expect(objC.transform.worldPosition.x).toEqual(100)
    expect(objC.transform.worldPosition.y).toEqual(100)
    expect(objC.transform.worldPosition.z).toEqual(100)
}, true)



setTimeout(end, 500)

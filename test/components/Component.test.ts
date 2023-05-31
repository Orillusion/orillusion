import { test, expect, end, delay } from '../util'
import { TestComponents } from './test/TestComponents';
import { Camera3D, Engine3D, Object3D, Scene3D } from '@orillusion/core';

await Engine3D.init();
Engine3D.frameRate = 10;

await test('component create', async () => {
    let obj = new Object3D();
    let c = obj.addComponent(Camera3D);

    expect(c.transform).toEqual(obj.transform);
})

await test('component enable true', async () => {
    let obj = new Object3D();
    let c = obj.addComponent(Camera3D);
    c.enable = true;
    expect(c.enable).toEqual(true);
})

await test('component enable false', async () => {
    let obj = new Object3D();
    let c = obj.addComponent(Camera3D);
    c.enable = false;
    expect(c.enable).toEqual(false);
})

await test('component enable false', async () => {
    let scene = new Scene3D();
    let obj = new Object3D();
    let c = obj.addComponent(TestComponents);
    expect(c.initState).toEqual(true);
    expect(c.startState).toEqual(false);
    expect(c.destroyState).toEqual(false);

    scene.addChild(obj);
    scene.waitUpdate();

    expect(c.startState).toEqual(true);

    c.enable = false;
    expect(c.enableState).toEqual(false);

    c.enable = true;
    expect(c.enableState).toEqual(true);
})

setTimeout(end, 500)

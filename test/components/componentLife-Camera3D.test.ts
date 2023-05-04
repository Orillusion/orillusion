import { test, expect, end, delay } from '../util'
import { Camera3D, Engine3D, Object3D, Scene3D } from '@orillusion/core';
import { TestComponents } from './test/TestComponents';

await test('component enable true', async () => {
    await Engine3D.init();
    let obj = new Object3D();
    let c = obj.addComponent(Camera3D);
    c.enable = true;
    expect(c.enable).toEqual(true);
}, true)

await test('component enable false', async () => {
    await Engine3D.init();
    let obj = new Object3D();
    let c = obj.addComponent(Camera3D);
    c.enable = false;
    expect(c.enable).toEqual(false);
}, true)

await test('component enable false', async () => {
    await Engine3D.init();
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
}, true)

setTimeout(end, 500)

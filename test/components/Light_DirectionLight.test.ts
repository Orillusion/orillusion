import { test, expect, end, frames } from '../util'
import { Camera3D, CameraUtil, Color, DirectLight, Engine3D, Object3D, Scene3D, View3D } from '@orillusion/core';

await test('DirectionLight test', async () => {
    const engine = await Engine3D.init();
    engine.frameRate = 10;

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    let directLight = new Object3D();
    let pl = directLight.addComponent(DirectLight);
    pl.intensity = 10;
    pl.lightColor = new Color(1.0, 0.0, 0.0);
    // test shadow
    pl.castShadow = true;

    view.scene.addChild(directLight);
    engine.startRenderViews([view]);
})

/** A running view on its own engine, plus a helper that adds a DirectLight to its scene. */
async function lightScene() {
    const engine = await Engine3D.init();
    const view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
    engine.startRenderView(view);
    const add = (csm?: boolean) => {
        const o = new Object3D();
        const l = o.addComponent(DirectLight);
        if (csm !== undefined) l.enableCSM = csm;
        view.scene.addChild(o);
        return l;
    };
    return { engine, add };
}

await test('DirectionLight: the first one in a scene enables CSM by default, later ones do not', async () => {
    const { engine, add } = await lightScene();
    const first = add();
    const second = add();
    await frames();
    expect(first.enableCSM).tobe(true);
    expect(first.cascadeNum).tobe(4);
    expect(second.enableCSM).tobe(false);
    engine.pause();
})

await test('DirectionLight: an explicit enableCSM = false on the first light is kept', async () => {
    const { engine, add } = await lightScene();
    const optedOut = add(false);
    await frames();
    expect(optedOut.enableCSM).tobe(false);
    engine.pause();
})

setTimeout(end, 500)

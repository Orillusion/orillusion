import { test, expect, end, delay } from '../util'
import { Camera3D, CameraUtil, Color, DirectLight, Engine3D, Object3D, PointLight, Scene3D, SpotLight, View3D, webGPUContext } from '@orillusion/core';

await Engine3D.init();

await test('DirectionLight Shadow test', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    let pointLight = new Object3D();
    let pl = pointLight.addComponent(DirectLight);
    pl.intensity = 10;
    pl.lightColor = new Color(1.0, 0.0, 0.0);
    pl.castShadow = true;
    // Engine3D.startRenderViews([view]);
})

await test('PointLight Shadow test', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    let pointLight = new Object3D();
    let pl = pointLight.addComponent(PointLight);
    pl.intensity = 10;
    pl.range = 10;
    pl.castShadow = true;
    pl.lightColor = new Color(1.0, 0.0, 0.0);
    // Engine3D.startRenderViews([view]);
})

await test('SpotLight Shadow test', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    let pointLight = new Object3D();
    let pl = pointLight.addComponent(SpotLight);
    pl.intensity = 10;
    pl.range = 10;
    pl.castShadow = true;
    pl.lightColor = new Color(1.0, 0.0, 0.0);
    // Engine3D.startRenderViews([view]);
})



setTimeout(end, 500)

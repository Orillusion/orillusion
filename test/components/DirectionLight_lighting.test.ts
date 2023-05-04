import { test, end } from '../util'
import { Camera3D, CameraUtil, Color, DirectLight, Engine3D, Object3D, Scene3D, View3D } from '@orillusion/core';

await test('DirectionLight test', async () => {
    let suc = await Engine3D.init();
    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    let directLight = new Object3D();
    let pl = directLight.addComponent(DirectLight);
    pl.intensity = 10;
    pl.lightColor = new Color(1.0, 0.0, 0.0);
    view.scene.addChild(directLight);
    Engine3D.startRenderViews([view]);
})

setTimeout(end, 500)

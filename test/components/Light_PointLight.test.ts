import { test, end } from '../util'
import { CameraUtil, Color, Engine3D, Object3D, PointLight, Scene3D, View3D } from '@orillusion/core';

await test('PointLight test', async () => {
    await Engine3D.init();
    Engine3D.frameRate = 10;

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    let pointLight = new Object3D();
    let pl = pointLight.addComponent(PointLight);
    pl.intensity = 10;
    pl.range = 10;
    pl.lightColor = new Color(1.0, 0.0, 0.0);
    // test shadow
    pl.castShadow = true;

    view.scene.addChild(pointLight);
    Engine3D.startRenderViews([view]);
})

setTimeout(end, 500)

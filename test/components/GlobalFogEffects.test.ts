import { test, expect, end, delay } from '../util'
import { Camera3D, CameraUtil, Engine3D, GlobalFog, Object3D, PostProcessingComponent, Scene3D, View3D } from '@orillusion/core';

await test('Post GlobalFog test', async () => {
    let suc = await Engine3D.init();
    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    Engine3D.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    postProcessing.addPost(GlobalFog);
}, true)

setTimeout(end, 500)

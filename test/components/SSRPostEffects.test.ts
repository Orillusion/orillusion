import { test, expect, end, delay } from '../util'
import { AtmosphericComponent, Camera3D, CameraUtil, Engine3D, Object3D, PostProcessingComponent, SSRPost, Scene3D, View3D } from '@orillusion/core';

await test('Post SSR test', async () => {
    let suc = await Engine3D.init();
    let view = new View3D();
    view.scene = new Scene3D();
    view.scene.addComponent(AtmosphericComponent);
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    Engine3D.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    postProcessing.addPost(SSRPost);
}, true)

setTimeout(end, 500)

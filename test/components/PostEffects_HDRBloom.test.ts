import { test, end } from '../util'
import { Camera3D, CameraUtil, Engine3D, HDRBloomPost, Object3D, PostProcessingComponent, Scene3D, View3D } from '@orillusion/core';

await test('Post HDRBloomPost test', async () => {
    await Engine3D.init();
    Engine3D.frameRate = 10;

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    Engine3D.startRenderView(view);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    postProcessing.addPost(HDRBloomPost);
})


setTimeout(end, 500)

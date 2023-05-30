import { test, expect, end, delay } from '../util'
import { Camera3D, CameraUtil, Engine3D, GTAOPost, Object3D, PostProcessingComponent, Scene3D, View3D } from '@orillusion/core';

await test('Post GTAOPost test', async () => {
    await Engine3D.init();
    Engine3D.frameRate = 2;

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    Engine3D.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    let gtao = postProcessing.addPost(GTAOPost);
    await delay(500)
    expect(gtao.gtaoTexture?.width).tobe(window.innerWidth)
    Engine3D.pause()
})


setTimeout(end, 500)

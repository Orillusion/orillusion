import { test, expect, end, waitUntil } from '../util'
import { Camera3D, CameraUtil, Engine3D, Object3D, PostProcessingComponent, Scene3D, TAAPost, View3D } from '@orillusion/core';

await test('Post TAAPost test', async () => {
    const engine = await Engine3D.init();
    engine.frameRate = 2;

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    engine.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    let taa = postProcessing.addPost(TAAPost);
    // taaTexture is created lazily on the first rendered frame and the
    // engine runs at 2 fps here, so a fixed 500 ms delay raced the very
    // first tick (and the ResizeObserver-driven resize that follows it).
    // Poll for the state we actually assert on instead.
    let dest = Math.floor(window.innerWidth * window.devicePixelRatio);
    await waitUntil(() => taa.taaTexture?.width === dest, 15000)
    let src = taa.taaTexture?.width;
    expect(src).tobe(dest)
    Engine3D.pause()
})

setTimeout(end, 500)

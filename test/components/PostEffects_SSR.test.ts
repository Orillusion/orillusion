import { test, expect, end, waitUntil } from '../util'
import { CameraUtil, Color, Engine3D, PostProcessingComponent, SSRPost, Scene3D, SkyRenderer, SolidColorSky, View3D } from '@orillusion/core';

await test('Post SSR test', async () => {
    const engine = await Engine3D.init();

    let view = new View3D();
    view.scene = new Scene3D();
    let sky = view.scene.addComponent(SkyRenderer)
    sky.map = new SolidColorSky(new Color(0, 0, 0), engine.context3D)
    view.scene.envMap = sky.map
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    engine.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    let ssr = postProcessing.addPost(SSRPost);

    // finalTexture is created lazily inside SSRPost.render(); poll
    // instead of racing a fixed delay against the RAF tick.
    await waitUntil(() => ssr.finalTexture, 15000)
    // Same resize race as GTAO/TAA: wait until the post has followed the canvas.
    await waitUntil(() => ssr.finalTexture.width === engine.context3D.presentationSize[0], 15000)
    let dest = engine.context3D.presentationSize[0];
    let src = ssr.finalTexture?.width;
    expect(src).tobe(dest)

    Engine3D.pause()
})

setTimeout(end, 500)

import { test, expect, end, waitUntil } from '../util'
import { CameraUtil, Engine3D, GTAOPost, PostProcessingComponent, Scene3D, View3D } from '@orillusion/core';

await test('Post GTAOPost test', async () => {
    const engine = await Engine3D.init();

    let view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    engine.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    let gtao = postProcessing.addPost(GTAOPost);
    // gtaoTexture is created lazily inside GTAOPost.render() on the
    // first PostRenderer iteration, which only runs after the RAF
    // loop has completed one frame AND the compute-shader pipeline
    // has compiled. Under full-suite CI load (adapter busy from the
    // previous 5 engines + shader cache cold) 5 s wasn't always
    // enough on Mac Metal — the test passed in isolation but failed
    // when queued after Light_*/Component tests. Bump to 15 s to
    // cover worst-case driver compile latency.
    await waitUntil(() => gtao.gtaoTexture, 15000)
    // The canvas ResizeObserver can fire after the texture was created at
    // the pre-layout size; the post follows on the next frame. Wait for
    // that instead of sampling mid-resize.
    await waitUntil(() => gtao.gtaoTexture.width === engine.context3D.presentationSize[0], 15000)
    let dest = engine.context3D.presentationSize[0];
    let src = gtao.gtaoTexture?.width;
    expect(src).tobe(dest)
    Engine3D.pause()
})


setTimeout(end, 500)

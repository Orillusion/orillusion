import { test, expect, end, delay } from '../util'
import { BloomPost, CameraUtil, Engine3D, LensPost, PostProcessingComponent, Scene3D, View3D } from '@orillusion/core';

const engine = await Engine3D.init({ canvasConfig: { devicePixelRatio: 1 } });
const postList = (view: View3D): Map<string, any> => (engine.getRenderJob(view) as any).graph.getPass('PostPass').postList;

await test('posts added BEFORE startRenderView are deferred, then attached when the view starts', async () => {
    const view = new View3D();
    view.scene = new Scene3D();
    view.camera = CameraUtil.createCamera3DObject(view.scene, 'camera');
    // Used to throw "Cannot read properties of undefined (reading 'renderJobs')".
    const post = view.scene.addComponent(PostProcessingComponent);
    const lens = post.addPost(LensPost);
    post.addPost(BloomPost);
    expect(lens != null).tobe(true);
    lens.vignetteIntensity = 0.7;                               // configuring an unattached post reads the (single) engine's settings
    expect(engine.setting.render.postProcessing.lens.vignetteIntensity).tobe(0.7);
    expect(post.getPost(LensPost) === lens).tobe(true);
    post.removePost(BloomPost);                                 // removing before the job exists must not throw either
    expect(post.getPost(BloomPost)).tobe(null);

    engine.startRenderView(view);
    expect(postList(view).has('LensPost')).tobe(true);
    expect(postList(view).has('BloomPost')).tobe(false);
    await delay(300);                                           // renders without errors
    expect(engine.setting.render.postProcessing.lens.enable).tobe(true);

    post.addPost(BloomPost);                                    // the usual after-start path still works
    expect(postList(view).has('BloomPost')).tobe(true);
    post.removePost(LensPost);
    expect(postList(view).has('LensPost')).tobe(false);
})

await test('a PostProcessingComponent on a scene with no view is inert', async () => {
    const scene = new Scene3D();
    const post = scene.addComponent(PostProcessingComponent);
    post.addPost(LensPost);
    post.enable = false;
    post.enable = true;
    post.removePost(LensPost);
    expect(post.getPost(LensPost)).tobe(null);
})

Engine3D.pause();
setTimeout(end, 500)

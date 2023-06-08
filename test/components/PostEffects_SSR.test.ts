import { test, expect, end, delay } from '../util'
import { CameraUtil, Color, Engine3D, PostProcessingComponent, SSRPost, Scene3D, SkyRenderer, SolidColorSky, View3D } from '@orillusion/core';

await test('Post SSR test', async () => {
    await Engine3D.init();
    Engine3D.frameRate = 1;
    
    let view = new View3D();
    view.scene = new Scene3D();
    let sky = view.scene.addComponent(SkyRenderer)
    sky.map = new SolidColorSky(new Color(0,0,0))
    view.scene.envMap = sky.map
    view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
    Engine3D.startRenderViews([view]);

    let postProcessing = view.scene.addComponent(PostProcessingComponent);
    let ssr = postProcessing.addPost(SSRPost);
    
    await delay(1000)
    expect(ssr.finalTexture?.width).tobe(window.innerWidth)
    Engine3D.pause()
})

setTimeout(end, 500)

import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Scene3D, SkyRenderer, Object3DUtil } from "@orillusion/core";

// sample to replace hdr sky map
class Sample_HDRSky {
    async run() {
        // init engine
        await Engine3D.init({});
        // init scene
        let scene: Scene3D = createExampleScene().scene;
        let sky = scene.getOrAddComponent(SkyRenderer);
        sky.map = await Engine3D.res.loadHDRTextureCube('/hdri/sunset.hdr');

        // create a basic cube
        scene.addChild(Object3DUtil.GetSingleCube(10, 10, 10, 0.6, 0.6, 0.6));

        // start renderer
        Engine3D.startRenderView(scene.view);
    }

}


new Sample_HDRSky().run();
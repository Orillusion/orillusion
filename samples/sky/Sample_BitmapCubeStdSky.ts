import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Scene3D, SkyRenderer, Object3DUtil } from "@orillusion/core";

// sample to replace standard sky map
class Sample_BitmapCubeStdSky {
    async run() {
        // init engine
        await Engine3D.init({});
        // init scene
        let scene: Scene3D = createExampleScene().scene;
        let sky = scene.getOrAddComponent(SkyRenderer);
        sky.map = await Engine3D.res.loadTextureCubeStd('sky/StandardCubeMap-2.jpg');

        // create a basic cube
        scene.addChild(Object3DUtil.GetSingleCube(10, 10, 10, 0.6, 0.6, 0.6));

        // start renderer
        Engine3D.startRenderView(scene.view);
    }
}

new Sample_BitmapCubeStdSky().run();
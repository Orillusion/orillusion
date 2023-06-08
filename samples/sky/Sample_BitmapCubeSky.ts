import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Scene3D, SkyRenderer, Object3DUtil } from "@orillusion/core";

// sample to replace sky map. (witch contains 6 faces)
class Sample_BitmapCubeSky {
    async run() {
        // init engine
        await Engine3D.init({});
        // init scene
        let scene: Scene3D = createExampleScene().scene;
        let sky = scene.getOrAddComponent(SkyRenderer);
        // load sky texture (nx/px/py/ny/nz/pz), a total of 6 images
        let urls: string[] = [];
        urls.push('textures/cubemap/skybox_nx.png');
        urls.push('textures/cubemap/skybox_px.png');
        urls.push('textures/cubemap/skybox_py.png');
        urls.push('textures/cubemap/skybox_ny.png');
        urls.push('textures/cubemap/skybox_nz.png');
        urls.push('textures/cubemap/skybox_pz.png');

        sky.map = await Engine3D.res.loadTextureCubeMaps(urls);
        // create a basic cube
        scene.addChild(Object3DUtil.GetSingleCube(10, 10, 10, 0.6, 0.6, 0.6));

        // start renderer
        Engine3D.startRenderView(scene.view);

    }
}

new Sample_BitmapCubeSky().run();
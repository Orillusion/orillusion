import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { SolidColorSky, Engine3D, SkyRenderer, Color, Object3DUtil } from "@orillusion/core";

// sample to display solid color sky
class HDRSkyMap {
    async run() {
        // init engine
        await Engine3D.init({});
        GUIHelp.init();
        // init scene
        let scene = createExampleScene().scene;
        // use solid color as background
        let sky = scene.getOrAddComponent(SkyRenderer);
        sky.map = new SolidColorSky(new Color(0.3, 0.5, 0.3, 1));
        //gui
        GUIHelp.addColor(sky.map, 'color');
        GUIHelp.open();
        GUIHelp.endFolder();
        // create a basic cube
        scene.addChild(Object3DUtil.GetSingleCube(10, 10, 10, 0.6, 0.6, 0.6));

        // start renderer
        Engine3D.startRenderView(scene.view);
    }

}

new HDRSkyMap().run();
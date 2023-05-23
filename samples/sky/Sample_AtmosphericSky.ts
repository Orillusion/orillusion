import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { AtmosphericComponent, Engine3D, Scene3D } from "@orillusion/core";

// sample of AtmosphericSky
class Sample_AtmosphericSky {
    async run() {
        // init engine
        await Engine3D.init({});
        // init scene
        let scene: Scene3D = createExampleScene().scene;
        // start renderer
        Engine3D.startRenderView(scene.view);
        // add atmospheric sky
        let component = scene.getComponent(AtmosphericComponent);
        // gui
        GUIHelp.init();
        GUIUtil.renderAtomosphericSky(component);
    }

}

new Sample_AtmosphericSky().run();
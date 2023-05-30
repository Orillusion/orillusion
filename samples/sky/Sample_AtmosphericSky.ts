import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { AtmosphericComponent, Engine3D, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PlaneGeometry, Scene3D, UnLitMaterial } from "@orillusion/core";

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

        setTimeout(() => {
            let texture = component['_atmosphericScatteringSky'];
            let ulitMaterial = new UnLitMaterial();
            ulitMaterial.baseMap = texture.texture2D;
            let obj = new Object3D();
            scene.addChild(obj);
            let r = obj.addComponent(MeshRenderer);
            r.material = ulitMaterial;
            r.geometry = new PlaneGeometry(200, 100);
            scene.addChild(obj);
        }, 2000);
    }

}

new Sample_AtmosphericSky().run();
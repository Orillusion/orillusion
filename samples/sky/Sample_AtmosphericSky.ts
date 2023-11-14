import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { AtmosphericComponent, Engine3D, GPUCullMode, MeshRenderer, Object3D, PlaneGeometry, Scene3D, UnLitMaterial, Vector3 } from "@orillusion/core";

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
        let sky = scene.getComponent(AtmosphericComponent);

        let texture = sky['_atmosphericScatteringSky'];
        let ulitMaterial = new UnLitMaterial();
        ulitMaterial.baseMap = texture.texture2D;
        ulitMaterial.cullMode = GPUCullMode.none;
        let obj = new Object3D();
        scene.addChild(obj);
        let r = obj.addComponent(MeshRenderer);
        r.material = ulitMaterial;
        r.geometry = new PlaneGeometry(100, 50, 1, 1, Vector3.Z_AXIS);
        scene.addChild(obj);

        // gui
        GUIHelp.init();
        GUIUtil.renderAtmosphericSky(sky);
    }
}

new Sample_AtmosphericSky().run();
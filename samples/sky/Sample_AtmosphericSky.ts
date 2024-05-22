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
        let example = createExampleScene();
        let scene: Scene3D = example.scene;
        // start renderer
        Engine3D.startRenderView(scene.view);
        // add atmospheric sky
        let sky = scene.getComponent(AtmosphericComponent);
        sky.sunX = 0.25;
        let y = 100;
        {
            let texture = sky['_atmosphericScatteringSky']['_transmittanceLut'];
            let ulitMaterial = new UnLitMaterial();
            ulitMaterial.baseMap = texture;
            ulitMaterial.cullMode = GPUCullMode.none;
            let obj = new Object3D();
            let r = obj.addComponent(MeshRenderer);
            r.material = ulitMaterial;
            r.geometry = new PlaneGeometry(50, 25, 1, 1, Vector3.Z_AXIS);
            obj.y = y;
            y -= 25;
            scene.addChild(obj);
        }
        {
            let texture = sky['_atmosphericScatteringSky']['_multipleScatteringLut'];
            let ulitMaterial = new UnLitMaterial();
            ulitMaterial.baseMap = texture;
            ulitMaterial.cullMode = GPUCullMode.none;
            let obj = new Object3D();
            let r = obj.addComponent(MeshRenderer);
            r.material = ulitMaterial;
            r.geometry = new PlaneGeometry(25, 25, 1, 1, Vector3.Z_AXIS);
            obj.y = y;
            y -= 25;
            scene.addChild(obj);
        }
        {
            let texture = sky['_atmosphericScatteringSky']['_skyViewLut'];
            let ulitMaterial = new UnLitMaterial();
            ulitMaterial.baseMap = texture;
            ulitMaterial.cullMode = GPUCullMode.none;
            let obj = new Object3D();
            let r = obj.addComponent(MeshRenderer);
            r.material = ulitMaterial;
            r.geometry = new PlaneGeometry(50, 25, 1, 1, Vector3.Z_AXIS);
            obj.y = y;
            y -= 25;
            scene.addChild(obj);
        }
        {
            // _cloudNoiseTexture
            let texture = sky['_atmosphericScatteringSky']['_cloudNoiseTexture'];
            let ulitMaterial = new UnLitMaterial();
            ulitMaterial.baseMap = texture;
            ulitMaterial.cullMode = GPUCullMode.none;
            let obj = new Object3D();
            let r = obj.addComponent(MeshRenderer);
            r.material = ulitMaterial;
            r.geometry = new PlaneGeometry(25, 25, 1, 1, Vector3.Z_AXIS);
            obj.y = y;
            y -= 25;
            scene.addChild(obj);
        }

        {
            let texture = sky['_atmosphericScatteringSky']['_skyTexture'];
            let ulitMaterial = new UnLitMaterial();
            ulitMaterial.baseMap = texture;
            ulitMaterial.cullMode = GPUCullMode.none;
            let obj = new Object3D();
            let r = obj.addComponent(MeshRenderer);
            r.material = ulitMaterial;
            r.geometry = new PlaneGeometry(50, 25, 1, 1, Vector3.Z_AXIS);
            obj.y = y;
            y -= 25;
            scene.addChild(obj);
        }

        

        // gui
        GUIHelp.init();
        GUIUtil.renderAtmosphericSky(sky);
        GUIUtil.renderSceneSetting(scene);
        GUIUtil.renderCameraSetting(example.camera);
    }
}

new Sample_AtmosphericSky().run();
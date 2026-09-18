import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, GPUCullMode, MeshRenderer, Object3D, PlaneGeometry, Scene3D, UnLitMaterial, Vector3 } from "@orillusion/core";
import { AtmosphericComponent } from "@orillusion/atmosphere";

// sample of AtmosphericSky
class Sample_AtmosphericSky {
    async run() {
        // init engine
        await Engine3D.init({});
        // init scene
        let example = createExampleScene();
        let scene: Scene3D = example.scene;
        let camera = example.camera;
        camera.fov = 90;
        // start renderer
        Engine3D.startRenderView(scene.view);
        // add atmospheric sky
        let sky = scene.addComponent(AtmosphericComponent);
        sky.sunX = 0.25;
        let y = 100;
        const settings = {
            displayTextures: true,
        }
        let objs: Object3D[] = [];
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
            objs.push(obj);
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
            objs.push(obj);
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
            objs.push(obj);
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
            objs.push(obj);
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
            objs.push(obj);
        }

        
        // gui
        GUIHelp.init();
        const name = 'AtmosphericSky';
        GUIHelp.addFolder(name);
        GUIHelp.add(sky, 'sunX', 0, 1, 0.01);
        GUIHelp.add(sky, 'sunY', 0.4, 1.6, 0.01);
        GUIHelp.add(sky, 'eyePos', 0, 7000, 1);
        GUIHelp.add(sky, 'sunRadius', 0, 1000, 0.01);
        GUIHelp.add(sky, 'sunRadiance', 0, 100, 0.01);
        GUIHelp.add(sky, 'sunBrightness', 0, 10, 0.01);
        GUIHelp.add(sky, 'hdrExposure', 0, 5, 0.01);
        GUIHelp.add(sky, 'displaySun', 0, 1, 0.01);
        GUIHelp.add(sky, 'enable');
        // bool whether to display the textures
        GUIHelp.add(settings, 'displayTextures').onChange((v) => {
            objs.forEach(obj => {
                obj.transform.enable = v;
            });
        });
        GUIHelp.open();
        GUIHelp.endFolder();

        // add folder for camera
        GUIHelp.addFolder('Camera');
        GUIHelp.add(camera, 'fov', 1, 180, 1);
        GUIHelp.open();
        GUIHelp.endFolder();
    }
}

new Sample_AtmosphericSky().run();
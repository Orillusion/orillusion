import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, CameraUtil, HoverCameraController, View3D, AtmosphericComponent, DirectLight, KelvinUtil, MeshRenderer, LitMaterial } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { EditorPluginManager, SceneEditorPlugin, PropertyEditorPlugin, CreatorPlugin, SlideRenderStateScript } from "@orillusion/editor";
import { IEditorPlugin } from "@orillusion/editor/IEditorPlugin";

class Sample_ClearCoat {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;
        Engine3D.setting.render.debug = true;
        GUIHelp.init();

        await Engine3D.init();

        //config settings
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.0001;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            luminosityThreshold: 0.8,
            strength: 0.86,
            radius: 4,
            debug: false
        };


        this.scene = new Scene3D();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        this.scene.addComponent(SlideRenderStateScript);

        camera.object3D.addComponent(HoverCameraController).setCamera(-25, -5, 300);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
        await this.initScene();

    }

    async initScene() {
        /******** sky *******/
        {
            let sky = this.scene.addComponent(AtmosphericComponent);
            sky.enable = true;
        }
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 124;
            this.lightObj3D.rotationY = 327;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 43;
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }

        {
            let model = (await Engine3D.res.loadGltf('gltfs/apple_vision_pro/scene.gltf', {})) as Object3D;
            let renderList = model.getComponentsInChild(MeshRenderer);
            for (const item of renderList) {
                let material = item.material;
                if (material instanceof LitMaterial) {
                    material.metallic = 1;
                }
            }
            model.transform.scaleX = 10;
            model.transform.scaleY = 10;
            model.transform.scaleZ = 10;
            model.transform.y = -5;

            this.scene.addChild(model);
        }


        EditorPluginManager.instance.setUp<IEditorPlugin>([SceneEditorPlugin, PropertyEditorPlugin, CreatorPlugin]);

        let sceneEditorPlugin = EditorPluginManager.instance.getPlugin(SceneEditorPlugin);
        let creatorPlugin = EditorPluginManager.instance.getPlugin(CreatorPlugin);
        sceneEditorPlugin.setData(this.scene);
        creatorPlugin.setData(this.scene);

        EditorPluginManager.instance.start()
    }
}

new Sample_ClearCoat().run();
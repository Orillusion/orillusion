import { Engine3D, Scene3D, CameraUtil, View3D, AtmosphericComponent, ComponentBase, Time, AxisObject, Object3DUtil, KelvinUtil, DirectLight, Object3D, HoverCameraController, MeshRenderer, LitMaterial, BoxGeometry, UnLit, UnLitMaterial, Interpolator, FXAAPost, PostProcessingComponent, GridObject } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

// sample use component
class Sample_AddRemove {
    view: View3D;
    async run() {
        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 175;
        Engine3D.setting.shadow.shadowBias = 0.0061;

        Engine3D.setting.shadow.shadowBound = 550;
        Engine3D.setting.shadow.shadowBias = 0.018;
        Engine3D.setting.render.useCompressGBuffer = true;

        Engine3D.setting.reflectionSetting.reflectionProbeMaxCount = 8;
        Engine3D.setting.reflectionSetting.reflectionProbeSize = 128;
        Engine3D.setting.reflectionSetting.enable = true;

        Engine3D.setting.render.hdrExposure = 1.0;
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        // add atmospheric sky
        let sky = scene.addComponent(AtmosphericComponent)
        sky.sunY = 0.6;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -30, 300);

        // add a basic direct light
        let lightObj = new Object3D();
        lightObj.rotationX = 45;
        lightObj.rotationY = 60;
        lightObj.rotationZ = 150;
        let dirLight = lightObj.addComponent(DirectLight);
        dirLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        dirLight.intensity = 3;
        scene.addChild(lightObj);
        sky.relativeTransform = dirLight.transform;

        // add a grid
        let grid = new GridObject(10000, 100);
        scene.addChild(grid)

        // create a view with target scene and camera
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(this.view);

        // let postProcessing = scene.addComponent(PostProcessingComponent);
        // postProcessing.addPost(FXAAPost);

        await this.test();
    }

    private async test() {
        let list: Object3D[] = [];
        let player = await Engine3D.res.loadGltf('gltfs/anim/Minion_Lane_Super_Dawn/Minion_Lane_Super_Dawn.glb');
        // gui
        GUIHelp.init();
        GUIHelp.addButton("add", async () => {
            /******** player1 *******/
            let clone = player.clone()
            clone.transform.x = Math.random() * 100 - 50;
            clone.transform.y = Math.random() * 100 - 50;
            clone.transform.z = Math.random() * 100 - 50;
            clone.transform.scaleX = 20;
            clone.transform.scaleY = 20;
            clone.transform.scaleZ = 20;

            this.view.scene.addChild(clone);
            list.push(clone);
        });

        GUIHelp.addButton("remove", () => {
            let index = Math.floor(list.length * Math.random());
            let obj = list[index];
            if (obj) {
                list.splice(index, 1)
                this.view.scene.removeChild(obj)
                obj.destroy(true);
            }
        });

        GUIHelp.open();
    }
}

new Sample_AddRemove().run();
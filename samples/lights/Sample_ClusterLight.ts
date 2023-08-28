import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, Vector3, View3D, SphereGeometry, Object3D, MeshRenderer, LitMaterial, PointLight, BoxGeometry, Object3DUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

// sample of point light shadow
class Sample_ClusterLight {
    scene: Scene3D;
    lightObj: Object3D;
    async run() {

        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;

        await Engine3D.init({});

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        //set camera data
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(0, -45, 50);

        await this.initScene(this.scene);
        sky.relativeTransform = this.lightObj.transform;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let lightObj3D = this.lightObj = new Object3D();
        lightObj3D.y = 25;

        //make point light
        let pointLight = lightObj3D.addComponent(PointLight);
        pointLight.range = 100;
        pointLight.intensity = 5;
        pointLight.castShadow = true;
        scene.addChild(lightObj3D);

        //show gui
        GUIHelp.init()
        GUIUtil.showPointLightGUI(pointLight);

        //create floor
        let floor = Object3DUtil.GetSingleCube(10, 1, 10, 0.5, 0.5, 0.5);
        this.scene.addChild(floor);
    }
}

new Sample_ClusterLight().run();
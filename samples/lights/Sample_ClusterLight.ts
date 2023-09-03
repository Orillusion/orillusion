import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, Vector3, View3D, SphereGeometry, Object3D, MeshRenderer, LitMaterial, PointLight, BoxGeometry, Object3DUtil, DirectLight, KelvinUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

// sample of point light shadow
class Sample_ClusterLight {
    scene: Scene3D;
    lightObj: Object3D;
    async run() {

        Engine3D.setting.render.zPrePass = true;
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = true;

        await Engine3D.init({});

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        //set camera data
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(0, -45, 100);

        await this.initScene(this.scene);
        // sky.relativeTransform = this.lightObj.transform;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            let lightObj3D = new Object3D();
            lightObj3D.name = "asd";
            lightObj3D.rotationX = 46;
            lightObj3D.rotationY = 62;
            lightObj3D.rotationZ = 0;
            let sunLight = lightObj3D.addComponent(DirectLight);
            sunLight.intensity = 65;
            sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
            sunLight.castShadow = true;
            GUIUtil.renderDirLight(sunLight);
            scene.addChild(lightObj3D);
        }
        //show gui
        GUIHelp.init()


        //create floor
        let floor = Object3DUtil.GetSingleCube(100, 1, 100, 0.5, 0.5, 0.5);
        scene.addChild(floor);
    }
}

new Sample_ClusterLight().run();
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { AtmosphericComponent, BoxGeometry, CameraUtil, Color, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PointLight, Scene3D, SphereGeometry, View3D, } from "@orillusion/core";
import { PointLightsScript } from "./PointLightsScript";

class Sample_LightEnable {
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    lightObj: any;
    constructor() { }

    async run() {

        await Engine3D.init({});

        GUIHelp.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);
        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        //set camera data
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(0, -25, 500);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderViews([view]);
    }

    initScene(scene: Scene3D) {
        let lightObj3D = new Object3D();
        let render = lightObj3D.addComponent(MeshRenderer);
        render.geometry = new SphereGeometry(5, 30, 30);
        render.material = new LitMaterial();

        scene.addChild(lightObj3D);


        let cube = new BoxGeometry(10, 10, 10);
        let mat = new LitMaterial();

        // make 20 box
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                let box = new Object3D();
                let mr2 = box.addComponent(MeshRenderer);
                mr2.geometry = cube;
                mr2.material = mat;
                scene.addChild(box);

                box.transform.x = i * 40 - 200;
                box.transform.y = 5;
                box.transform.z = j * 40 - 200;
            }
        }

        //create floor
        let floor = Object3DUtil.GetSingleCube(5000, 1, 5000, 0.5, 0.5, 0.5);
        this.scene.addChild(floor);

        for (let i = 0; i < 5; i++) {
            let pointLight = new Object3D();
            pointLight.name = "pointLight_" + i;
            let script = pointLight.addComponent(PointLight);
            script.lightColor = Color.random();
            script.intensity = 6 * Math.random() + 3;
            script.range = 45 * Math.random() + 80;
            script.castShadow = true;
            pointLight.x = i * 55 + 15;
            pointLight.y = 5;
            pointLight.z = 0;
            scene.addChild(pointLight);

            let obj = {};
            obj[pointLight.name + ":enable"] = true;
            GUIHelp.add(obj, pointLight.name + ":enable").onChange((e) => {
                script.enable = e;
            });

            let obj2 = {};
            obj2[pointLight.name + ":castShadow"] = true;
            GUIHelp.add(obj2, pointLight.name + ":castShadow").onChange((e) => {
                script.castShadow = e;
            });
        }


    }
}

new Sample_LightEnable().run();
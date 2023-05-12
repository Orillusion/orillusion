import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { AtmosphericComponent, BoxGeometry, CameraUtil, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PointLight, Scene3D, SphereGeometry, View3D, } from "@orillusion/core";
import { PointLightsScript } from "./PointLightsScript";

class Sample_PointLight {
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    lightObj: any;
    constructor() { }

    async run() {

        await Engine3D.init({});

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
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

    public debug(light: PointLight) {
        GUIHelp.addFolder('PointLight' + light.name);
        GUIHelp.addColor(light, 'lightColor');
        GUIHelp.add(light.transform, 'x', -1000, 1000.0, 0.01);
        GUIHelp.add(light.transform, 'y', -1000, 1000.0, 0.01);
        GUIHelp.add(light.transform, 'z', -1000, 1000.0, 0.01);

        GUIHelp.add(light, 'r', 0.0, 1.0, 0.001);
        GUIHelp.add(light, 'g', 0.0, 1.0, 0.001);
        GUIHelp.add(light, 'b', 0.0, 1.0, 0.001);
        GUIHelp.add(light, 'intensity', 0.0, 1500.0, 0.001);
        GUIHelp.add(light, 'at', 0.0, 1600.0, 0.001);
        GUIHelp.add(light, 'radius', 0.0, 1000.0, 0.001);
        GUIHelp.add(light, 'range', 0.0, 1000.0, 0.001);
        GUIHelp.add(light, 'quadratic', 0.0, 2.0, 0.001);
        GUIHelp.endFolder();
    }


    initScene(scene: Scene3D) {
        let lightObj3D = new Object3D();
        let render = lightObj3D.addComponent(MeshRenderer);
        render.geometry = new SphereGeometry(5, 30, 30);
        render.material = new LitMaterial();

        scene.addChild(lightObj3D);

        let pointlights = new Object3D();
        let script = pointlights.addComponent(PointLightsScript);
        script.beginAnim();
        scene.addChild(pointlights);

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
        let floor = Object3DUtil.GetSingleCube(2000, 1, 2000, 0.5, 0.5, 0.5);
        this.scene.addChild(floor);
    }
}

new Sample_PointLight().run();
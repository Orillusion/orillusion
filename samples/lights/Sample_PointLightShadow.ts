import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, Vector3, View3D, SphereGeometry, Object3D, MeshRenderer, LitMaterial, PointLight, BoxGeometry, Object3DUtil } from "@orillusion/core";

// sample of point light shadow
class Sample_PointLightShadow {
    scene: Scene3D;

    async run() {

        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;

        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        //set camera data
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(0, -45, 500);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    //show point light gui controller
    private showLightGUI(light: PointLight) {
        GUIHelp.init();
        GUIHelp.addFolder('PointLight');
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

        GUIHelp.open();
        GUIHelp.endFolder();
    }

    async initScene(scene: Scene3D) {
        let lightObj3D = new Object3D();
        lightObj3D.y = 25;

        //make point light
        let pointLight = lightObj3D.addComponent(PointLight);
        pointLight.range = 100;
        pointLight.intensity = 5;
        pointLight.castShadow = true;
        scene.addChild(lightObj3D);

        //show gui
        this.showLightGUI(pointLight);

        let cubeGeometry = new BoxGeometry(10, 10, 10);
        let litMaterial = new LitMaterial();

        //make 20 box to receive light and cast shadow
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                let box = new Object3D();
                let renderer = box.addComponent(MeshRenderer);
                renderer.geometry = cubeGeometry;
                renderer.material = litMaterial;
                renderer.castShadow = true;
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

new Sample_PointLightShadow().run();
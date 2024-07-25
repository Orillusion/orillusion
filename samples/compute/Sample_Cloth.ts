import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { AtmosphericComponent, BoxGeometry, CameraUtil, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry, View3D, webGPUContext } from '@orillusion/core';
import { ClothSimulator } from "./cloth/ClothSimulator";

export class Demo_Cloth {
    constructor() {
    }

    async run() {
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBias = 0.0002;

        await Engine3D.init({});

        GUIHelp.init();

        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        await this.initScene(scene);

        let camera = CameraUtil.createCamera3DObject(scene);

        camera.perspective(60, webGPUContext.aspect, 0.01, 10000.0);
        let ctl = camera.object3D.addComponent(HoverCameraController);
        ctl.setCamera(30, -28, 2);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.roughness = 0.8;
        mat.metallic = 0.1;

        let sphere = new Object3D();
        sphere.transform.z = 0.5;
        let mr = sphere.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(0.16, 16, 16);
        mr.material = mat;//new HDRLitMaterial();
        mr.castShadow = true;
        scene.addChild(sphere);

        let cloth = new Object3D();
        let simulator = cloth.addComponent(ClothSimulator);
        simulator.castShadow = true;
        simulator.SetInteractionSphere(sphere);
        scene.addChild(cloth);

        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.8;
            let plane = new Object3D();
            plane.transform.y = -1;
            let planeMesh = plane.addComponent(MeshRenderer);
            planeMesh.geometry = new PlaneGeometry(100, 100);
            planeMesh.material = mat;
            planeMesh.receiveShadow = true;
            scene.addChild(plane);
        }

        {
            var lightObj = new Object3D();
            lightObj.x = 0;
            lightObj.y = 0;
            lightObj.z = 0;
            lightObj.rotationX = 45;
            lightObj.rotationY = 0;
            lightObj.rotationZ = 0;
            let lc = lightObj.addComponent(DirectLight);
            lc.intensity = 3;
            lc.castShadow = true;
            scene.addChild(lightObj);
        }

        {
            let poleMat = new LitMaterial();


            let pole_L = new Object3D();
            pole_L.transform.y = -0.25;
            pole_L.transform.x = -0.59;
            let mr = pole_L.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(0.02, 1.5, 0.02);
            mr.material = poleMat
            mr.castShadow = true;
            scene.addChild(pole_L);

            let pole_R = new Object3D();
            pole_R.transform.y = -0.25;
            pole_R.transform.x = 0.59;
            mr = pole_R.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(0.02, 1.5, 0.02);
            mr.material = poleMat
            mr.castShadow = true;
            scene.addChild(pole_R);

            let pole_T = new Object3D();
            pole_T.transform.y = 0.5;
            mr = pole_T.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(1.2, 0.02, 0.02);
            mr.material = poleMat
            mr.castShadow = true;
            scene.addChild(pole_T);
        }
    }
}

import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { AtmosphericComponent, CameraUtil, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, View3D } from '@orillusion/core';
import { HairSimulator } from "./hair/HairSimulator";

export class Demo_Hair {
    constructor() {
    }

    async run() {
        await Engine3D.init({});
        
        GUIHelp.init();

        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        await this.initScene(scene);

        let camera = CameraUtil.createCamera3DObject(scene);
        
        camera.perspective(60, window.innerWidth / window.innerHeight, 0.01, 10000.0);
        let ctl = camera.object3D.addComponent(HoverCameraController);
        ctl.distance = 5;

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.roughness = 0.01;

        let sphere = new Object3D();
        // sphere.transform.x = 0.0;
        // sphere.transform.y = 0.0;
        // sphere.transform.z = 0.0;
        let mr = sphere.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1.0, 16, 16);
        mr.material = mat;//new HDRLitMaterial();
        mr.castShadow = true;
        // scene.addChild(sphere);

        let HairTexture = await Engine3D.res.loadTexture("textures/hairTexture.png");
        var obj = new Object3D();
        let simulator = obj.addComponent(HairSimulator);
        simulator.SetInteractionSphere(sphere, HairTexture);
        scene.addChild(obj);
    }
}

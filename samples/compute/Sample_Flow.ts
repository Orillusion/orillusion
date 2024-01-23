import { AtmosphericComponent, CameraUtil, Engine3D, HoverCameraController, Object3D, Scene3D, Vector3, View3D, webGPUContext } from '@orillusion/core';
import { FlowSimulator } from "./flow/FlowSimulator";

export class Demo_Flow {
    constructor() {
    }

    async run() {
        await Engine3D.init({});

        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        await this.initScene(scene);

        let camera = CameraUtil.createCamera3DObject(scene);
        
        camera.perspective(60, webGPUContext.aspect, 0.01, 10000.0);
        let ctl = camera.object3D.addComponent(HoverCameraController);
        ctl.setCamera(0, 0, 4, new Vector3(0, 1, 0));
        ctl.maxDistance = 1000;

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let obj = new Object3D();
        obj.addComponent(FlowSimulator);
        scene.addChild(obj);
    }
}

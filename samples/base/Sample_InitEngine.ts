import { Engine3D, Scene3D, CameraUtil, View3D, AtmosphericComponent } from "@orillusion/core";

// init engine
class Sample_InitEngine {
    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        // add atmospheric sky
        scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);
    }
}

new Sample_InitEngine().run();
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, Object3D } from "@orillusion/core";

export class Sample_JobsLoad {
    async run() {
        await Engine3D.init({});

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        let hover = camera.object3D.addComponent(HoverCameraController);
        hover.setCamera(45, -45, 10);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);

        await this.initScene(scene);
    }

    async initScene(scene: Scene3D) {
        let jobs: Promise<Object3D>[] = [];
        jobs.push(Engine3D.res.loadGltf('gltfs/a/scene.gltf'));
        jobs.push(Engine3D.res.loadGltf('gltfs/b/scene.gltf'));
        let objs = await Promise.all(jobs);

        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
            scene.addChild(obj);
        }
    }
}

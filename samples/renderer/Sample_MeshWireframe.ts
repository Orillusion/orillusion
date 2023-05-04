import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, FlyCameraController, View3D, Object3D, MeshRenderer, DirectLight, Vector3, Color } from "@orillusion/core";

export class Sample_MeshWireframe {
    async run() {
        await Engine3D.init();

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(scene);
        mainCamera.perspective(45, webGPUContext.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(FlyCameraController);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        await this.initScene(view);

        Engine3D.startRenderView(view);
    }

    async initScene(view: View3D) {
        let monkey = (await Engine3D.res.loadGltf('gltfs/dog/dog.gltf', {})) as Object3D;
        monkey.localScale.set(500, 500, 500);
        let mrs = monkey.getComponentsInChild(MeshRenderer);
        mrs.forEach((mr) => {
            mr.drawWireFrame();
        });
        view.scene.addChild(monkey);

        {
            let obj = new Object3D();
            let light = obj.addComponent(DirectLight);
            light.debug();
            view.scene.addChild(obj);
        }

        Engine3D.getRenderJob(view).graphic3D.drawLines('t0', [Vector3.ZERO, new Vector3(10, 0, 0)], Color.COLOR_RED);
        Engine3D.getRenderJob(view).graphic3D.drawLines('t1', [Vector3.ZERO, new Vector3(0, 10, 0)], Color.COLOR_GREEN);
        Engine3D.getRenderJob(view).graphic3D.drawLines('t2', [Vector3.ZERO, new Vector3(0, 0, 10)], Color.COLOR_BLUE);
    }

}

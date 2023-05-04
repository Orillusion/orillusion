import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { CameraUtil } from "../../src/util/CameraUtil";

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

import { Stats } from "@orillusion/stats";
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, Matrix4, UnLitMaterial, PlaneGeometry } from '@orillusion/core';

export class Sample_LoadVox {

    async run() {
        await Engine3D.init();

        let scene = new Scene3D();
        scene.addComponent(Stats);
        scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -15, 10);

        this.initScene(scene);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let model = await Engine3D.res.loadVox('voxs/chr_knight.vox');
        model.rotationX = -90;
        scene.addChild(model);

        // let model = await Engine3D.res.loadVox('voxs/chr_knight2.vox');
        // model.rotationX = -90;
        // scene.addChild(model);

        if (false) {
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(10, 10);
            let mat = new LitMaterial();
            // mat.roughness = 0.8;
            mr.material = mat;
            scene.addChild(obj);
        }
    }
}

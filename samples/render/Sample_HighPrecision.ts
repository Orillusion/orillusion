import { Engine3D, Scene3D, AtmosphericComponent, View3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, SphereGeometry, UnLitMaterial, BoxGeometry, SkyRenderer, Color } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

export class Sample_HighPrecision {

    async run() {
        Engine3D.setting.render.useLogDepth = true;

        await Engine3D.init();

        let scene = new Scene3D();

        GUIHelp.init();

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1.0, 6000 * 10000.0);
        camera.object3D.z = 3;

        let cameraController = camera.object3D.addComponent(HoverCameraController);
        cameraController.setCamera(20, -45, 1500 * 10000.0);
        cameraController.minDistance = 601 * 10000.0;
        cameraController.maxDistance = 6000 * 10000.0;

        this.initScene(scene);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            let obj = new Object3D();
            obj.rotationX = -90;
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(600 * 10000.0, 128, 128);
            let mat = new UnLitMaterial();
            mat.baseMap = await Engine3D.res.loadTexture('textures/earth/8k_earth_daymap.jpg');
            mr.material = mat;
            scene.addChild(obj);
        }

        {
            let obj = new Object3D();
            obj.x = 600 * 10000.0;
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(600 * 10000.0, 100 * 10000.0, 100 * 10000.0);
            let mat = new UnLitMaterial();
            mat.baseColor = new Color(1, 0, 0)
            mr.material = mat;
            scene.addChild(obj);
        }

        {
            let obj = new Object3D();
            obj.y = 600 * 10000.0;
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(100 * 10000.0, 600 * 10000.0, 100 * 10000.0);
            let mat = new UnLitMaterial();
            mat.baseColor = new Color(0, 1, 0)
            mr.material = mat;
            scene.addChild(obj);
        }

        {
            let obj = new Object3D();
            obj.z = 600 * 10000.0;
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(100 * 10000.0, 100 * 10000.0, 600 * 10000.0);
            let mat = new UnLitMaterial();
            mat.baseColor = new Color(0, 0, 1)
            mr.material = mat;
            scene.addChild(obj);
        }
    }
}

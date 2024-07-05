import { Engine3D, Scene3D, AtmosphericComponent, View3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, SphereGeometry, UnLitMaterial, BoxGeometry, SkyRenderer, Color, Vector3 } from "@orillusion/core";

export class Sample_LogDepth {
    async run() {
        Engine3D.setting.render.useLogDepth = true;
        await Engine3D.init();

        let scene = new Scene3D();
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1.0, 6000 * 10000.0);

        let cameraController = camera.object3D.addComponent(HoverCameraController);
        cameraController.setCamera(20, -45, 2000 * 10000.0);
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

        let boxGeo = new BoxGeometry(10000.0, 10000.0, 10000.0)
        for(let i = 0; i < 100; i++)
        {
            let parant = new Object3D();
            let obj = new Object3D();
            obj.x = 600 * 10000.0;
            obj.localScale = new Vector3(50 + Math.random() * 300, 10 + Math.random() * 10, 10 + Math.random());
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = boxGeo;
            let mat = new UnLitMaterial();
            mat.baseColor = new Color(Math.random(), Math.random(), Math.random())
            mr.material = mat;
            parant.addChild(obj);
            parant.rotationX = Math.random() * 360;
            parant.rotationY = Math.random() * 360;
            parant.rotationZ = Math.random() * 360;
            scene.addChild(parant);
        }
    }
}

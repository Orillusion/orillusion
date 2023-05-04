import { Stats } from "@orillusion/stats";
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, HoverCameraController, Object3D, MeshRenderer, LitMaterial, PlaneGeometry, BoxGeometry, PointLight, Color, SpotLight, SphereGeometry, UUID, Vector3 } from "@orillusion/core";

export class Sample_GraphicDraw {
    async run() {
        await Engine3D.init();



        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        let mainCamera = CameraUtil.createCamera3DObject(scene);
        mainCamera.perspective(45, webGPUContext.aspect, 1, 5000.0);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        this.initScene(view);

        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, -45, 100);
        hoverCameraController.maxDistance = 5000;



        Engine3D.startRenderView(view);
    }

    private initScene(view: View3D) {
        if (true) {
            let obj = new Object3D();
            obj.y = -20;
            view.scene.addChild(obj);
            let mr = obj.addComponent(MeshRenderer);
            mr.receiveShadow = true;
            mr.material = new LitMaterial();
            mr.geometry = new PlaneGeometry(2000, 2000);
        }

        if (true) {
            let obj = new Object3D();
            obj.x = 50;
            obj.y = 25;
            view.scene.addChild(obj);
            let mr = obj.addComponent(MeshRenderer);
            mr.material = new LitMaterial();
            mr.geometry = new BoxGeometry(10, 50, 10);
        }

        if (true) {
            let obj = new Object3D();
            view.scene.addChild(obj);
            let light = obj.addComponent(PointLight);
            light.lightColor = new Color(0.0, 0.8, 1.0, 1.0);
            light.debug();
            // light.debugDraw(true);
        }

        if (true) {
            let obj = new Object3D();
            obj.y = 10;
            obj.z = -200;
            obj.rotationX = 45;
            obj.rotationY = 90;
            view.scene.addChild(obj);
            let light = obj.addComponent(SpotLight);
            light.lightColor = new Color(0.0, 0.8, 1.0, 1.0);
            light.outerAngle = 45;
            light.debug();
            light.debugDraw(true);
        }

        if (true) {
            let obj = new Object3D();
            obj.z = -20;
            view.scene.addChild(obj);
            let mr = obj.addComponent(MeshRenderer);
            mr.material = new LitMaterial();
            mr.geometry = new SphereGeometry(20, 32, 32);
        }

        Engine3D.getRenderJob(view).graphic3D.drawAxis(UUID());

        if (true) {
            let points = [
                new Vector3(5, 25, 0),
                new Vector3(10, 2.5, 0),
                new Vector3(20, 25, 0),
                new Vector3(25, 5, 0),
                new Vector3(30, 7.5, 0),
                new Vector3(35, 20, 0),
                new Vector3(40, 15, 0),
                new Vector3(48, 4, 0),
            ]
            Engine3D.getRenderJob(view).graphic3D.drawAxis(UUID());
            Engine3D.getRenderJob(view).graphic3D.drawCurve(UUID(), points);
            Engine3D.getRenderJob(view).graphic3D.drawLines(UUID(), points, Color.hexRGBColor(Color.GREEN));
            Engine3D.getRenderJob(view).graphic3D.drawRect(UUID(), new Vector3(-50, 0, 0), 30, 20);
            Engine3D.getRenderJob(view).graphic3D.drawBox(UUID(), new Vector3(-15, 15, 0), new Vector3(5, 25, 10));
            Engine3D.getRenderJob(view).graphic3D.drawCircle(UUID(), new Vector3(-50 + 15, 30, 0), 5, 32, Vector3.Z_AXIS, Color.hexRGBColor(Color.BLUE));
            Engine3D.getRenderJob(view).graphic3D.drawSector(UUID(), new Vector3(-20, 30, 0), 5, 45, 170, 16, Vector3.Z_AXIS);
            Engine3D.getRenderJob(view).graphic3D.drawFillRect(UUID(), new Vector3(-20, 0, 15), 10, 8);
            Engine3D.getRenderJob(view).graphic3D.drawFillCircle(UUID(), new Vector3(0, 0, 15), 5, 32, Vector3.Z_AXIS, Color.hexRGBColor(Color.BLUE));
            Engine3D.getRenderJob(view).graphic3D.drawFillSector(UUID(), new Vector3(20, 0, 15), 5, -45, 90, 16, Vector3.Z_AXIS);
        }
    }
}

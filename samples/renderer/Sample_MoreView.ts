import { Object3D, HoverCameraController, Engine3D, View3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_MoreView {
    lightObj: Object3D;
    hover: HoverCameraController;
    constructor() {
    }

    async run() {
        await Engine3D.init({});

        let views = [
            this.createView_1(),
            this.createView_2(),
        ];

        Engine3D.startRenderViews(views);

        await this.initScene();
    }

    private createView_1() {
        let view = new View3D(0.0, 0, 512, 512);

        view.scene = new Scene3D();
        view.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(view.scene);
        view.camera = mainCamera;
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(-60, -25, 50);
        return view;
    }

    private createView_2() {
        let view = new View3D(512, 512, 512, 512);

        view.scene = new Scene3D();
        view.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(view.scene);
        view.camera = mainCamera;
        mainCamera.perspective(30, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(-60, -25, 50);
        return view;
    }


    async initScene() {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 15;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 0;
            lc.debug();
        }

    }


}

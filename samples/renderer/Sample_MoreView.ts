import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

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

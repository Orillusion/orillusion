import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { SpotLight } from "../../src/components/lights/SpotLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Camera3D } from "../../src/core/Camera3D";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { Vector3 } from "../../src/math/Vector3";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { SphereGeometry } from "../../src/shape/SphereGeometry";

export class Sample_SpotLight {
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    lightObj: any;
    constructor() { }

    async run() {
        Engine3D.setting.occlusionQuery.enable = false;
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.pointShadowBias = 0.075;

        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        cameraObj.name = `cameraObj`;
        let mainCamera = cameraObj.addComponent(Camera3D);
        mainCamera.perspective(37, webGPUContext.aspect, 1, 5000.0);

        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.scene.addChild(cameraObj);

        //set camera data
        this.hoverCameraController.setCamera(0, -45, 1000, new Vector3(0, 0, 0));

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;


        Engine3D.startRenderView(view);
    }

    initScene(scene: Scene3D) {
        {
            let sp = new SphereGeometry(5, 30, 30);

            let spotLight = new Object3D();
            let mr = spotLight.addComponent(MeshRenderer);
            mr.geometry = sp;
            mr.material = new LitMaterial();

            let light = spotLight.addComponent(SpotLight);
            scene.addChild(spotLight);
            spotLight.x = -86;
            spotLight.y = 130;
            spotLight.z = -395;
            spotLight.transform.rotationX = 342;
            spotLight.transform.rotationY = 360;
            spotLight.transform.rotationZ = 199;
            light.lightColor.r = 255 / 255;
            light.lightColor.g = 157 / 255;
            light.lightColor.b = 5 / 255;
            light.intensity = 80;
            light.radius = 1;
            light.range = 787;
            light.outerAngle = 96;
            light.innerAngle = 0;
            light.castShadow = true;

            light.debug();
            light.debugDraw(true);
        }

        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;

        let floor = new Object3D();
        let mr = floor.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(2000, 1, 2000);
        mr.material = mat;
        this.scene.addChild(floor);

        let box = new BoxGeometry(1, 1, 1);
        let wall_w = new Object3D();
        wall_w.localScale = new Vector3(500, 100, 10);
        wall_w.localPosition = new Vector3(0, 50, 0);
        let mrw = wall_w.addComponent(MeshRenderer);
        mrw.geometry = box;
        mrw.material = mat;
        this.scene.addChild(wall_w);

        let wall_a = new Object3D();
        wall_a.localScale = new Vector3(10, 100, 500);
        wall_a.localPosition = new Vector3(250, 50, 0);
        let mra = wall_a.addComponent(MeshRenderer);
        mra.geometry = box;
        mra.material = mat;
        this.scene.addChild(wall_a);

        let wall_d = new Object3D();
        wall_d.localScale = new Vector3(10, 100, 500);
        wall_d.localPosition = new Vector3(-250, 50, 0);
        let mrd = wall_d.addComponent(MeshRenderer);
        mrd.geometry = box;
        mrd.material = mat;
        this.scene.addChild(wall_d);
    }
}

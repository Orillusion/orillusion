import { Engine3D } from "../../src/Engine3D";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { PointLight } from "../../src/components/lights/PointLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { Color } from "../../src/math/Color";
import { Vector3 } from "../../src/math/Vector3";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_AddRemove {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.material.materialChannelDebug = true;

        await Engine3D.init();
        let scene = new Scene3D();
        // scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        mainCamera.object3D.z = -15;
        mainCamera.object3D.addComponent(HoverCameraController);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
        this.singleChildTest(scene);
    }

    private async singleChildTest(scene: Scene3D) {

        let floor = new Object3D();
        let fmr = floor.addComponent(MeshRenderer);
        fmr.geometry = new BoxGeometry(10, 1, 10);
        fmr.material = new LitMaterial();
        floor.transform.y = -2.5;
        scene.addChild(floor);

        let a = new Object3D();
        let b = new Object3D();
        // let c = new Object3D();

        a.addChild(b);
        // b.addChild(c);
        scene.addChild(a);


        let mr = a.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(0.5, 0.5, 5);
        mr.material = new LitMaterial();

        let mr2 = b.addComponent(MeshRenderer);
        mr2.geometry = new BoxGeometry(0.5, 5, 0.5);
        mr2.material = new LitMaterial();

        // let mr3 = c.addComponent(MeshRenderer);
        // mr3.geometry = new BoxGeometry(5, 0.5, 0.5);
        // mr3.material = new LitMaterial();

        // let lightObj = this.addLight( scene , 
        //     new Color( 1, 0, 0, 1 ),
        //     Vector3.ZERO
        // );



        let sunObj = new Object3D();
        let sunLight = sunObj.addComponent(DirectLight);
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(65533);
        sunLight.castShadow = true;
        sunObj.transform.rotationX = 50;
        sunObj.transform.rotationY = 50;
        sunLight.debug();
        scene.addChild(sunObj);
    }



    private addCube(parent: Object3D, color: Color, pos: Vector3, scale: Vector3, rot: Vector3) {
        let mat = new LitMaterial();
        mat.baseColor = color;

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(1, 1, 1);
        mr.material = mat;
        parent.addChild(obj);

        obj.transform.localPosition = pos;
        obj.transform.localRotation = rot;
        obj.transform.localScale = scale;
        return mr;
    }

    private addLight(parent: Object3D, color: Color, pos: Vector3) {
        let lightObj = new Object3D();
        let pointLight = lightObj.addComponent(PointLight);
        pointLight.lightColor = color;
        pointLight.radius = 0.5;
        pointLight.range = 3
        lightObj.transform.x = pos.x;
        lightObj.transform.y = pos.y;
        lightObj.transform.z = pos.z;
        // pointLight.debug();
        parent.addChild(lightObj);
        return pointLight;
    }
}
import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { Color } from "../../src/math/Color";
import { CameraUtil } from "../../src/util/CameraUtil";

export class Sample_fxaa {
    constructor() { }

    async run() {
        await Engine3D.init({});


        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(HoverCameraController);

        let ligthObj = new Object3D();
        ligthObj.transform.rotationX = 65;
        ligthObj.transform.rotationY = 192;
        let dl = ligthObj.addComponent(DirectLight);
        dl.castShadow = true;
        dl.lightColor = new Color(1.0, 0.95, 0.84, 1.0);
        dl.intensity = 1.9;
        scene.addChild(ligthObj);

        let minimalObj = await Engine3D.res.loadGltf('gltfs/wukong/wukong.gltf');
        scene.addChild(minimalObj);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }
}

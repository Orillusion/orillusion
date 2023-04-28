import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_Skeleton {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];

    async run() {
        Engine3D.setting.material.materialDebug = false;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 2;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.00066;
        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, -45, 100);
        hoverCameraController.maxDistance = 1000;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        await this.initScene(this.scene);

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            let root = await Engine3D.res.loadGltf('sample/animation/assets/CesiumMan/CesiumMan_compress.gltf');
            root.scaleX = 30;
            root.scaleY = 30;
            root.scaleZ = 30;
            // root.x -= 60;
            // root.z -= 10;
            // root.rotationX = -90;

            scene.addChild(root);
        }

        {
            let mat = new LitMaterial();
            mat.roughness = 0.85;
            mat.metallic = 0.1;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            mr.material = mat;
            mr.castGI = false;
            mr.castShadow = false;

            mat.debug();
            this.scene.addChild(floor);
        }

        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 144;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 25;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        return true;
    }
}

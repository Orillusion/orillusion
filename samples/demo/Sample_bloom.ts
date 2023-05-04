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
import { Color } from "../../src/math/Color";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";

export class Sample_bloom {
    scene: Scene3D;
    constructor() { }

    async run() {
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        // let hoverCameraController = this.scene.mainCamera.addComponent(FlyCameraController);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -45, 15);

        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene() {
        let ligthObj = new Object3D();
        let dl = ligthObj.addComponent(DirectLight);
        dl.castShadow = true;
        dl.lightColor = new Color(1.0, 0.95, 0.84, 1.0);
        ligthObj.transform.rotationX = 45;
        this.scene.addChild(ligthObj);

        {
            //emisstive
            let lightMat = new LitMaterial();
            lightMat.emissiveMap = Engine3D.res.whiteTexture;
            lightMat.emissiveColor = new Color(1.0, 1.0, 0.0);
            lightMat.emissiveIntensity = 1;

            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3, 3, 3);
            mr.material = lightMat;
            obj.transform.x = -5;
            this.scene.addChild(obj);
        }

        {
            //emisstive
            let lightMat = new LitMaterial();
            lightMat.emissiveMap = Engine3D.res.whiteTexture;
            lightMat.emissiveColor = new Color(0.0, 1.0, 1.0);
            lightMat.emissiveIntensity = 1;

            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3, 3, 3);
            mr.material = lightMat;
            obj.transform.x = 0;
            this.scene.addChild(obj);
        }

        {
            //emisstive
            let lightMat = new LitMaterial();
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3, 3, 3);
            mr.material = lightMat;
            obj.transform.x = 5;
            this.scene.addChild(obj);
        }

        let minimalObj = await Engine3D.res.loadGltf('gltfs/wukong/wukong.gltf');
        this.scene.addChild(minimalObj);
    }
}

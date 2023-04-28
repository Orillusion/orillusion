import { Engine3D } from "../Engine3D";
import { AtmosphericComponent } from "../components/AtmosphericComponent";
import { HoverCameraController } from "../components/controller/HoverCameraController";
import { DirectLight } from "../components/lights/DirectLight";
import { MeshRenderer } from "../components/renderer/MeshRenderer";
import { Camera3D } from "../core/Camera3D";
import { Scene3D } from "../core/Scene3D";
import { View3D } from "../core/View3D";
import { Object3D } from "../core/entities/Object3D";
import { webGPUContext } from "../gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../materials/LitMaterial";
import { BoxGeometry } from "../shape/BoxGeometry";
import { KelvinUtil } from "../util/KelvinUtil";

export class Sample_Base_0 {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;
    // probeSampler: ProbesAtlasTextureSampler;

    constructor() { }

    async run() {
        // EngineSetting.OcclusionQuery.debug = true;
        Engine3D.setting.shadow.shadowBound = 350
        Engine3D.setting.shadow.shadowBias = 0.002;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        // this.scene.addComponent(Stats)
        //offset
        let cameraParent = new Object3D();
        this.scene.addChild(cameraParent);

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        cameraParent.addChild(cameraObj);


        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(15, -15, 10);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // renderJob.addPost(new SSAOPost());
        // 
        // 
        // 
        // 
        Engine3D.startRenderView(view);
    }

    /**
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        //
        {
            let cubeObj = new Object3D();
            let mr = cubeObj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry();
            let mat = new LitMaterial();
            mr.material = mat;
            this.scene.addChild(cubeObj);
        }
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 46;
            this.lightObj.rotationY = 62;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = false;
            lc.intensity = 1.7;
            scene.addChild(this.lightObj);
        }

        {
        }
        return true;
    }

    loop() { }
}

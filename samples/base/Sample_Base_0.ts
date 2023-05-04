import { Stats } from "@orillusion/stats";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, View3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_Base_0 {
    lightObj: Object3D;
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    constructor() { }

    async run() {
        // EngineSetting.OcclusionQuery.debug = true;
        Engine3D.setting.shadow.shadowBound = 350
        Engine3D.setting.shadow.shadowBias = 0.002;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        this.scene.addComponent(Stats);
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

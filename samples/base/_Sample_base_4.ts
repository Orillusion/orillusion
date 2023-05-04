import { Stats } from "@orillusion/stats";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, View3D, DirectLight, KelvinUtil, Vector3, MeshRenderer } from "@orillusion/core";
export class Sample_base_4 {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;
    // probeSampler: ProbesAtlasTextureSampler;

    constructor() { }

    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
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
        this.hoverCameraController.setCamera(-125, -15, 30);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    /**
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 46;
            this.lightObj.rotationY = 62;
            this.lightObj.rotationZ = 360;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 200;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        // let obj = new Object3D();
        // let mr = obj.addComponent(MeshRenderer);
        // mr.geometry = new BoxGeometry();
        // mr.material = new LitMaterial();
        // this.scene.addChild(obj);

        let obj = await Engine3D.res.loadGltf("gltfs/Tree/Tree_8K.gltf");
        obj.transform.localScale = new Vector3(10, 10, 10);
        this.scene.addChild(obj);

        let mrs = obj.getComponentsInChild(MeshRenderer);
        for (const mr of mrs) {
            // mr.material.debug();
        }
    }

    ///
    loop() {

    }
}

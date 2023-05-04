import { Stats } from "@orillusion/stats";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, View3D, DirectLight, KelvinUtil, MeshRenderer, BoxGeometry, LitMaterial, Vector3, Color, BlendMode, GPUCullMode } from "@orillusion/core";

export class Sample_BoxBlendMode {
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
        this.hoverCameraController.setCamera(-125, -15, 1200);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // 

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

        let floor = new Object3D();
        let floorMr = floor.addComponent(MeshRenderer);
        floorMr.geometry = new BoxGeometry();
        let floorMrMat = floorMr.material = new LitMaterial();
        floorMrMat.maskMap = Engine3D.res.grayTexture;
        floor.transform.localScale = new Vector3(2000, 5, 2000);
        floor.transform.y = -2.5 - 0.5;
        // this.scene.addChild(floor);

        let obj2 = new Object3D();
        let mr2 = obj2.addComponent(MeshRenderer);
        mr2.geometry = new BoxGeometry(200, 200, 200);
        let mat2 = mr2.material = new LitMaterial();
        mat2.baseColor = new Color(1.0, 0.0, 0.0, 1.0);
        mat2.maskMap = Engine3D.res.grayTexture;
        obj2.transform.z = 5;
        mat2.blendMode = BlendMode.ADD;

        let mode = {
            NONE: BlendMode.NONE,
            NORMAL: BlendMode.NORMAL,
            ADD: BlendMode.ADD,
            ALPHA: BlendMode.ALPHA,
        }


        // mat2.cullMode = GPUCullMode.front ;
        this.scene.addChild(obj2);

        let modeDict = {};
        modeDict[GPUCullMode.none] = GPUCullMode.none;
        modeDict[GPUCullMode.front] = GPUCullMode.front;
        modeDict[GPUCullMode.back] = GPUCullMode.back;
    }

    ///
    loop() {

    }
}

import { Stats } from "@orillusion/stats";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, View3D, DirectLight, KelvinUtil, MeshRenderer, BoxGeometry, LitMaterial, Color } from "../../src";

export class Sample_changeTexture {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;
    // probeSampler: ProbesAtlasTextureSampler;

    constructor() { }

    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.shadow.shadowBound = 100
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


        mainCamera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(-125, -15, 30);

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





        /******** load hdr sky *******/
        //    let envMap = await Engine3D.res.loadHDRTextureCube('hdri/T_Panorama05_HDRI.HDR');
        //    scene.envMap = envMap;


        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry();
        let mat = mr.material = new LitMaterial();
        mat.maskMap = Engine3D.res.grayTexture;
        this.scene.addChild(obj);

        let obj2 = new Object3D();
        let mr2 = obj2.addComponent(MeshRenderer);
        mr2.geometry = new BoxGeometry();
        let mat2 = mr2.material = new LitMaterial();
        mat2.baseColor = new Color(1.0, 1.0, 1.0, 1.0);
        mat2.maskMap = Engine3D.res.grayTexture;

        let texture_0 = await Engine3D.res.loadTexture('textures/diffuse.jpg');
        let texture_1 = await Engine3D.res.loadTexture('textures/KB3D_NTT_Ads_basecolor.png');

        let count = 0;
        setInterval(() => {
            if (count % 2 == 0) {
                mat2.baseMap = texture_0;
            } else {
                mat2.baseMap = texture_1;
            }
            count++;
        }, 2000);

        obj2.transform.z = 5;
        // mr2.cleanDepth = true ;
        this.scene.addChild(obj2);
    }

    ///
    loop() {

    }
}
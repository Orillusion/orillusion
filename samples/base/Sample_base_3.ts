import { Object3D, Scene3D, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, HoverCameraController, View3D, AxisObject, MeshRenderer, BoxGeometry, UnLitMaterial, DirectLight, KelvinUtil, RenderLayer } from "@orillusion/core";

export class Sample_base_3 {
    lightObj: Object3D;
    scene: Scene3D;
    constructor() { }
    async run() {
        // Engine3D.engineSetting.debug.materialChannelDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.shadowBound = 350;
        Engine3D.setting.shadow.shadowBias = 0.002;
        // EngineSetting.OcclusionQuery.debug = true;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        this.scene.addChild(cameraObj);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(
            HoverCameraController
        );
        hoverCameraController.setCamera(45, 0, 10);

        // let giValue = new Object3D();
        // giValue.addComponent(GlobalIlluminationComponent);
        // this.scene.addChild(giValue);

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
        let cubeObj = new Object3D();
        {
            let projectObj = new Object3D();
            projectObj.addChild(new AxisObject(10));
            this.scene.addChild(projectObj);

            // cubeObj.addChild(new AxisObject(10));
            let mr = cubeObj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry();
            // mr.material = new LitMaterial();
            mr.material = new UnLitMaterial();
            projectObj.addChild(cubeObj);
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
            /******** load hdr sky *******/
            let envMap = await Engine3D.res.loadHDRTextureCube(
                "hdri/T_Panorama05_HDRI.HDR"
            );
            // need delay
            setTimeout(() => {
                scene.envMap = envMap;
            }, 1000);
            /******** load hdr sky *******/
        }

        {
            // let count = 10000 ;
            // let tid = setInterval(() => {
            //     let cloneCube = cubeObj.clone();
            //     cloneCube.transform.x = Math.random() * 100 ;
            //     cloneCube.transform.y = Math.random() * 100 ;
            //     cloneCube.transform.z = Math.random() * 100 ;
            //     this.scene.addChild(cloneCube);
            //     console.log("add one cube" , count );
            //     count--;
            //     if(count == 0){
            //         clearTimeout(tid);
            //     }
            // }, 16 );
        }

        {
            let count = 10;
            for (let i = 0; i < count; i++) {
                let cloneCube = cubeObj.clone();
                cloneCube.transform.x = Math.random() * 100;
                cloneCube.transform.y = Math.random() * 100;
                cloneCube.transform.z = Math.random() * 100;
                cloneCube.renderLayer = RenderLayer.StaticBatch;
                this.scene.addChild(cloneCube);
                // console.log("add one cube" , count );
            }
        }
        return true;
    }

    loop() { }
}

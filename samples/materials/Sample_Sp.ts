import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, CameraUtil, webGPUContext, View3D, AtmosphericComponent } from "@orillusion/core";

export class Sample_Sp {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 0 } });

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 5,
            brightness: 0.86,
            debug: true

        };

        this.scene = new Scene3D();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(25, -5, 100);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        // 

        // 




        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {

            let atmospheric = this.scene.addComponent(AtmosphericComponent);
            atmospheric.sunY = 0.62;
            atmospheric.sunRadiance = 47;
            //  this.scene.showSky() ; = false;
            // let hdr = await Engine3D.res.loadHDRTexture("hdri/1428_v5_low.hdr");
            // this.scene.envMap = hdr ;
            this.scene.exposure = 1;
            this.scene.roughness = 0.56;
        }
        /******** light *******/
        {
            // this.lightObj = new Object3D();
            // this.lightObj.rotationX = 57;
            // this.lightObj.rotationY = 148;
            // this.lightObj.rotationZ = 10;
            // let lc = this.lightObj.addComponent(DirectLight);
            // lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            // lc.castShadow = true;
            // lc.intensity = 18;
            // lc.dirFix = -1 ;
            // lc.debug();
            // this.scene.addChild(this.lightObj);
        }

        {
            let obj3 = (await Engine3D.res.loadGltf('gltfs/NFTs/DH.gltf', {})) as Object3D;
            obj3.transform.x = 10;
            obj3.transform.z = 20;
            obj3.transform.scaleX = 10;
            obj3.transform.scaleY = 10;
            obj3.transform.scaleZ = 10;
            obj3.transform.y = 5;
            this.scene.addChild(obj3);
        }
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}

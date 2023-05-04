import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, CameraUtil, webGPUContext, View3D, SSRPost, HDRBloomPost, AtmosphericComponent, DirectLight, KelvinUtil, Time } from "@orillusion/core";

export class Sample_FlightHelmet {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;
    rotation: boolean = false;
    flightHelmetObj: Object3D;

    constructor() { }

    async run() {
        await Engine3D.init({
            canvasConfig: {
                alpha: true,
                zIndex: 0,
                backgroundImage: '/logo/bg.webp'
            },
            renderLoop: () => this.onRenderLoop(),
        });

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBound = 10;
        Engine3D.setting.shadow.shadowBias = 0.00001;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 0.5,
            brightness: 1.25,
            debug: false
        };

        this.scene = new Scene3D();
        this.scene.hideSky();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        Engine3D.setting.sky.defaultFar = 5000;
        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(-45, -30, 15);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;


        let ssrPost = new SSRPost();
        Engine3D.setting.render.postProcessing.ssao.radius = 0.018;
        Engine3D.setting.render.postProcessing.ssao.aoPower = 1;
        Engine3D.setting.render.postProcessing.gtao.debug = false;
        let hdrBloomPost = new HDRBloomPost();

        ssrPost.roughnessThreshold = 0.02;
        // renderJob.addPost(ssrPost);


        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {


            let atmospheric = this.scene.addComponent(AtmosphericComponent);
            atmospheric.sunY = 0.73;
            atmospheric.sunRadiance = 47;
            // let hdr = await Engine3D.res.loadHDRTexture("hdri/1428_v5_low.hdr");
            // this.scene.envMap = hdr ;
            // this.scene.exposure = 0.08 ;
        }
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 53.2;
            this.lightObj.rotationY = 220;
            this.lightObj.rotationZ = 5.58;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 44;
            // lc.dirFix = -1 ;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        {
            let obj = (await Engine3D.res.loadGltf('PBR/FlightHelmet/FlightHelmet.gltf', {})) as Object3D;
            obj.transform.scaleX = 10;
            obj.transform.scaleY = 10;
            obj.transform.scaleZ = 10;
            obj.transform.y = -2;
            this.scene.addChild(obj);

            this.flightHelmetObj = obj;
        }

    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    onRenderLoop() {
        if (this.flightHelmetObj && this.rotation) {
            this.flightHelmetObj.rotationY += Time.delta * 0.05;
        }
    }
}

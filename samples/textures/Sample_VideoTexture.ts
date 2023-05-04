import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, KelvinUtil, MeshRenderer, PlaneGeometry } from "@orillusion/core";
import { VideoMaterial } from '@orillusion/media-extention/VideoMaterial';
import { VideoTexture } from "@orillusion/media-extention/VideoTexture";

export class Sample_VideoTexture {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        await Engine3D.init({ canvasConfig: { alpha: true, zIndex: 0, backgroundImage: '/logo/bg.webp' } });

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 5,
            brightness: 0.629,
            debug: true
        };



        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        this.scene.hideSky();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(0, 0, 150);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;
        Engine3D.startRenderViews([view]);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            // this.
            //  this.scene.showSky() ; = false;
            // let hdr = await Engine3D.res.loadHDRTexture("hdri/1428_v5_low.hdr");
            // this.scene.envMap = hdr ;
            this.scene.exposure = 1;
            this.scene.roughness = 0.0;
        }
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 57;
            this.lightObj.rotationY = 347;
            this.lightObj.rotationZ = 10;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 6;
            // lc.debug();
            this.scene.addChild(this.lightObj);
        }

        {
            // const stream = await navigator.mediaDevices.getUserMedia({
            //     audio: false,
            //     video: {
            //         width: 1280,
            //         height: 720
            //     }
            // })
            let videoTexture = new VideoTexture();
            await videoTexture.load('/video/dt.mp4')

            let videoMat = new VideoMaterial();
            videoMat.baseMap = videoTexture;
            videoMat.debug();
            let plane = new Object3D();
            plane.rotationX = 90
            let mr = plane.addComponent(MeshRenderer);
            mr.material = videoMat;
            mr.geometry = new PlaneGeometry(100, 100, 1, 1);
            this.scene.addChild(plane);
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

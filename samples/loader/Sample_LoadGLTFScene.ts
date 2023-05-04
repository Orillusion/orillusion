import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, HDRBloomPost, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_LoadGLTFScene {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;
    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.002;

        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 200;

        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 0.5,
            brightness: 1.25,
            debug: false
        };

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(45, -45, 50);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        let bloom = new HDRBloomPost();
        bloom.debug();

        Engine3D.startRenderView(view);

        await this.initScene();
    }


    async initScene() {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 21;
            this.lightObj.rotationY = 108;
            this.lightObj.rotationZ = 10;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 0;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        //dt_scene1
        // let car = (await Engine3D.res.loadGltf('dt_scene/scene_03/scene_03.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        let car = (await Engine3D.res.loadGltf('dt_scene/scene_05/dwt.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        this.scene.addChild(car);

    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}

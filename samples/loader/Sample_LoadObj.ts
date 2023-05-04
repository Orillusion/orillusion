import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, PlaneGeometry } from "@orillusion/core";

export class Sample_LoadObj {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;
    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.material.materialChannelDebug = true;
        // Engine3D.engineSetting.Shadow.enable = true ;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 250;
        Engine3D.setting.shadow.shadowBias = 0.002;
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
        this.hover.setCamera(45, -45, 120);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        // 

        // 




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
            lc.intensity = 34.54;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(2000, 2000); // new BoxGeometry(2000, 1, 2000);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        let car = (await Engine3D.res.loadObj('objs/TextureBox.obj', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        // let car = (await Engine3D.res.loadGltf('gltfs/pbrCar/pbrCar.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        car.transform.scaleX = 0.5;
        car.transform.scaleY = 0.5;
        car.transform.scaleZ = 0.5;
        car.transform.y = 0.5;
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

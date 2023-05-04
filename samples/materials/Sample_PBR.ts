import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry } from "@orillusion/core";

export class Sample_PBR {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(45, -45, 120);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

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
            lc.castShadow = false;
            lc.intensity = 1.7;
            this.scene.addChild(this.lightObj);
        }

        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2000, 1, 2000);
            mr.material = mat;
            // this.scene.addChild(floor);
        }

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                let mat = new LitMaterial();
                mat.baseMap = Engine3D.res.whiteTexture;
                mat.roughness = i / 10;
                mat.metallic = j / 10;
                let obj = new Object3D();
                obj.transform.x = i * 8 - 8 * 10 * 0.5;
                obj.transform.y = 8 * 10 * 0.5 - j * 8;
                let mr = obj.addComponent(MeshRenderer);
                mr.geometry = new SphereGeometry(3, 25, 25);
                mr.material = mat;
                this.scene.addChild(obj);
            }
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

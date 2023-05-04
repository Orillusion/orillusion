import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, webGPUContext, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry } from "@orillusion/core";

export class Sample_DirectLight {
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    lightObj: any;
    constructor() { }

    async run() {
        Engine3D.setting.shadow.enable = true;

        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        cameraObj.name = `cameraObj`;
        let mainCamera = cameraObj.addComponent(Camera3D);
        mainCamera.perspective(37, webGPUContext.aspect, 1, 5000.0);

        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.scene.addChild(cameraObj);

        //set camera data
        this.hoverCameraController.setCamera(0, -45, 1000, new Vector3(0, 50, 0));

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }
    initScene(scene: Scene3D) {
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 0;
            this.lightObj.z = 0;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            scene.addChild(this.lightObj);
        }

        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;

        let floor = new Object3D();
        let mr = floor.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(2000, 1, 2000);
        mr.material = mat;
        this.scene.addChild(floor);
    }
}

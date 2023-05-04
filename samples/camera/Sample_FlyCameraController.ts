import { Object3D, Scene3D, FlyCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, Vector3, View3D, DirectLight, KelvinUtil, AxisObject, LitMaterial, MeshRenderer, BoxGeometry } from "@orillusion/core";

export class Sample_FlyCameraController {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    flyCameraController: FlyCameraController;

    constructor() { }

    async run() {
        Engine3D.setting.shadow.enable = false;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        cameraObj.name = `cameraObj`;
        let mainCamera = cameraObj.addComponent(Camera3D);
        this.scene.addChild(cameraObj);


        mainCamera.perspective(37, webGPUContext.aspect, 1, 5000.0);
        this.flyCameraController = mainCamera.object3D.addComponent(FlyCameraController);

        // set camera data
        this.flyCameraController.setCamera(new Vector3(0, 100, -100), new Vector3(0, 0, 0));

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;



        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            scene.addChild(this.lightObj);
            let axis = new AxisObject(3000);
        }

        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.roughness = 0.85;
        mat.metallic = 0.05;

        {
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2000, 1, 2000);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        {
            let cube = new Object3D();
            let mr = cube.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2000, 1, 2000);
            mr.material = mat;
            this.scene.addChild(cube);
        }

        return true;
    }

    loop() { }
}

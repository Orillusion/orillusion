import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, webGPUContext, Vector3, View3D, PointLight, BoxGeometry, LitMaterial, MeshRenderer, SphereGeometry } from "@orillusion/core";

export class Sample_PointLightShadow {
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    lightObj: any;
    constructor() { }

    async run() {

        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.shadow.pointShadowBias = 0.00001;

        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        cameraObj.name = `cameraObj`;
        let mainCamera = cameraObj.addComponent(Camera3D);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.scene.addChild(cameraObj);

        //set camera data
        this.hoverCameraController.setCamera(0, -45, 120, new Vector3(0, 5, 0));

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    initScene(scene: Scene3D) {
        {
            let po = new Object3D();
            let pl = po.addComponent(PointLight);
            pl.range = 100;
            pl.intensity = 5;
            pl.castShadow = true;
            po.x = -8;
            po.y = 4.47;
            po.z = 7;
            scene.addChild(po);
            pl.debug();
            pl.debugDraw(true);

            let cube = new BoxGeometry(10, 10, 10);
            let mat = new LitMaterial();
            {
                let floor = new Object3D();
                this.scene.addChild(floor);
                let mr = floor.addComponent(MeshRenderer);
                mr.geometry = cube;
                mr.material = mat;
                floor.scaleX = 4;
                floor.scaleY = 0.25;
                floor.scaleZ = 4;
                floor.y = 5 * 0.1;
            }

            {
                let wall_1 = new Object3D();
                this.scene.addChild(wall_1);
                let mr = wall_1.addComponent(MeshRenderer);
                mr.geometry = cube;
                mr.material = mat;

                wall_1.scaleX = 4;
                wall_1.scaleY = 4;
                wall_1.scaleZ = 0.1;
                wall_1.z = -4 * 5;
            }

            {
                let wall_2 = new Object3D();
                this.scene.addChild(wall_2);
                let mr = wall_2.addComponent(MeshRenderer);
                mr.geometry = cube;
                mr.material = mat;

                wall_2.scaleX = 0.1;
                wall_2.scaleY = 4;
                wall_2.scaleZ = 4;
                wall_2.x = -4 * 5;
            }

            {
                let cu = new Object3D();
                this.scene.addChild(cu);
                let mr = cu.addComponent(MeshRenderer);
                mr.geometry = cube;
                mr.material = mat;

                cu.scaleX = 0.25;
                cu.scaleY = 4;
                cu.scaleZ = 0.25;
            }

            {
                let ball = new Object3D();
                this.scene.addChild(ball);
                let mr = ball.addComponent(MeshRenderer);
                mr.geometry = new SphereGeometry(2.5, 35, 35);
                mr.material = mat;

                ball.x = -3.25;
                ball.y = 4;
                ball.z = -2.25;
            }
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

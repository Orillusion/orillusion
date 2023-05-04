import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, Object3DUtil, UnLitMaterial, Color, MeshRenderer } from "@orillusion/core";

export class Sample_CustomMaterial {
    lightObj: Object3D;
    scene: Scene3D;
    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = true;


        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hov = mainCamera.object3D.addComponent(HoverCameraController);
        hov.setCamera(45, -45, 50);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }


    /**
     * @en initScene
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {

        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 77;
            this.lightObj.rotationY = 77;
            this.lightObj.rotationZ = 41;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 3.1415926;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        {
            // for (let i = 0; i < 2000 ; i++) {
            //     let sphere = OBJUtil.Sphere;
            //     sphere.scaleX = 1 ;
            //     sphere.scaleY = 1 ;
            //     sphere.scaleZ = 1 ;
            //     sphere.x = Math.random() * 200 - 100 ;
            //     sphere.y = Math.random() * 10 - 5  ;
            //     sphere.z = Math.random() * 200 - 100  ;
            //     this.scene.addChild(sphere);
            // }

            let floor = Object3DUtil.GetCube();
            floor.scaleX = 1000;
            floor.scaleY = 1;
            floor.scaleZ = 1000;
            this.scene.addChild(floor);

            let Cube = Object3DUtil.GetCube();
            Cube.scaleX = 1;
            Cube.scaleY = 1;
            Cube.scaleZ = 1;
            Cube.x = 2.5;
            Cube.y = 2.5;
            this.scene.addChild(Cube);

            let Cube_left = Object3DUtil.GetCube();
            Cube_left.scaleX = 4;
            Cube_left.scaleY = 4;
            Cube_left.scaleZ = 1;
            Cube_left.x = 4;
            Cube_left.y = 2;
            this.scene.addChild(Cube_left);

            let Cube_right = Object3DUtil.GetCube();
            Cube_right.scaleX = 4;
            Cube_right.scaleY = 4;
            Cube_right.scaleZ = 1;
            Cube_right.x = -4;
            Cube_right.y = 2;
            this.scene.addChild(Cube_right);

            let unlitObj = new Object3D();
            let unlitMat = new UnLitMaterial();
            unlitMat.baseColor = Color.random();
            let mr = unlitObj.addComponent(MeshRenderer);
            mr.geometry = Object3DUtil.CubeMesh;
            mr.material = unlitMat;

            unlitObj.y = 2;
            this.scene.addChild(unlitObj);
        }
        return true;
    }

    private loop(): void { }
}

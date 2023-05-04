import { PointLightsScript } from "@samples/renderer/script/PointLightsScript";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, webGPUContext, Vector3, View3D, SphereGeometry, MeshRenderer, LitMaterial, BoxGeometry } from "@orillusion/core";

export class Sample_PointLight {
    scene: Scene3D;
    hoverCameraController: HoverCameraController;
    lightObj: any;
    constructor() { }

    async run() {

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
        this.hoverCameraController.setCamera(0, -45, 500, new Vector3(0, 50, 0));

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        this.printTileZ(0.1, 5000, 24);
        Engine3D.startRenderViews([view]);
    }

    printTileZ(near: number, far: number, tileZ: number) {
        let str = '';
        for (let i = 0; i <= tileZ; i++) {
            str += 0.1 * Math.pow(5000 / 0.1, i / tileZ) + ",\n"
        }
        console.log(str)
        return;
    }
    initScene(scene: Scene3D) {
        {
            // this.lightObj = new Object3D();
            // this.lightObj.rotationX = 15;
            // this.lightObj.rotationY = 110;
            // this.lightObj.rotationZ = 0;
            // let lc = this.lightObj.addComponent(DirectLight);
            // lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            // lc.castShadow = true;
            // lc.intensity = 2;
            // // lc.debug();
            // this.scene.addChild(this.lightObj);
        }
        {
            let sp = new SphereGeometry(5, 30, 30);
            let pointLight = new Object3D();
            let mr = pointLight.addComponent(MeshRenderer);
            mr.geometry = sp;
            mr.material = new LitMaterial();
            // let light = pointLight.addComponent(PointLight);
            // pointLight.y = 15;
            // light.range = 100;
            // light.intensity = 500;
            // light.castShadow = false;
            scene.addChild(pointLight);
            // light.debug();

            let pointlights = new Object3D();
            let sr = pointlights.addComponent(PointLightsScript);
            sr.beginAnim();
            scene.addChild(pointlights);

            let cube = new BoxGeometry(10, 10, 10);
            let mat = new LitMaterial();

            for (let i = 0; i < 20; i++) {
                for (let j = 0; j < 10; j++) {
                    let box = new Object3D();
                    let mr2 = box.addComponent(MeshRenderer);
                    mr2.geometry = cube;
                    mr2.material = mat;
                    scene.addChild(box);

                    box.transform.x = i * 40 - 200;
                    box.transform.y = 5;
                    box.transform.z = j * 40 - 200;
                }
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

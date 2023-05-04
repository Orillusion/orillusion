import { Stats } from "@orillusion/stats";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, HoverCameraController, View3D, AxisObject, Transform, Object3DUtil } from "../../src";

export class Sample_allocMatrix {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    constructor() { }
    async run() {
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBound = 350
        Engine3D.setting.shadow.shadowBias = 0.002;
        // await Matrix4.init(3000);
        await Engine3D.init({ beforeRender: () => this.loop() });

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);

        this.scene.addChild(cameraObj);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, 0, 1000);

        await this.initScene(this.scene);
        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    /**
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {

        // this.scene.hideSky()
        scene.addChild(new AxisObject(10));
        return true;
    }

    private addCube(count = 0, parent: Object3D) {
        let size = 1000;
        for (let i = 0; i < count; i++) {
            let cube = Object3DUtil.GetSingleCube(
                1, 1, 1,
                Math.random() * 10,
                Math.random() * 10,
                Math.random() * 10,
            );
            cube.x = Math.random() * size - size * 0.5;
            cube.y = Math.random() * size - size * 0.5;
            cube.z = Math.random() * size - size * 0.5;

            cube.rotationX = Math.random() * 360 - 360 * 0.5;
            cube.rotationY = Math.random() * 360 - 360 * 0.5;
            cube.rotationZ = Math.random() * 360 - 360 * 0.5;

            let scale = Math.random() * 4;
            cube.scaleX = scale;
            cube.scaleY = scale;
            cube.scaleZ = scale;
            parent.addChild(cube);
        }
    }

    private list: Transform[];
    loop() {

    }
}

import { Stats } from "@orillusion/stats";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, HoverCameraController, View3D, AxisObject, Transform } from "@orillusion/core";

export class Sample_Base_2 {
    lightObj: Object3D;
    scene: Scene3D;
    constructor() { }
    async run() {
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBound = 350;
        Engine3D.setting.shadow.shadowBias = 0.002;
        await Engine3D.init({ beforeRender: () => this.loop() });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        this.scene.addComponent(Stats);

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        this.scene.addChild(cameraObj);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(
            HoverCameraController
        );
        hoverCameraController.setCamera(45, 0, 10);

        // let giValue = new Object3D();
        // giValue.addComponent(GlobalIlluminationComponent);
        // this.scene.addChild(giValue);

        await this.initScene(this.scene);
        let obj2 = new Object3D();
        this.scene.addChild(obj2);
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
        let cubeObj = new Object3D();
        {
            let projectObj = new Object3D();
            projectObj.addChild(new AxisObject(10));
            this.scene.addChild(projectObj);

            // let mr = cubeObj.addComponent(MeshRenderer);
            // mr.geometry = new BoxGeometry();
            // mr.material = new LitMaterial();
        }

        this.list = [];
        {
            // let count = 1;
            // let obj = new Object3D();
            // obj.bound = new BoundingBox(Vector3.ZERO, new Vector3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
            // for (let i = 0; i < count; i++) {
            //     let cloneCube = cubeObj.clone();
            //     cloneCube.transform.x = Math.random() * 100;
            //     cloneCube.transform.y = Math.random() * 100;
            //     cloneCube.transform.z = Math.random() * 100;
            //     // cloneCube.renderLayer = RenderLayer.StaticBatch;
            //     this.list.push(cloneCube.transform);
            //     // console.log("add one cube" , count );
            //     obj.addChild(cloneCube);
            // }
            // // obj.addComponent(InstanceDrawComponent);
            // this.scene.addChild(obj);
        }
        return true;
    }

    private list: Transform[];
    loop() {
        // for (let i = 0; i < this.list.length; i++) {
        //     const item = this.list[i];
        //     item.rotationX += Time.delta;
        //     item.rotationY += Time.delta;
        //     item.rotationZ += Time.delta;
        // }
    }
}

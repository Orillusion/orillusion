import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, LitMaterial, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_Skeleton {
    lightObj: Object3D;
    scene: Scene3D;
    constructor() { }

    async run() {

        Engine3D.setting.material.materialDebug = false;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 2;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.00066;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, -45, 100);
        hoverCameraController.maxDistance = 1000;

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;


        Engine3D.startRenderView(view);
    }

    private lightBall: Object3D;

    /**
     * @ch 初始化场景内容
     * @en Initialize the scene content
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            let root = await Engine3D.res.loadGltf('gltfs/CesiumMan/CesiumMan_compress.gltf');
            root.scaleX = 30;
            root.scaleY = 30;
            root.scaleZ = 30;
            // root.x -= 60;
            // root.z -= 10;
            // root.rotationX = -90;

            // scene.hideSky();
            scene.addChild(root);

            // for (let nLODLevel = 0; nLODLevel < 5; nLODLevel++) {
            //     let obj = root.getChildByName(`Minion_Lane_Super_Dawn_LOD${nLODLevel}`, true) as Object3D;
            //     obj.transform.x += 2 * nLODLevel;
            // }
        }

        {
            let mat = new LitMaterial();
            mat.roughness = 0.85;
            mat.metallic = 0.1;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            mr.material = mat;
            mr.castGI = false;
            mr.castShadow = false;

            mat.debug();
            this.scene.addChild(floor);
        }

        this.scene.exposure = 1

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 144;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 25;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        return true;
    }

    loop() { }
}

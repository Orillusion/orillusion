import { Object3D, Scene3D, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, HoverCameraController, View3D, AxisObject, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, CameraUtil } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
// sample test
class Sample_Base_1 {
    lightObj: Object3D;
    scene: Scene3D;
    constructor() { }

    async run() {
        Engine3D.setting.shadow.shadowBound = 350
        Engine3D.setting.shadow.shadowBias = 0.002;
        await Engine3D.init({});

        // init scene
        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        // create camera
        let cameraParent = new Object3D();
        let mainCamera = CameraUtil.createCamera3DObject(cameraParent, 'camera');
        this.scene.addChild(cameraParent);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -35, 40);

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
        {
            let projectObj = new Object3D();
            projectObj.addChild(new AxisObject(10));
            this.scene.addChild(projectObj);

            let cubeObj = new Object3D();
            cubeObj.addChild(new AxisObject(10));
            let mr = cubeObj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry();
            mr.material = new LitMaterial();
            projectObj.addChild(cubeObj);

            GUIHelp.init();
            GUIHelp.addFolder(`projectObj`);
            GUIHelp.add(projectObj, 'rotationX', -180, 180, 0.001);
            GUIHelp.add(projectObj, 'rotationY', -180, 180, 0.001);
            GUIHelp.add(projectObj, 'rotationZ', -180, 180, 0.001);
            GUIHelp.endFolder();

            GUIHelp.addFolder(`cubeObj`);
            GUIHelp.add(cubeObj, 'rotationX', -180, 180, 0.001);
            GUIHelp.add(cubeObj, 'rotationY', -180, 180, 0.001);
            GUIHelp.add(cubeObj, 'rotationZ', -180, 180, 0.001);
            GUIHelp.endFolder();
        }

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 46;
            this.lightObj.rotationY = 62;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            scene.addChild(this.lightObj);
        }

        /******** load hdr sky *******/
        let envMap = await Engine3D.res.loadHDRTextureCube('hdri/T_Panorama05_HDRI.HDR');
        setTimeout(() => {
            scene.envMap = envMap;
        }, 500);
        return true;
    }

    loop() { }
}

new Sample_Base_1().run();
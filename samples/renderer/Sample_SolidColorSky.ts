import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, SolidColorSky, Color } from "@orillusion/core";

export class Sample_SolidColorSky {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    constructor() { }

    async run() {
        Engine3D.setting.shadow.enable = true;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });



        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        //offset
        let camerParent = new Object3D();
        this.scene.addChild(camerParent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(HoverCameraController);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;


        Engine3D.startRenderView(view);
    }

    /**
     * @ch initScene
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 115;
            this.lightObj.rotationY = 200;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            lc.radius = 100;
            scene.addChild(this.lightObj);
        }

        this.createSkyTexture();
        return true;
    }

    private skyTexture: SolidColorSky;
    private tempColor: Color = new Color(1, 0, 0, 1);
    private createSkyTexture() {
        this.skyTexture = new SolidColorSky(new Color(0.5, 1.0, 0.8, 1));
        this.scene.envMap = this.skyTexture;
    }

    private loop(): void { }
}

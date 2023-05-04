import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, View3D, DirectLight, KelvinUtil, Time, AtmosphericScatteringSky, AtmosphericScatteringSkySetting } from "@orillusion/core";

export class Sample_AtmosphericSky {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;
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

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        camerParent.addChild(cameraObj);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // renderJob.addPost(new SSAOPost());
        // 
        // 
        Engine3D.startRenderView(view);

    }

    /**
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

        // this.createSkyTexture();
        // let minimalObj = await this.loadModel('PBR/ToyCar/ToyCar.gltf');
        // minimalObj.scaleX = minimalObj.scaleY = minimalObj.scaleZ = 1000;
        // scene.addChild(minimalObj);

        return true;
    }

    private up: boolean = true;
    private updateSky: boolean = true;

    private loop(): void {
        if (this.skyTexture && this.updateSky) {
            let sunY = this.skySetting.sunY;

            if (sunY > 0.8) {
                this.up = false;
                sunY = 0.8;
            } else if (sunY < 0.45) {
                this.up = true;
                sunY = 0.45;
            }
            if (this.up) {
                sunY += Time.delta * 0.00002;
            } else {
                sunY -= Time.delta * 0.00002;
            }
            this.skySetting.sunY = sunY;
            this.skyTexture.apply();
        }
    }

    private skyTexture: AtmosphericScatteringSky;
    private skySetting: AtmosphericScatteringSkySetting;

    private createSkyTexture() {
        this.skyTexture = this.scene.envMap as AtmosphericScatteringSky;
        this.skySetting = this.skyTexture.setting;
    }

}

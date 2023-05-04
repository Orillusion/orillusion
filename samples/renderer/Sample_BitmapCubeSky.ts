import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_BitmapCubeSky {
    lightObj: Object3D;
    scene: Scene3D;

    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.shadowBias = 0.002;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(180, -45, 15);

        await this.initScene(this.scene);


        let urls: string[] = [];
        urls.push('textures/cubemap/skybox_nx.png');
        urls.push('textures/cubemap/skybox_px.png');
        urls.push('textures/cubemap/skybox_py.png');
        urls.push('textures/cubemap/skybox_ny.png');
        urls.push('textures/cubemap/skybox_nz.png');
        urls.push('textures/cubemap/skybox_pz.png');

        let envMap = await Engine3D.res.loadTextureCubeMaps(urls)
        this.scene.envMap = envMap;
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
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 45;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 5.7;
            scene.addChild(this.lightObj);
        }
        return true;
    }

    private loop(): void { }
}

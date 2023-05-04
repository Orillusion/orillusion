import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, TilesRenderer, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_Load_3DTiles {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() {
    }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.render.postProcessing.gtao.debug = false;
        Engine3D.setting.render.postProcessing.taa.debug = false;
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 0.5,
            brightness: 1.25,
            debug: false
        };

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(45, -45, 200);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;





        Engine3D.startRenderView(view);

        await this.initScene();
        let tilesRenderer = new TilesRenderer();
        let group = tilesRenderer.group;
        this.scene.addChild(group);

        await tilesRenderer.loadTileSet('data/test3', 'tileset.json');
    }


    async initScene() {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 21;
            this.lightObj.rotationY = 108;
            this.lightObj.rotationZ = 10;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 34.54;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }
    }

    renderUpdate() {
    }

}

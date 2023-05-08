import { Object3D, Scene3D, Engine3D, AtmosphericComponent, HoverCameraController, View3D, DirectLight, KelvinUtil, MeshRenderer, BoxGeometry, LitMaterial, Vector3, Color, BlendMode, CameraUtil } from "@orillusion/core";

class Sample_ChangeTexture {
    lightObj: Object3D;
    scene: Scene3D;

    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 100
        Engine3D.setting.shadow.shadowBias = 0.00192;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        //camera
        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, Engine3D.aspect, 1, 5000.0);
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(-125, -10, 10);

        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        this.initLight();
        // 
        Engine3D.startRenderView(view);
    }

    private initLight(): void {
        this.lightObj = new Object3D();
        this.lightObj.x = 0;
        this.lightObj.y = 30;
        this.lightObj.z = -40;
        this.lightObj.rotationX = 46;
        this.lightObj.rotationY = 62;
        this.lightObj.rotationZ = 360;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        lc.castShadow = false;
        lc.intensity = 20;
        this.scene.addChild(this.lightObj);
    }

    async initScene() {
        //create first box
        let box1 = new Object3D();
        this.scene.addChild(box1);

        let render1 = box1.addComponent(MeshRenderer);
        render1.geometry = new BoxGeometry(2, 2, 2);
        let material1 = render1.material = new LitMaterial();
        material1.maskMap = Engine3D.res.maskTexture;

        //create second box
        let box2 = new Object3D();
        box2.transform.z = 4;
        this.scene.addChild(box2);

        let render2 = box2.addComponent(MeshRenderer);
        render2.geometry = new BoxGeometry(2, 2, 2);
        let material2 = render2.material = new LitMaterial();
        material2.maskMap = Engine3D.res.maskTexture;

        //load 2 textures for switching display
        let texture_0 = await Engine3D.res.loadTexture('textures/diffuse.jpg');
        let texture_1 = await Engine3D.res.loadTexture('textures/KB3D_NTT_Ads_basecolor.png');

        //auto change texture per 2 second
        let count = 0;
        setInterval(() => {
            if (count % 2 == 0) {
                material2.baseMap = texture_0;
            } else {
                material2.baseMap = texture_1;
            }
            count++;
        }, 2000);

    }

}

new Sample_ChangeTexture().run();
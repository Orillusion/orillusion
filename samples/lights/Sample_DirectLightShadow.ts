import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, CameraUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

//sample of direction light
class Sample_DirectLightShadow {
    scene: Scene3D;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.0001;
        Engine3D.setting.shadow.shadowBound = 100;

        await Engine3D.init({});

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 5000.0);
        //set camera data
        mainCamera.object3D.z = -15;
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(-15, -35, 150);

        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        this.initLight();
        Engine3D.startRenderView(view);

    }

    // create direction light
    private initLight() {
        // add a direction light
        let lightObj3D = new Object3D();
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 15;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;
        lightObj3D.rotationX = 53.2;
        lightObj3D.rotationY = 220;
        lightObj3D.rotationZ = 5.58;

        GUIUtil.renderDirLight(sunLight);
        this.scene.addChild(lightObj3D);

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(20, 100, 20);
        mr.material = new LitMaterial();
        this.scene.addChild(obj);
    }



    initScene() {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        // mat.roughness = 0.4;
        // mat.metallic = 0.6;
        let floor = new Object3D();
        let render = floor.addComponent(MeshRenderer);
        render.geometry = new BoxGeometry(200, 1, 200);
        render.material = mat;
        this.scene.addChild(floor);
    }
}

new Sample_DirectLightShadow().run();
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, CameraUtil, SphereGeometry, Color, Object3DUtil, BlendMode } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

//sample of toggle shadow
class Sample_ShadowToggle {
    scene: Scene3D;
    async run() {
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.02;
        await Engine3D.init({});

        GUIHelp.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        // mainCamera.enableCSM = true;
        mainCamera.perspective(60, Engine3D.aspect, 1, 5000.0);
        //set camera data
        mainCamera.object3D.z = -15;
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(-15, -35, 200);

        sky.relativeTransform = this.initLight();
        this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    // create direction light
    private initLight() {
        let lightObj3D = new Object3D();
        lightObj3D.rotationX = 46;
        lightObj3D.rotationY = 62;
        lightObj3D.rotationZ = 0;
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 4;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;

        this.scene.addChild(lightObj3D);
        GUIUtil.renderDirLight(sunLight, false);
        return sunLight.transform;
    }

    initScene() {
        // add sphere
        {
            let geometry = new SphereGeometry(20, 64, 64);
            let material = new LitMaterial();
            material.name = 'Sphere Material';
            let obj = new Object3D();
            obj.y = 20;
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = geometry;
            mr.material = material;

            this.scene.addChild(obj);
            GUIUtil.renderLitMaterial(material, true);
        }
        //add box
        {
            let geometry = new BoxGeometry(40, 10, 80);
            let material = new LitMaterial();
            material.name = 'Box Material';
            let obj = new Object3D();
            obj.x = 40;
            obj.y = 5;
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = geometry;
            mr.material = material;
            this.scene.addChild(obj);
            GUIUtil.renderLitMaterial(material, true);
        }

        {
            let material = new LitMaterial();
            material.name = 'Floor Material';

            material.baseMap = Engine3D.res.grayTexture;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(10000, 1, 10000);
            mr.material = material;
            this.scene.addChild(floor);
            GUIUtil.renderLitMaterial(material, true);
        }
    }
}

new Sample_ShadowToggle().run();

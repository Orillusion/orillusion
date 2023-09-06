import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, CameraUtil, SphereGeometry, Color, Object3DUtil, BlendMode } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

//sample of direction light
class Sample_DirectLightShadow {
    scene: Scene3D;
    async run() {
        Engine3D.setting.shadow.enable = true;
        // Engine3D.setting.render.zPrePass = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowSize = 1024;
        Engine3D.setting.render.debug = true;
        Engine3D.setting.render.useLogDepth = false;
        Engine3D.setting.occlusionQuery.octree = { width: 1000, height: 1000, depth: 1000, x: 0, y: 0, z: 0 }
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
        GUIUtil.renderDebug();
    }

    // create direction light
    private initLight() {
        // add a direction light
        let lightObj3D = new Object3D();
        lightObj3D.rotationX = 46;
        lightObj3D.rotationY = 62;
        lightObj3D.rotationZ = 0;
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 15;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;

        GUIUtil.renderDirLight(sunLight);
        this.scene.addChild(lightObj3D);
        return sunLight.transform;
    }

    initScene() {
        {
            let geometry = new BoxGeometry(20, 100, 20);
            let material = new LitMaterial();
            // material.blendMode = BlendMode.ADD;
            // let size = 900;
            // for (let i = 0; i < 1; i++) {
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = geometry;
            mr.material = material;
            // obj.transform.x = Math.random() * size - size * 0.5;
            // obj.transform.z = Math.random() * size - size * 0.5;
            this.scene.addChild(obj);
            // }
        }
        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            // mat.roughness = 0.4;
            // mat.metallic = 0.6;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(10000, 1, 10000);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        {
            for (let i = 0; i < 100; i++) {
                let item = Object3DUtil.GetSingleSphere(4, 0.6, 0.4, 0.2);
                let angle = Math.PI * 4 * i / 50;
                item.x = Math.sin(angle) * (50 + i);
                item.z = Math.cos(angle) * (50 + i);
                // item.y = 4;
                this.scene.addChild(item);
            }
        }
    }
}

new Sample_DirectLightShadow().run();

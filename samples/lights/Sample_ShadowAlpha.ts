import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, CameraUtil, SphereGeometry, Color, Object3DUtil, BlendMode, Vector4 } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

//sample of direction light
class Sample_ShadowAlpha {
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
        await this.initScene();

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

    async initScene() {
        let tex = await Engine3D.res.loadTexture("textures/grid.jpg");

        {
            let geometry = new SphereGeometry(20, 100, 20);
            let material = new LitMaterial();
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = geometry;
            mr.material = material;
            this.scene.addChild(obj);
        }
        {
            let mat = new LitMaterial();
            // mat.baseMap = Engine3D.res.grayTexture;
            mat.uvTransform_1 = new Vector4(0, 0, 100, 100);
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(10000, 1, 10000);
            mr.material = mat;
            mat.baseMap = tex;
            this.scene.addChild(floor);
        }
    }
}

new Sample_ShadowAlpha().run();

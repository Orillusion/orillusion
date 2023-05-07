import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, CameraUtil } from "@orillusion/core";

//sample of direction light
class Sample_DirectLight {
    scene: Scene3D;
    lightObj3D: any;

    async run() {
        await Engine3D.init({});

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        //set camera data
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(0, -25, 1000);

        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        this.initLight();
        Engine3D.startRenderView(view);

    }

    // create direction light
    private initLight() {
        this.lightObj3D = new Object3D();
        this.lightObj3D.x = 0;
        this.lightObj3D.y = 30;
        this.lightObj3D.z = -40;
        this.lightObj3D.rotationX = 46;
        this.lightObj3D.rotationY = 62;
        this.lightObj3D.rotationZ = 360;
        let directLight = this.lightObj3D.addComponent(DirectLight);

        //Convert color temperature to color object
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = false;
        directLight.intensity = 20;
        this.showLightGUI(directLight);
        this.scene.addChild(this.lightObj3D);
    }

    // show gui
    // control light direction/color/intensity/indirect
    private showLightGUI(light: DirectLight): void {
        GUIHelp.addFolder('DirectLight');
        GUIHelp.add(light.transform, 'rotationX', 0.0, 360.0, 0.01);
        GUIHelp.add(light.transform, 'rotationY', 0.0, 360.0, 0.01);
        GUIHelp.add(light.transform, 'rotationZ', 0.0, 360.0, 0.01);
        GUIHelp.addColor(light, 'lightColor');
        GUIHelp.add(light, 'intensity', 0.0, 160.0, 0.01);
        GUIHelp.add(light, 'indirect', 0.0, 10.0, 0.01);
        GUIHelp.open();
        GUIHelp.endFolder();
    }

    initScene() {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.roughness = 0.4;
        mat.metallic = 0.6;
        let floor = new Object3D();
        let render = floor.addComponent(MeshRenderer);
        render.geometry = new BoxGeometry(1000, 1, 1000);
        render.material = mat;
        this.scene.addChild(floor);
    }
}

new Sample_DirectLight().run();
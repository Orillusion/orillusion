import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, Object3D, MeshRenderer, UnLitMaterial, DirectLight, KelvinUtil, Color, GPUCullMode, LitMaterial } from "@orillusion/core";

//Sample of change meshRenderer's material 
class Sample_ReplaceMaterial {
    lightObj3D: Object3D;

    async run() {
        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 0 } });

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(0, 0, 20);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);

        this.createLight(scene);

        await this.loadModel(scene);
    }

    //create light
    createLight(scene: Scene3D) {
        this.lightObj3D = new Object3D();
        this.lightObj3D.x = 0;
        this.lightObj3D.y = 30;
        this.lightObj3D.z = -40;
        this.lightObj3D.rotationX = 77;
        this.lightObj3D.rotationY = 77;
        this.lightObj3D.rotationZ = 41;

        let directLight = this.lightObj3D.addComponent(DirectLight);
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = true;
        directLight.intensity = 10;
        scene.addChild(this.lightObj3D);
    }

    async loadModel(scene: Scene3D) {
        let monitor = await Engine3D.res.loadGltf('gltfs/monitor/scene.gltf');
        scene.addChild(monitor);
        monitor.scaleX = monitor.scaleY = monitor.scaleZ = 2;

        // get child by name 'Screen'
        let screen = monitor.getChildByName('Screen') as Object3D;
        let meshRenderer = screen.getComponentsInChild(MeshRenderer)[0];

        let material1 = new UnLitMaterial();
        material1.baseMap = await Engine3D.res.loadTexture('textures/normal.jpg');

        let material2 = new UnLitMaterial();
        material2.baseMap = await Engine3D.res.loadTexture('textures/diffuse.jpg');

        meshRenderer.material = material2;

        // init gui
        GUIHelp.init();
        GUIHelp.addButton('Switch Material', () => {
            if (meshRenderer.material == material2) {
                meshRenderer.material = material1;
            } else {
                meshRenderer.material = material2;
            }
        });
        GUIHelp.open();
        GUIHelp.endFolder();
    }
}


new Sample_ReplaceMaterial().run();
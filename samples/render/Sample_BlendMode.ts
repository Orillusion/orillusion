import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, View3D, DirectLight, KelvinUtil, MeshRenderer, BoxGeometry, LitMaterial, Color, BlendMode, GPUCullMode, CameraUtil } from "@orillusion/core";

//sample of change BlendMode and CullMode
class Sample_BlendMode {
    lightObj: Object3D;
    scene: Scene3D;

    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, Engine3D.aspect, 1, 5000.0);

        mainCamera.object3D.addComponent(HoverCameraController).setCamera(-125, 0, 120);

        await this.initScene(this.scene);

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
        lc.intensity = 200;
        lc.debug();
        this.scene.addChild(this.lightObj);
    }

    async initScene(scene: Scene3D) {

        //create a box into scene
        let box = new Object3D();
        scene.addChild(box);

        //register a mesh renderer
        let meshRenderer = box.addComponent(MeshRenderer);
        meshRenderer.geometry = new BoxGeometry(20, 20, 20);
        let material = meshRenderer.material = new LitMaterial();
        material.baseColor = new Color(0.1, 0.3, 0.6, 0.5);
        material.blendMode = BlendMode.ADD;

        // blend mode
        let blendMode = {
            NONE: BlendMode.NONE,
            NORMAL: BlendMode.NORMAL,
            ADD: BlendMode.ADD,
            ALPHA: BlendMode.ALPHA,
        }
        GUIHelp.init();
        // change blend mode by click dropdown box
        GUIHelp.add({ blendMode: material.blendMode }, 'blendMode', blendMode).onChange((v) => {
            material.blendMode = BlendMode[BlendMode[parseInt(v)]];
        });

        //cull mode
        let cullMode = {};
        cullMode[GPUCullMode.none] = GPUCullMode.none;
        cullMode[GPUCullMode.front] = GPUCullMode.front;
        cullMode[GPUCullMode.back] = GPUCullMode.back;

        // change cull mode by click dropdown box
        GUIHelp.add({ cullMode: GPUCullMode.none }, 'cullMode', cullMode).onChange((v) => {
            material.cullMode = v;
        });

        GUIHelp.open();
        GUIHelp.endFolder();
    }
}

new Sample_BlendMode().run();
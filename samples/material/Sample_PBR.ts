import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_PBR {
    lightObj3D: Object3D;
    scene: Scene3D;

    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, 0, 120);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 21;
            this.lightObj3D.rotationY = 108;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = false;
            directLight.intensity = 10;
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }

        let geometry = new SphereGeometry(3, 25, 25);
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                //Create materials with different roughness and metallic
                let mat = new LitMaterial();
                mat.baseMap = Engine3D.res.whiteTexture;
                mat.roughness = i / 10;
                mat.metallic = j / 10;
                //Create balls
                let ball = new Object3D();
                ball.transform.x = i * 8 - 8 * 10 * 0.5;
                ball.transform.y = 8 * 10 * 0.5 - j * 8;
                let renderder = ball.addComponent(MeshRenderer);
                renderder.geometry = geometry;
                renderder.material = mat;

                //add ball into scene
                this.scene.addChild(ball);
            }
        }
    }
}

new Sample_PBR().run();
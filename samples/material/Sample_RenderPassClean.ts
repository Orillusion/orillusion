import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, MeshRenderer, LitMaterial, BlendMode, BoxGeometry, Color, PlaneGeometry } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_RenderPassClean {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        await Engine3D.init();

        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(25, -5, 20);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            this.scene.exposure = 1;
            this.scene.roughness = 0.56;
        }

        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 57;
            this.lightObj3D.rotationY = 347;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 20;
            this.scene.addChild(this.lightObj3D);

            GUIHelp.init();
            GUIUtil.renderDirLight(directLight);
        }

        {
            let texture = await Engine3D.res.loadTexture("particle/T_Fx_Object_229.png");

            //add leaf
            let leafMaterial = new LitMaterial();
            leafMaterial.doubleSide = true;
            leafMaterial.baseMap = texture;
            leafMaterial.blendMode = BlendMode.ALPHA;
            let geometry = new BoxGeometry(2, 2, 2);
            for (let i = 0; i < 25; i++) {
                let leaf = new Object3D();
                let renderer = leaf.addComponent(MeshRenderer);
                renderer.material = leafMaterial;
                renderer.geometry = geometry;
                this.scene.addChild(leaf);
                leaf.x = Math.random() * 20 - 10;
                leaf.y = 3 + Math.random();
                leaf.z = Math.random() * 20 - 10;
            }

            //add floor
            let floorMaterial = new LitMaterial();
            floorMaterial.baseColor = new Color(1.0, 1.0, 1.0, 1);
            let floor = new Object3D();
            let renderer = floor.addComponent(MeshRenderer);
            renderer.material = floorMaterial;
            renderer.geometry = new PlaneGeometry(100, 100, 1, 1);
            this.scene.addChild(floor);
        }
    }
}

new Sample_RenderPassClean().run();
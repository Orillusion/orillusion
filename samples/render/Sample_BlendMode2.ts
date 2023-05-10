import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, Object3D, DirectLight, KelvinUtil, MeshRenderer, UnLitMaterial, PlaneGeometry, BlendMode, GPUCullMode, LitMaterial, Color } from "@orillusion/core";

class Sample_BlendMode2 {
    scene: Scene3D;

    async run() {
        await Engine3D.init();

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            luminosityThreshold: 0.8,
            strength: 0.86,
            radius: 4,
            debug: false
        };

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(25, -60, 200);

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
            this.scene.roughness = 0.0;
        }
        /******** light *******/
        {
            let lightObj = new Object3D();
            lightObj.rotationX = 57;
            lightObj.rotationY = 347;
            lightObj.rotationZ = 10;

            let directLight = lightObj.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 6;
            directLight.debug();
            this.scene.addChild(lightObj);
        }

        {
            // add plane into scene
            let plane = new Object3D();
            let renderer = plane.addComponent(MeshRenderer);
            let material = new UnLitMaterial();
            material.baseMap = await Engine3D.res.loadTexture("particle/T_Fx_Object_229.png");;
            renderer.material = material;
            renderer.geometry = new PlaneGeometry(100, 100, 1, 1);
            material.blendMode = BlendMode.ALPHA;
            this.scene.addChild(plane);

            GUIHelp.init();

            // blend mode
            let blendMode = {
                NONE: BlendMode.NONE,
                NORMAL: BlendMode.NORMAL,
                ADD: BlendMode.ADD,
                ALPHA: BlendMode.ALPHA,
            }
            // change blend mode by click dropdown box
            GUIHelp.add({ blendMode: material.blendMode }, 'blendMode', blendMode).onChange((v) => {
                material.blendMode = BlendMode[BlendMode[parseInt(v)]];
            });
            GUIHelp.open();
            GUIHelp.endFolder();

        }

        {
            // add floor
            let floor = new Object3D();
            let material = new LitMaterial();
            material.doubleSide = true;
            material.baseMap = await Engine3D.res.loadTexture("textures/diffuse.jpg");

            let renderer = floor.addComponent(MeshRenderer);
            renderer.material = material;
            renderer.geometry = new PlaneGeometry(200, 200, 1, 1);

            floor.y = -10;
            this.scene.addChild(floor);
        }
    }

}

new Sample_BlendMode2().run();
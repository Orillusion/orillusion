import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, CameraUtil, HoverCameraController, View3D, AtmosphericComponent, DirectLight, KelvinUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

//Samples to show models, they are using PBR material
class Sample_LoadGLTF {
    lightObj3D: Object3D;
    scene: Scene3D;
    async run() {
        //config settings
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.0001;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            luminosityThreshold: 0.8,
            strength: 0.86,
            radius: 4,
            debug: false
        };

        //init engine
        await Engine3D.init();

        this.scene = new Scene3D();

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);
        camera.object3D.addComponent(HoverCameraController).setCamera(25, -5, 100);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            let atmospheric = this.scene.addComponent(AtmosphericComponent);
            atmospheric.sunY = 0.62;
            atmospheric.sunRadiance = 47;
            atmospheric.exposure = 1;
            atmospheric.roughness = 0.56;
        }

        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 57;
            this.lightObj3D.rotationY = 148;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 18;
            GUIHelp.init();
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }

        {
            /******** player1 *******/
            let player1 = (await Engine3D.res.loadGltf('gltfs/anim/Minion_Lane_Super_Dawn/Minion_Lane_Super_Dawn.glb', {})) as Object3D;
            player1.transform.x = -10;
            player1.transform.y = -10;
            player1.transform.z = 20;
            player1.transform.scaleX = 10;
            player1.transform.scaleY = 10;
            player1.transform.scaleZ = 10;
            this.scene.addChild(player1);

            /******** player2 *******/
            let player2 = (await Engine3D.res.loadGltf('gltfs/anim/Minion_Lane_Super_Dawn/Prime_Helix.glb', {})) as Object3D;
            player2.transform.x = 10;
            player2.transform.y = -10;
            player2.transform.scaleX = 10;
            player2.transform.scaleY = 10;
            player2.transform.scaleZ = 10;
            this.scene.addChild(player2);

            /******** player3 *******/
            let player3 = (await Engine3D.res.loadGltf('gltfs/anim/Minion_Lane_Super_Dawn/Minion_Lane_Ranged_Dusk.glb', {})) as Object3D;
            player3.transform.x = 10;
            player3.transform.y = -10;
            player3.transform.z = 20;
            player3.transform.scaleX = 10;
            player3.transform.scaleY = 10;
            player3.transform.scaleZ = 10;
            this.scene.addChild(player3);
        }
    }
}

new Sample_LoadGLTF().run();
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Object3D, Scene3D, Engine3D, GlobalIlluminationComponent, Object3DUtil, GTAOPost, HDRBloomPost, PostProcessingComponent, TAAPost } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

class Sample_GI {
    scene: Scene3D;
    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.gi.enable = true;
        Engine3D.setting.gi.debug = true;

        Engine3D.setting.gi.probeYCount = 3;
        Engine3D.setting.gi.probeXCount = 6;
        Engine3D.setting.gi.probeZCount = 6;
        Engine3D.setting.gi.probeSpace = 60;
        Engine3D.setting.gi.offsetX = 0;
        Engine3D.setting.gi.offsetY = 60;
        Engine3D.setting.gi.offsetZ = 0;
        Engine3D.setting.gi.indirectIntensity = 1;
        Engine3D.setting.gi.probeSize = 64;
        Engine3D.setting.gi.octRTSideSize = 64;
        Engine3D.setting.gi.octRTMaxSize = 2048;
        Engine3D.setting.gi.ddgiGamma = 1;
        Engine3D.setting.gi.autoRenderProbe = true;

        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.001;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            debug: false,
            blurX: 4,
            blurY: 4,
            luminosityThreshold: 0.9,
            radius: 4,
            strength: 1.2
        };

        await Engine3D.init({});
        GUIHelp.init();
        let param = createSceneParam();
        param.camera.distance = 200;
        let exampleScene = createExampleScene(param);
        exampleScene.atmosphericSky.exposure = 0.5;
        this.scene = exampleScene.scene;
        Engine3D.startRenderViews([exampleScene.view]);
        let job = Engine3D.getRenderJob(exampleScene.view);
        await this.initScene();
        this.addGIProbes();
        GUIUtil.renderAtomosphericSky(exampleScene.atmosphericSky);
        GUIUtil.renderDirLight(exampleScene.light);

        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        postProcessing.addPost(TAAPost);
        // postProcessing.addPost(GTAOPost);
        postProcessing.addPost(HDRBloomPost);

    }

    private addGIProbes() {
        let probeObj = new Object3D();
        let component = probeObj.addComponent(GlobalIlluminationComponent);
        this.scene.addChild(probeObj);
        setTimeout(() => {
            GUIUtil.renderGIComponent(component);
        }, 2000);
    }

    async initScene() {
        {
            let floorHeight = 20;
            let floor = Object3DUtil.GetSingleCube(1000, floorHeight, 1000, 0.6, 0.6, 0.6);
            floor.y = -floorHeight;
            this.scene.addChild(floor);
        }


        {
            let greenBall = Object3DUtil.GetSingleSphere(30, 0.1, 0.8, 0.2);
            this.scene.addChild(greenBall);
            greenBall.x = -70;
            greenBall.y = 40;
        }

        {
            let chair = await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf') as Object3D;
            chair.scaleX = chair.scaleY = chair.scaleZ = 100;
            chair.rotationZ = chair.rotationX = 130;
            chair.z = -120;
            this.scene.addChild(chair);
        }

        {
            let Duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
            Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.3;
            Duck.transform.y = 0;
            Duck.transform.x = 0;
            Duck.transform.z = 80;
            this.scene.addChild(Duck);
        }


        {
            let car = await Engine3D.res.loadGltf('gltfs/pbrCar/pbrCar.gltf');
            car.scaleX = car.scaleY = car.scaleZ = 1.5;
            this.scene.addChild(car);
            car.x = 20;
        }
    }
}

new Sample_GI().run();
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Object3D, Scene3D, Engine3D, GlobalIlluminationComponent, Vector3, GTAOPost, PostProcessingComponent, HDRBloomPost } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_GICornellBox {
    scene: Scene3D;
    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.gi.enable = true;
        Engine3D.setting.gi.debug = true;
        Engine3D.setting.gi.probeYCount = 6;
        Engine3D.setting.gi.probeXCount = 6;
        Engine3D.setting.gi.probeZCount = 6;
        Engine3D.setting.gi.offsetX = 0;
        Engine3D.setting.gi.offsetY = 10;
        Engine3D.setting.gi.offsetZ = 0;
        Engine3D.setting.gi.indirectIntensity = 1;
        Engine3D.setting.gi.lerpHysteresis = 0.004;//default value is 0.01
        Engine3D.setting.gi.maxDistance = 16;
        Engine3D.setting.gi.probeSpace = 6;
        Engine3D.setting.gi.normalBias = 0;
        Engine3D.setting.gi.probeSize = 32;
        Engine3D.setting.gi.octRTSideSize = 16;
        Engine3D.setting.gi.octRTMaxSize = 2048;
        Engine3D.setting.gi.ddgiGamma = 2.2;
        Engine3D.setting.gi.depthSharpness = 1;
        Engine3D.setting.gi.autoRenderProbe = true;

        Engine3D.setting.shadow.shadowBound = 80;
        Engine3D.setting.shadow.shadowBias = 0.000035;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        Engine3D.setting.render.debug = true;
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
        let param = createSceneParam();
        param.camera.distance = 40;

        let exampleScene = createExampleScene(param);
        exampleScene.hoverCtrl.setCamera(0, 0, 20);
        this.scene = exampleScene.scene;
        this.addGIProbes();
        Engine3D.startRenderViews([exampleScene.view]);

        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        postProcessing.addPost(GTAOPost);
        postProcessing.addPost(HDRBloomPost);

        await this.initScene();
    }

    private addGIProbes() {
        let probeObj = new Object3D();
        GUIHelp.init();
        let component = probeObj.addComponent(GlobalIlluminationComponent);
        this.scene.addChild(probeObj);
        setTimeout(() => {
            GUIUtil.renderGIComponent(component);
        }, 2000);
    }

    async initScene() {
        let box = await Engine3D.res.loadGltf('gltfs/cornellBox/cornellBox.gltf') as Object3D;
        box.localScale = new Vector3(10, 10, 10);
        this.scene.addChild(box);
    }
}

new Sample_GICornellBox().run();
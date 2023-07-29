import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Object3D, Scene3D, Engine3D, GlobalIlluminationComponent, Object3DUtil, GTAOPost, HDRBloomPost, PostProcessingComponent, TAAPost, Vector3, Color, AnimationCurve, Keyframe } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

class Sample_GraphicLine {
    scene: Scene3D;
    view: import("c:/work/git/orillusion-nian/src/index").View3D;
    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

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
        exampleScene.atmosphericSky.exposure = 1.0;
        this.view = exampleScene.view;
        this.scene = exampleScene.scene;
        Engine3D.startRenderViews([exampleScene.view]);
        let job = Engine3D.getRenderJob(exampleScene.view);
        await this.initScene();
        // GUIUtil.renderAtomosphericSky(exampleScene.atmosphericSky);
        GUIUtil.renderDirLight(exampleScene.light);
    }

    async initScene() {
        this.view.graphic3D.drawLines('line1', [Vector3.ZERO, new Vector3(0, 10, 0)], new Color().hexToRGB(Color.RED));



        let animCurve = new AnimationCurve();
        animCurve.addKeyFrame(new Keyframe(0, 0.5));
        animCurve.addKeyFrame(new Keyframe(0.15, -0.2));
        animCurve.addKeyFrame(new Keyframe(0.22, 0.4));
        animCurve.addKeyFrame(new Keyframe(0.34, 0.2));
        animCurve.addKeyFrame(new Keyframe(0.65, -0.2));
        animCurve.addKeyFrame(new Keyframe(1, 0.9));
        let lines = [];
        for (let i = 0; i < 100; i++) {
            let y = animCurve.getValue(i / (100 - 1)) * 10;
            lines.push(
                new Vector3(
                    i,
                    y,
                    0
                )
            );
        }
        this.view.graphic3D.drawLines('line2', lines, new Color().hexToRGB(Color.RED));

        this.view.graphic3D.drawBox('box1', new Vector3(-5, -5, -5), new Vector3(5, 5, 5), new Color().hexToRGB(Color.GREEN));

        this.view.graphic3D.drawCircle('Circle1', new Vector3(-15, -5, -5), 5, 15, Vector3.X_AXIS, new Color().hexToRGB(Color.GREEN));
        this.view.graphic3D.drawCircle('Circle2', new Vector3(-15, -5, -5), 5, 15, Vector3.Y_AXIS, new Color().hexToRGB(Color.GREEN));
        this.view.graphic3D.drawCircle('Circle3', new Vector3(-15, -5, -5), 5, 15, Vector3.Z_AXIS, new Color().hexToRGB(Color.GREEN));
    }
}

new Sample_GraphicLine().run();
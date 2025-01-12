import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, Engine3D, Vector3, Color, AnimationCurve, Keyframe, View3D, BoxGeometry, LitMaterial, MeshRenderer, Object3D } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Graphic3D, Graphic3DLineRenderer } from '@orillusion/graphic'

class Sample_GraphicLine {
    scene: Scene3D;
    view: View3D;
    graphic3D: Graphic3D;
    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        await Engine3D.init({});
        GUIHelp.init();
        let param = createSceneParam();
        param.camera.distance = 200;
        let exampleScene = createExampleScene(param);
        exampleScene.atmosphericSky.exposure = 1.0;
        this.view = exampleScene.view;
        this.scene = exampleScene.scene;

        this.graphic3D = new Graphic3D();
        this.scene.addChild(this.graphic3D);

        Engine3D.startRenderViews([exampleScene.view]);
        let job = Engine3D.getRenderJob(exampleScene.view);
        await this.initScene();
    }

    async initScene() {
        this.graphic3D.drawLines('line1', [Vector3.ZERO, new Vector3(0, 10, 0)], new Color().hexToRGB(Color.RED));

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
            lines.push(new Vector3(i, y, 0));
        }
        this.graphic3D.drawLines('line2', lines, new Color().hexToRGB(Color.RED));
        this.graphic3D.drawBox('box1', new Vector3(-5, -5, -5), new Vector3(5, 5, 5), new Color().hexToRGB(Color.GREEN));
        this.graphic3D.drawCircle('Circle1', new Vector3(-15, -5, -5), 5, 15, Vector3.X_AXIS, new Color().hexToRGB(Color.GREEN));
        this.graphic3D.drawCircle('Circle2', new Vector3(-15, -5, -5), 5, 15, Vector3.Y_AXIS, new Color().hexToRGB(Color.GREEN));
        this.graphic3D.drawCircle('Circle3', new Vector3(-15, -5, -5), 5, 15, Vector3.Z_AXIS, new Color().hexToRGB(Color.GREEN));
        this.graphic3D.drawCircle('Circle4', new Vector3(-15, -5, -5), 5, 15, new Vector3(1, 1, 0), new Color().hexToRGB(Color.GREEN));

        {
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(5, 5, 5);
            mr.material = new LitMaterial();
            this.scene.addChild(obj);
        }
        let btn = {'depthTest': true}
        GUIHelp.add(btn, 'depthTest').onChange(v=>{
            this.graphic3D.getComponents(Graphic3DLineRenderer).forEach(mr=>{
                mr.materials[0].depthCompare = v ? 'less' : 'always'
            })
        })
        GUIHelp.open()
    }
}

new Sample_GraphicLine().run();
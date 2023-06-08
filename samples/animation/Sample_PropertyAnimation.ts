import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Scene3D, PropertyAnimation, Engine3D, Object3D, Object3DUtil, PropertyAnimClip, WrapMode } from "@orillusion/core";

class Sample_PropertyAnimation {
    scene: Scene3D;
    animation: PropertyAnimation;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 20;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        await Engine3D.init();
        let param = createSceneParam();
        param.camera.distance = 16;
        param.camera.pitch = -25;
        param.light.intensity = 40;
        let exampleScene = createExampleScene(param);

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        this.scene = exampleScene.scene;
        await this.initScene(this.scene);

        Engine3D.startRenderView(exampleScene.view);

        this.displayGUI();
    }

    async initScene(scene: Scene3D) {
        // floor
        let floor: Object3D = Object3DUtil.GetSingleCube(16, 0.1, 16, 1, 1, 1);
        scene.addChild(floor);

        // load external model
        let model = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
        let container = new Object3D();
        container.addChild(model);
        model.rotationY = 180;
        this.scene.addChild(container);
        model.scaleX = model.scaleY = model.scaleZ = 0.01;

        this.animation = await this.initPropertyAnim(container);
        this.animation.play(this.animation.defaultClip);

        return true;
    }

    private async initPropertyAnim(owner: Object3D) {
        // add PropertyAnimation
        let animation = owner.addComponent(PropertyAnimation);

        //load a animation clip
        let json: any = await Engine3D.res.loadJSON('json/anim_0.json');
        let animClip = new PropertyAnimClip();
        animClip.parse(json);
        animClip.wrapMode = WrapMode.Loop;
        animation.defaultClip = animClip.name;
        animation.autoPlay = true;

        // register clip to animation
        animation.appendClip(animClip);
        return animation;
    }

    private displayGUI() {
        // restart the animation clip
        GUIHelp.addFolder('Property Animation');
        GUIHelp.addButton('Restart', () => {
            this.animation.play(this.animation.defaultClip, true);
        });

        let data = { Seek: 0, Speed: 1 };

        // seek the animation to the specified time
        let totalTime = this.animation.getClip(this.animation.defaultClip).totalTime;
        GUIHelp.add(data, 'Seek', 0, totalTime, 0.01).onChange((v) => {
            this.animation.stop();
            this.animation.seek(v);
        });

        // change animation speed
        GUIHelp.add(data, 'Speed', 0, 1, 0.01).onChange((v) => {
            this.animation.speed = v;
        });

        GUIHelp.open();
        GUIHelp.endFolder();
    }
}

new Sample_PropertyAnimation().run();
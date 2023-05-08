import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, SkeletonAnimationComponent, LitMaterial, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil, Time, Object3DUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

// Sample to use SkeletonAnimationComponent
class Sample_Skeleton3 {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 350;
        Engine3D.setting.shadow.shadowBias = 0.0001;
        await Engine3D.init({
            renderLoop: () => this.onRenderLoop(),
        });

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);

        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(45, -30, 150);
        ctrl.maxDistance = 500.0;

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            let rootNode = await Engine3D.res.loadGltf('gltfs/glb/Soldier_draco.glb');
            let character = rootNode.getObjectByName('Character') as Object3D;
            character.scaleX = 0.3;
            character.scaleY = 0.3;
            character.scaleZ = 0.3;
            character.rotationY = 180;
            scene.addChild(character);

            let animation = character.getComponentsInChild(SkeletonAnimationComponent)[0];

            const runClip = animation.getAnimationClip("Run");
            runClip.addEvent("Begin", 0);
            runClip.addEvent("Mid", runClip.totalTime / 2);
            runClip.addEvent("End", runClip.totalTime);

            animation.eventDispatcher.addEventListener("Begin", (e: any /*AnimationEvent*/) => {
                console.log("Run-Begin", e.skeletonAnimation.getAnimationClipState('Run').time)
            }, this);
            animation.eventDispatcher.addEventListener("Mid", (e: any /*AnimationEvent*/) => {
                console.log("Run-Mid", e.skeletonAnimation.getAnimationClipState('Run').time)
            }, this);
            animation.eventDispatcher.addEventListener("End", (e: any /*AnimationEvent*/) => {
                console.log("Run-End:", e.skeletonAnimation.getAnimationClipState('Run').time)
            }, this);

            // change speed
            GUIHelp.addFolder("Animation-speed").open();
            GUIHelp.add(animation, 'timeScale', -6, 6, 0.01);
            GUIHelp.endFolder();

            // change animation weight
            GUIHelp.addFolder("Animation-weight").open();
            animation.getAnimationClipStates().forEach((clipState, _) => {
                GUIHelp.add(clipState, 'weight', 0, 1.0, 0.01).name(clipState.name);
            });
            GUIHelp.endFolder();

            // toggle play/stop
            GUIHelp.addFolder("Animation-play").open();
            animation.getAnimationClipStates().forEach((clipState, _) => {
                GUIHelp.addButton(clipState.name, () => animation.play(clipState.name));
            });
            GUIHelp.endFolder();

            // cross fade animation
            GUIHelp.addFolder("Animation-crossFade").open();
            animation.getAnimationClipStates().forEach((clipState, _) => {
                GUIHelp.addButton('crossFade(' + clipState.name + ')', () => animation.crossFade(clipState.name, 0.3));
            });
            GUIHelp.endFolder();
        }

        /******** floor *******/
        this.scene.addChild(Object3DUtil.GetSingleCube(3000, 1, 3000, 0.5, 0.5, 0.5));

        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.x = 0;
            this.lightObj3D.y = 30;
            this.lightObj3D.z = -40;
            this.lightObj3D.rotationX = 45;
            this.lightObj3D.rotationY = 0;
            this.lightObj3D.rotationZ = 0;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 40;
            GUIUtil.renderDirLight(directLight);
            scene.addChild(this.lightObj3D);
        }

        return true;
    }

    public onRenderLoop() {
        if (this.lightObj3D) {
            this.lightObj3D.rotationY += Time.delta * 0.01 * 2;
        }
    }
}

new Sample_Skeleton3().run();
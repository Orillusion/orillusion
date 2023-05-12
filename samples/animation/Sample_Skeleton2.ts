import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, LitMaterial, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil, Object3DUtil, SkeletonAnimationComponent } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_Skeleton2 {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 500;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        this.scene.exposure = 1;

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);

        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -30, 300);
        hoverCameraController.maxDistance = 500.0;

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            // load model with skeletion animation
            let rootNode = await Engine3D.res.loadGltf('gltfs/glb/Soldier.glb');
            let character = rootNode.getObjectByName('Character') as Object3D;
            character.scaleX = 0.3;
            character.scaleY = 0.3;
            character.scaleZ = 0.3;
            character.rotationY = 180;

            // enum animation names
            var animName = ['Idel', 'Walk', 'Run', 'TPose'];
            let maxCount = 100;
            let maxCol = 10;
            let maxRow = Math.floor(maxCount / maxCol);
            // Clone 100 players to play different animations
            for (var i = 0; i < maxCount; i++) {
                let cloneObj = character.clone();

                let row = Math.floor(i / maxCol);
                let col = Math.floor(i % maxCol);

                cloneObj.x = (maxCol * -0.5 + col) * 30;
                cloneObj.z = (maxRow * -0.5 + row) * 30;
                scene.addChild(cloneObj);

                let animation = cloneObj.getComponentsInChild(SkeletonAnimationComponent)[0];

                if (i < animName.length) {
                    animation.play(animName[i]);
                } else {
                    let animIndex = Math.floor(Math.random() * 100 % 3);
                    animation.play(animName[animIndex], -5 + Math.random() * 10);
                }
            }
        }

        /******** floor *******/
        this.scene.addChild(Object3DUtil.GetSingleCube(3000, 1, 3000, 0.5, 0.5, 0.5));

        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.x = 0;
            this.lightObj3D.y = 30;
            this.lightObj3D.z = -40;
            this.lightObj3D.rotationX = 144;
            this.lightObj3D.rotationY = 0;
            this.lightObj3D.rotationZ = 0;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 40;
            GUIHelp.init();
            GUIUtil.renderDirLight(directLight);
            scene.addChild(this.lightObj3D);
        }

        return true;
    }

}

new Sample_Skeleton2().run();
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, SkeletonAnimationComponent, LitMaterial, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_Skeleton2 {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];

    constructor() { }

    async run() {

        // Engine3D.engineSetting.debug.materialDebug = false ;
        // Engine3D.engineSetting.debug.materialChannelDebug = true ;
        // Engine3D.engineSetting.memorySetting.doMatrixMaxCount = 80000;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 2;
        Engine3D.setting.shadow.shadowBound = 1000
        Engine3D.setting.shadow.shadowBias = 0.002;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);

        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -30, 300);
        hoverCameraController.maxDistance = 500.0;

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // renderJob.addPost(new SSAOPost());
        // renderJob.addPost( new GTAOPost() );

        Engine3D.startRenderView(view);
    }

    private lightBall: Object3D;

    /**
     * @ch 初始化场景内容
     * @en Initialize the scene content
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            let rootNode = await Engine3D.res.loadGltf('gltfs/glb/Soldier.glb');
            let character = rootNode.getObjectByName('Character') as Object3D;
            character.scaleX = 0.3;
            character.scaleY = 0.3;
            character.scaleZ = 0.3;
            character.rotationY = 180;
            // scene.addChild(character);

            var animName = ['Idle', 'Walk', 'Run', 'TPose'];
            let maxCount = 100;
            let maxCol = 10;
            let maxRow = Math.floor(maxCount / maxCol);
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

        {
            let mat = new LitMaterial();
            mat.roughness = 0.85;
            mat.metallic = 0.1;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            mr.material = mat;

            mat.debug();
            this.scene.addChild(floor);
        }

        this.scene.exposure = 1

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 144;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 25;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        return true;
    }

    loop() { }
}

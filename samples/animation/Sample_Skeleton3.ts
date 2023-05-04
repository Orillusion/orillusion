import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, SkeletonAnimationComponent, OAnimationEvent, LitMaterial, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil, Time } from "@orillusion/core";

export class Sample_Skeleton3 {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];

    constructor() { }

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 350
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.material.materialChannelDebug = true;
        await Engine3D.init({
            renderLoop: () => this.onRenderLoop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);

        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -30, 150);
        hoverCameraController.maxDistance = 500.0;

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

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
            let rootNode = await Engine3D.res.loadGltf('gltfs/glb/Soldier_draco.glb');
            let character = rootNode.getObjectByName('Character') as Object3D;
            character.scaleX = 0.3;
            character.scaleY = 0.3;
            character.scaleZ = 0.3;
            character.rotationY = 180;
            scene.addChild(character);

            let animation = character.getComponentsInChild(SkeletonAnimationComponent)[0] as SkeletonAnimationComponent;

            const runClip = animation.getAnimationClip("Run");
            runClip.addEvent("Begin", 0);
            runClip.addEvent("Mid", runClip.totalTime / 2);
            runClip.addEvent("End", runClip.totalTime);

            animation.eventDispatcher.addEventListener("Begin", (e: OAnimationEvent) => {
                console.log("Run-Begin", e.skeletonAnimation.getAnimationClipState('Run').time)
            }, this);
            animation.eventDispatcher.addEventListener("Mid", (e: OAnimationEvent) => {
                console.log("Run-Mid", e.skeletonAnimation.getAnimationClipState('Run').time)
            }, this);
            animation.eventDispatcher.addEventListener("End", (e: OAnimationEvent) => {
                console.log("Run-End:", e.skeletonAnimation.getAnimationClipState('Run').time)
            }, this);

        }

        {
            let mat = new LitMaterial();
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let light = this.lightObj.addComponent(DirectLight);
            light.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            light.castShadow = true;
            light.intensity = 25;
            light.debug();
            scene.addChild(this.lightObj);
        }

        return true;
    }

    public onRenderLoop() {
        if (this.lightObj) {
            this.lightObj.rotationY += Time.delta * 0.01 * 2;
        }
    }
}

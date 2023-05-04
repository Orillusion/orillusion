import { Physics, Rigidbody } from "@orillusion/physics";
import { Scene3D, Object3D, LitMaterial, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, BoxGeometry, MeshRenderer, ColliderComponent, BoxColliderShape, Vector3, PlaneGeometry } from "@orillusion/core";

export class SamplePhysics01 {
    private scene: Scene3D;
    private lightObj: Object3D;
    private boxMat: LitMaterial;
    private cameraController: HoverCameraController;
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 20;

        await Physics.init();
        await Engine3D.init({ renderLoop: () => this.loop() });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 0.01, 3000.0);
        this.cameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.cameraController.setCamera(0, -30, 50)

        await this.initScene(this.scene);
        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {

        /******** light *******/
        this.lightObj = new Object3D();
        this.lightObj.x = 0;
        this.lightObj.y = 30;
        this.lightObj.z = 0;
        this.lightObj.rotationX = 130;
        this.lightObj.rotationY = 200;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.castShadow = true;
        lc.intensity = 1.5;
        scene.addChild(this.lightObj);
        /******** light *******/

        this.initMaterials();
        this.createGround();

        setInterval(() => {
            this.addRandomBox();
            if (scene.entityChildren.length > 1000)
                scene.removeChildByIndex(10)
        }, 50);

        return true;
    }

    private addRandomBox() {
        let geo = new BoxGeometry(1, 1, 1);
        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = geo;
        mr.material = this.boxMat;
        // mr.material.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1);
        mr.castShadow = true;
        mr.receiveShadow = true;
        obj.y = 20;
        obj.x = Math.random() * 20 - 10;
        obj.z = Math.random() * 20 - 10;
        let rb = obj.addComponent(Rigidbody);
        let collider = obj.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(1, 1, 1);
        this.scene.addChild(obj);
    }

    private initMaterials() {
        var mat = new LitMaterial();
        mat.baseMap = Engine3D.res.whiteTexture;
        mat.debug();
        this.boxMat = mat;
    }

    private createGround() {
        let floorMat = new LitMaterial();
        floorMat.baseMap = Engine3D.res.blueTexture;
        // floorMat.normalMap = Engine3D.res.normalTexture;
        // floorMat.aoMap = Engine3D.res.whiteTexture;
        // floorMat.maskMap = Engine3D.res.whiteTexture;
        // floorMat.emissiveMap = Engine3D.res.blackTexture;
        // floorMat.blendMode = BlendMode.NORMAL;
        floorMat.roughness = 0.85;
        floorMat.metallic = 0.01;
        floorMat.envIntensity = 0.01;

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.castShadow = true;
        mr.receiveShadow = true;
        mr.geometry = new PlaneGeometry(500, 500, 1, 1);
        mr.material = floorMat;
        let rb = obj.addComponent(Rigidbody);
        rb.mass = 0;
        let collider = obj.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(500, 0.05, 500);
        this.scene.addChild(obj);
    }

    private loop() {
        Physics.update();
    }
}

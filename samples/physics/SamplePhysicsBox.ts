import { Physics, Rigidbody } from "@orillusion/physics";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, LitMaterial, Color, DirectLight, KeyEvent, KeyCode, SphereGeometry, MeshRenderer, ColliderComponent, SphereColliderShape, PlaneGeometry, BoxColliderShape, Vector3, BoxGeometry } from "@orillusion/core";

export class SamplePhysicsBox {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: any;
    constructor() { }
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 20;


        await Physics.init();
        await Engine3D.init({
            renderLoop: () => this.loop()
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 0.01, 200000.0);
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(0, -30, 50)
        this.initMats();

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    initMats() {
        const matCount = 17;
        this.mats = [];
        for (let i = 0; i < matCount; i++) {
            var mat = new LitMaterial();
            mat.baseColor = new Color(Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0, 1.0);
            mat.metallic = Math.min(Math.random() * 0.1 + 0.2, 1.0);
            mat.roughness = Math.min(Math.random() * 0.5, 1.0);
            this.mats.push(mat);
        }
    }

    async initScene(scene: Scene3D) {
        /******** load hdr sky *******/
        let envMap = await Engine3D.res.loadHDRTextureCube('hdri/daytime.hdr');
        scene.envMap = envMap;

        /******** light *******/
        this.lightObj = new Object3D();
        this.lightObj.x = 0;
        this.lightObj.y = 50;
        this.lightObj.z = 0;
        this.lightObj.rotationX = 130;
        this.lightObj.rotationY = 200;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.castShadow = true;
        lc.intensity = 2.5;
        lc.debug()
        scene.addChild(this.lightObj);
        /******** light *******/

        this.createGround();
        this.createWallBoxes();
        this.createSphere();
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        return true;
    }

    private keyUp(e: KeyEvent) {
        if (e.keyCode === KeyCode.Key_Space) {
            console.log('space KEY UP');
            this.createSphere()
        }
    }
    createSphere() {
        var sphereGeo = new SphereGeometry(2, 32, 32);
        var sphere = new Object3D();
        var mr = sphere.addComponent(MeshRenderer);
        mr.geometry = sphereGeo;
        var mat = new LitMaterial();
        mat.baseColor = new Color(Math.random(), Math.random(), Math.random(), 1.0);
        mr.castShadow = true;
        mr.receiveShadow = true;
        mr.material = mat;
        sphere.x = 0;
        sphere.y = 40;
        sphere.z = 0;

        let collider = sphere.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(sphereGeo.radius);
        sphere.addComponent(Rigidbody);

        this.scene.addChild(sphere);
    }
    createGround() {
        let floorMat = new LitMaterial();
        floorMat.baseMap = Engine3D.res.grayTexture;
        floorMat.roughness = 0.85;
        floorMat.metallic = 0.01;
        floorMat.envIntensity = 0.01;

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.castShadow = true;
        mr.receiveShadow = true;
        mr.geometry = new PlaneGeometry(500, 500, 1, 1);
        mr.material = floorMat;
        let collider = obj.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(500 / 2, 0.5, 500 / 2);
        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.mass = 0;
        this.scene.addChild(obj);
    }
    createWallBoxes() {
        let numBricksLength = 10;
        let numBricksHeight = 14;
        let materialIndex = 0;
        for (let i = 0; i < numBricksHeight; i++) {
            for (let j = 0; j < numBricksLength; j++) {
                let geo = new BoxGeometry(1, 1, 1);
                const element = new Object3D();
                let mr = element.addComponent(MeshRenderer);
                mr.geometry = geo;

                mr.material = this.mats[materialIndex % this.mats.length];
                mr.castShadow = true;
                mr.receiveShadow = true;
                element.x = j - 4;
                element.y = i;
                let collider = element.addComponent(ColliderComponent);
                collider.shape = new BoxColliderShape();
                collider.shape.size = new Vector3(1, 1, 1);
                element.addComponent(Rigidbody);
                this.scene.addChild(element);
                materialIndex++;
            }
        }
    }

    loop() {
        Physics.update();
    }
}

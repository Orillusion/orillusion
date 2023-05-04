import { Physics, Rigidbody } from "@orillusion/physics";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, LitMaterial, Color, DirectLight, BoxGeometry, MeshRenderer, ColliderComponent, BoxColliderShape, Vector3, PlaneGeometry, Quaternion } from "@orillusion/core";

export class SamplePhysicsSlope {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;
    constructor() { }
    async run() {
        //let physcics world support soft body
        await Physics.init();
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
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
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.whiteTexture;
            mat.emissiveMap = Engine3D.res.blackTexture;
            // mat.blendMode = BlendMode.NORMAL;
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
        /******** load hdr sky *******/

        /******** floor *******/
        /******** floor *******/

        /******** light *******/
        this.lightObj = new Object3D();
        this.lightObj.x = 0;
        this.lightObj.y = 30;
        this.lightObj.z = -40;
        this.lightObj.rotationX = -90 + 55;
        this.lightObj.rotationY = -35;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.castShadow = true;
        lc.intensity = 3.5;
        scene.addChild(this.lightObj);
        /******** light *******/

        this.createGround();
        this.createSlope();
        this.createBoxes();

        return true;
    }

    private createBoxes() {
        for (var i = 0; i < 20; i++) {
            let geo = new BoxGeometry(1, 1, 1);

            const element = new Object3D();
            let mr = element.addComponent(MeshRenderer);
            mr.geometry = geo;
            mr.material = this.mats[Math.floor(this.mats.length * Math.random())];
            mr.castShadow = true;
            mr.receiveShadow = true;

            element.y = 100;
            element.scaleX = Math.random() * 5 + 0.5;
            element.scaleY = Math.random() * 5 + 0.5;
            element.scaleZ = Math.random() * 5 + 0.5;

            let collider = element.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();

            collider.shape.size = new Vector3(element.scaleX * 2, element.scaleY * 2, element.scaleZ * 2);
            element.addComponent(Rigidbody);
            this.scene.addChild(element);
        }
    }

    private createSlope() {
        let slopeMat = new LitMaterial();
        slopeMat.baseMap = Engine3D.res.whiteTexture;
        slopeMat.normalMap = Engine3D.res.normalTexture;
        slopeMat.aoMap = Engine3D.res.whiteTexture;
        slopeMat.maskMap = Engine3D.res.whiteTexture;
        slopeMat.emissiveMap = Engine3D.res.blackTexture;
        // slopeMat.blendMode = BlendMode.NORMAL;
        slopeMat.roughness = 0.85;
        slopeMat.metallic = 0.01;
        slopeMat.envIntensity = 0.01;

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.receiveShadow = true;
        mr.castShadow = true;
        mr.geometry = new PlaneGeometry(100, 100, 1, 1);
        mr.material = slopeMat;

        let collider = obj.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(100, 0.6, 100);
        let rigidbody = obj.addComponent(Rigidbody);
        obj.y = 15;
        let q = Quaternion.HELP_0;
        q.fromEulerAngles(0, 0, 45);
        obj.transform.localRotQuat = q;
        rigidbody.mass = 0;
        this.scene.addChild(obj);
    }

    createGround() {
        let floorMat = new LitMaterial();
        floorMat.baseMap = Engine3D.res.blueTexture;
        floorMat.normalMap = Engine3D.res.normalTexture;
        floorMat.aoMap = Engine3D.res.whiteTexture;
        floorMat.maskMap = Engine3D.res.whiteTexture;
        floorMat.emissiveMap = Engine3D.res.blackTexture;
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
        let collider = obj.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(500, 0.5, 500);
        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.mass = 0;
        this.scene.addChild(obj);
    }

    loop() {
        if (Physics.isInited) {
            Physics.update();
        }
    }
}

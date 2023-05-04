import { Physics, Rigidbody } from "@orillusion/physics";
import { HoverCameraController, Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, LitMaterial, Color, DirectLight, MeshRenderer, PlaneGeometry, ColliderComponent, BoxColliderShape, Vector3, BoxGeometry, SphereGeometry, SphereColliderShape } from "@orillusion/core";

export class SamplePhysicsSoftBodyCloth {
    hoverController: HoverCameraController;
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
        this.createWallBoxes();
        return true;
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
        collider.shape.size = new Vector3(500, 0.5, 1000);
        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.mass = 0;
        this.scene.addChild(obj);
    }

    createCloth() {
        var clothWidth = 4;
        var clothHeight = 3;
        var clothNumSegmentsZ = clothWidth * 5;
        var clothNumSegmentsY = clothHeight * 5;
        var pos = new Vector3(0, 10, 0);

        var clothGeo = new PlaneGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
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
                element.x = j * 2;
                element.y = i * 2;
                let collider = element.addComponent(ColliderComponent);
                collider.shape = new BoxColliderShape();
                collider.shape.size = new Vector3(2, 2, 2);
                element.addComponent(Rigidbody);
                this.scene.addChild(element);
                materialIndex++;
            }
        }
    }

    initShareGeoAndMat() {
        /******** stand LitMaterial *******/
        this.mats = [];
        let matCount = 200;
        for (let i = 0; i < matCount; i++) {
            var mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.whiteTexture;
            mat.emissiveMap = Engine3D.res.blackTexture;
            // mat.blendMode = BlendMode.NORMAL;
            mat.baseColor = new Color(Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0, 1.0);
            mat.metallic = Math.min(Math.random() * 0.5 + 0.2, 1.0);
            mat.roughness = Math.min(Math.random() * 0.8 + 0.1, 1.0);
            this.mats.push(mat);
        }
        /******** stand LitMaterial *******/
    }

    createBox() {
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

    createSphere() {
        let sphereGeos = [new SphereGeometry(3, 25, 25), new SphereGeometry(2, 8, 25), new SphereGeometry(3, 20, 20), new SphereGeometry(3, 12, 8), new SphereGeometry(2, 10, 15), new SphereGeometry(1, 8, 8)];

        let geo = sphereGeos[Math.floor(sphereGeos.length * Math.random())];
        const element = new Object3D();
        let mr = element.addComponent(MeshRenderer);
        mr.geometry = geo;
        mr.material = this.mats[Math.floor(this.mats.length * Math.random())];
        mr.castShadow = true;
        mr.receiveShadow = true;
        // element.x = Math.random() * 50 - 50 * 0.5;
        // element.z = Math.random() * 50 - 50 * 0.5;
        element.y = 100;
        let collider = element.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(geo.radius);
        // collider.shape.size = new Vector3(3 * 2, 3 * 2, 3 * 2);
        element.addComponent(Rigidbody);
        this.scene.addChild(element);
    }

    loop() {
        if (Physics.isInited) {
            Physics.update();
        }
    }
}

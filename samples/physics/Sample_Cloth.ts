import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, LitMaterial, MeshRenderer, PlaneGeometry, Vector3, Object3DUtil } from "@orillusion/core";
import { Graphic3D } from "@orillusion/graphic";
import { Physics, Rigidbody, ClothSoftbody } from "@orillusion/physics";
import dat from "dat.gui";

class Sample_Cloth {
    async run() {
        await Physics.init({ useSoftBody: true, useDrag: true });
        await Engine3D.init({ renderLoop: () => Physics.update() });
        let view = new View3D();
        view.scene = new Scene3D();
        let sky = view.scene.addComponent(AtmosphericComponent);

        view.camera = CameraUtil.createCamera3DObject(view.scene);
        view.camera.perspective(60, webGPUContext.aspect, 1, 1000.0);
        view.camera.object3D.addComponent(HoverCameraController).setCamera(0, -30, 20, new Vector3(0, 3, 0));

        let lightObj3D = new Object3D();
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 2;
        sunLight.castShadow = true;
        lightObj3D.rotationX = 24;
        lightObj3D.rotationY = -151;
        view.scene.addChild(lightObj3D);
        sky.relativeTransform = lightObj3D.transform;

        Engine3D.startRenderView(view);

        this.createScene(view.scene);
    }

    createScene(scene: Scene3D) {
        // create the ground and add a rigid body
        let ground = Object3DUtil.GetSingleCube(30, 0, 30, 1, 1, 1);
        scene.addChild(ground);

        let rigidbody = ground.addComponent(Rigidbody);
        rigidbody.mass = 0;
        rigidbody.shape = Rigidbody.collisionShape.createStaticPlaneShape();

        // create shelves, cloth, and ball
        this.createShelves(scene);
        this.createCloth(scene);
        const ballRb = this.createBall(scene);

        this.debug(scene, ballRb);
    }


    createShelves(scene: Scene3D) {
        let shelf1 = Object3DUtil.GetSingleCube(0.5, 5, 0.5, 1, 1, 1); // left top
        let shelf2 = shelf1.clone(); // right top
        let shelf3 = shelf1.clone(); // left bottom
        let shelf4 = shelf1.clone(); // right bottom
        shelf1.localPosition = new Vector3(-4, 2.5, -4);
        shelf2.localPosition = new Vector3(4, 2.5, -4);
        shelf3.localPosition = new Vector3(-4, 2.5, 4);
        shelf4.localPosition = new Vector3(4, 2.5, 4);
        scene.addChild(shelf1);
        scene.addChild(shelf2);
        scene.addChild(shelf3);
        scene.addChild(shelf4);
    }

    createCloth(scene: Scene3D) {
        const cloth = new Object3D();
        let meshRenderer = cloth.addComponent(MeshRenderer);
        meshRenderer.geometry = new PlaneGeometry(8, 8, 20, 20, Vector3.UP);
        let material = new LitMaterial();
        material.baseMap = Engine3D.res.redTexture;
        material.cullMode = 'none';
        meshRenderer.material = material;

        cloth.y = 5;
        scene.addChild(cloth);

        // add cloth softbody component
        let softBody = cloth.addComponent(ClothSoftbody);
        softBody.mass = 1;
        softBody.margin = 0.2;
        softBody.fixNodeIndices = ['leftTop', 'rightTop', 'leftBottom', 'rightBottom'];
    }

    createBall(scene: Scene3D) {
        const ball = Object3DUtil.GetSingleSphere(1, 0.5, 0.2, 0.8);
        ball.y = 10;
        scene.addChild(ball);

        let rigidbody = ball.addComponent(Rigidbody);
        rigidbody.mass = 1.6;
        rigidbody.shape = Rigidbody.collisionShape.createShapeFromObject(ball);

        return rigidbody;
    }

    debug(scene: Scene3D, ballRb: Rigidbody) {
        const graphic3D = new Graphic3D();
        scene.addChild(graphic3D);
        Physics.initDebugDrawer(graphic3D);

        let gui = new dat.GUI();
        let f = gui.addFolder('PhysicsDebug');
        f.add(Physics.debugDrawer, 'enable');
        f.add(Physics.debugDrawer, 'debugMode', Physics.debugDrawer.debugModeList);
        gui.add({ ResetBall: () => ballRb.updateTransform(new Vector3(0, 10, 0), null, true) }, 'ResetBall');
    }

}

new Sample_Cloth().run();

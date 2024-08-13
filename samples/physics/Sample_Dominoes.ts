import { Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, Vector3, AtmosphericComponent, DirectLight, CameraUtil, HoverCameraController, Color, Quaternion, GridObject } from "@orillusion/core";
import { CollisionShapeUtil, Physics, Rigidbody } from "@orillusion/physics";
import { Stats } from "@orillusion/stats";
import dat from "dat.gui";
import { Graphic3D } from '@orillusion/graphic'

/**
 * Sample class demonstrating the creation of a domino effect with physics interactions.
 */
class Sample_Dominoes {
    scene: Scene3D;
    gui: dat.GUI;

    async run() {
        // init physics and engine
        await Physics.init();
        await Engine3D.init({ renderLoop: () => Physics.update() });
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 200;

        let scene = this.scene = new Scene3D();
        scene.addComponent(Stats);

        // 启用物理调试功能时，需要为绘制器传入graphic3D对象
        const graphic3D = new Graphic3D();
        scene.addChild(graphic3D);
        Physics.initDebugDrawer(graphic3D, { enable: false });
        
        this.gui = new dat.GUI();
        let f = this.gui.addFolder('PhysicsDebug');
        f.add(Physics.debugDrawer, 'enable');
        f.add(Physics.debugDrawer, 'debugMode', Physics.debugDrawer.debugModeList);
        f.add(Physics, 'isStop');
        f.open();

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 0.1, 800.0);
        camera.object3D.addComponent(HoverCameraController).setCamera(0, -25, 100);

        // Create directional light
        let lightObj3D = new Object3D();
        lightObj3D.localRotation = new Vector3(120, 130, 50);
        lightObj3D.addComponent(DirectLight).castShadow = true;
        scene.addChild(lightObj3D);

        // init sky
        scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let view = new View3D();
        view.camera = camera;
        view.scene = scene;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    // init the scene with ground, slide, ball, and dominoes.
    private async initScene() {
        // Create ground and add rigidbody
        let ground = Object3DUtil.GetPlane(Engine3D.res.whiteTexture);
        ground.scaleX = ground.scaleY = ground.scaleZ = 200;

        this.scene.addChild(ground);

        let rigidbody = ground.addComponent(Rigidbody);
        rigidbody.shape = CollisionShapeUtil.createStaticPlaneShape(); // Static plane shape at origin, extending infinitely upwards
        rigidbody.mass = 0;
        rigidbody.friction = 100; // Set high friction for the ground
        rigidbody.isSilent = true; // Disable collision events


        // Create dominoes
        this.createDominoes();

        // init slide
        await this.initSlide();

        // Create ball
        this.createBall();

    }

    //  Load and initialize the slide model.
    private async initSlide() {
        let model = await Engine3D.res.loadGltf('https://raw.githubusercontent.com/ID-Emmett/static-assets/main/models/slide.glb');
        model.x = -40;
        this.scene.addChild(model);

        let rigidbody = model.addComponent(Rigidbody);
        rigidbody.shape = Rigidbody.collisionShape.createBvhTriangleMeshShape(model);
        rigidbody.mass = 0;
        rigidbody.friction = 0.1;
        // Disable debug visibility for the physics shape
        rigidbody.isDisableDebugVisible = true;
        this.gui.__folders['PhysicsDebug'].add(rigidbody, 'isDisableDebugVisible').listen();
    }

    // Create a series of dominoes with rigid bodies and arrange them in an S-shaped curve.
    private createDominoes() {
        const width = 0.5;
        const height = 5;
        const depth = 2;

        const originX = -7;
        const originZ = 4.7;

        const totalDominoes = 40;
        const segmentLength = 2; // Distance between dominoes

        let previousX = originX;
        let previousZ = originZ;

        for (let i = 0; i < totalDominoes; i++) {
            let box = Object3DUtil.GetSingleCube(width, height, depth, Math.random(), Math.random(), Math.random());

            let angle = (Math.PI / (totalDominoes / 2)) * i;
            let x = originX + segmentLength * i;
            let z = originZ + Math.sin(angle) * 15; // Adjust sine curve amplitude for S-shape

            box.localPosition = new Vector3(x, height / 2, z);

            // Adjust each domino's rotation to align with the curve
            let deltaX = x - previousX;
            let deltaZ = z - previousZ;
            box.rotationY = i === 0 ? -48 : -Math.atan2(deltaZ, deltaX) * (180 / Math.PI);

            this.scene.addChild(box);

            previousX = x;
            previousZ = z;

            let rigidbody = box.addComponent(Rigidbody);
            rigidbody.shape = Rigidbody.collisionShape.createBoxShape(box);
            rigidbody.mass = 30;
            rigidbody.friction = 0.1;
            rigidbody.collisionEvent = (contactPoint, selfBody, otherBody) => {
                rigidbody.enableCollisionEvent = false; // Handle collision only once
                (box.getComponent(MeshRenderer).material as LitMaterial).baseColor = Color.random();
            };
        }
    }

    // Create a ball with a rigid body.
    private createBall() {
        let ball = Object3DUtil.GetSingleSphere(0.8, Math.random(), Math.random(), Math.random());

        const originPos = new Vector3(-13.2 - 40, 28.6, 6.2);
        ball.localPosition = originPos;
        let rigidbody = ball.addComponent(Rigidbody);
        rigidbody.shape = Rigidbody.collisionShape.createSphereShape(ball);
        rigidbody.mass = 50;
        rigidbody.enablePhysicsTransformSync = true;
        rigidbody.friction = 0.05;

        let f = this.gui.addFolder("ball");
        f.open();
        f.add(rigidbody, 'isKinematic').onChange(v => v || (rigidbody.enablePhysicsTransformSync = true));
        f.add({ SyncInfo: "Modify XYZ to sync rigidbody" }, "SyncInfo");
        f.add(ball.transform, 'x', -100, 100, 0.01).listen().onChange(() => rigidbody.clearForcesAndVelocities());
        f.add(ball.transform, 'y', 0.8, 40, 0.01).listen().onChange(() => rigidbody.clearForcesAndVelocities());
        f.add(ball.transform, 'z', -100, 100, 0.01).listen().onChange(() => rigidbody.clearForcesAndVelocities());
        f.add({ ResetPosition: () => rigidbody.updateTransform(originPos, Quaternion._zero, true) }, 'ResetPosition');

        this.scene.addChild(ball);
    }
}

new Sample_Dominoes().run();

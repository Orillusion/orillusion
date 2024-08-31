import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, LitMaterial, MeshRenderer, Vector3, Object3DUtil, Color, } from "@orillusion/core";
import { Graphic3D } from "@orillusion/graphic";
import { Physics, Rigidbody, RopeSoftbody } from "@orillusion/physics";
import dat from "dat.gui";

class Sample_Rope {
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

        // create shelves
        this.createShelves(scene);

        // create balls and ropes
        for (let i = 0; i < 7; i++) {
            let pos = new Vector3(6 - i * 2, 8, 0);

            // check if this is the last ball (tail)
            let ballRb = this.createBall(scene, pos, i === 6);

            // create the rope connected to the ball
            this.createRope(scene, pos, ballRb);
        }

        this.debug(scene);
    }


    createShelves(scene: Scene3D) {
        let shelf1 = Object3DUtil.GetSingleCube(0.2, 8, 0.2, 1, 1, 1); // left 
        let shelf2 = Object3DUtil.GetSingleCube(0.2, 8, 0.2, 1, 1, 1); // right 
        let shelf3 = Object3DUtil.GetSingleCube(20.2, 0.2, 0.2, 1, 1, 1); // top
        shelf1.localPosition = new Vector3(-10, 4, 0);
        shelf2.localPosition = new Vector3(10, 4, 0);
        shelf3.localPosition = new Vector3(0, 8, 0);
        scene.addChild(shelf1);
        scene.addChild(shelf2);
        scene.addChild(shelf3);
    }

    createBall(scene: Scene3D, pos: Vector3, isTail: boolean) {
        const ball = Object3DUtil.GetSingleSphere(0.82, 1, 1, 1);
        ball.x = pos.x - (isTail ? 3 : 0);
        ball.y = pos.y / 3 + (isTail ? 1.16 : 0);
        scene.addChild(ball);

        let rigidbody = ball.addComponent(Rigidbody);
        rigidbody.shape = Rigidbody.collisionShape.createShapeFromObject(ball);
        rigidbody.mass = 1.1;
        rigidbody.restitution = 1.13;

        // ball collision event to change color
        let ballMaterial = ball.getComponent(MeshRenderer).material as LitMaterial;

        let timer: number | null = null;
        rigidbody.collisionEvent = (contactPoint, selfBody, otherBody) => {
            if (timer !== null) clearTimeout(timer);
            else ballMaterial.baseColor = new Color(Color.SALMON);

            timer = setTimeout(() => {
                ballMaterial.baseColor = Color.COLOR_WHITE;
                timer = null;
            }, 100);
        }

        return rigidbody;
    }

    createRope(scene: Scene3D, pos: Vector3, tailRb: Rigidbody) {
        let ropeObj = new Object3D();
        let mr = ropeObj.addComponent(MeshRenderer);
        mr.material = new LitMaterial();
        mr.material.topology = 'line-list';
        mr.geometry = RopeSoftbody.buildRopeGeometry(10, pos, new Vector3(0, 0, 0));
        scene.addChild(ropeObj);

        // add rope softbody component
        let ropeSoftbody = ropeObj.addComponent(RopeSoftbody);
        ropeSoftbody.fixeds = 1; // fixed top
        ropeSoftbody.mass = 1.0;
        ropeSoftbody.elasticity = 1;
        ropeSoftbody.anchorRigidbodyTail = tailRb;
        ropeSoftbody.anchorOffsetTail.set(0, 0.82, 0); // 0.82 is ball radius
    }

    debug(scene: Scene3D) {
        const graphic3D = new Graphic3D();
        scene.addChild(graphic3D);
        Physics.initDebugDrawer(graphic3D);

        let gui = new dat.GUI();
        let f = gui.addFolder('PhysicsDebug');
        f.add(Physics.debugDrawer, 'enable');
        f.add(Physics.debugDrawer, 'debugMode', Physics.debugDrawer.debugModeList);
    }

}

new Sample_Rope().run();

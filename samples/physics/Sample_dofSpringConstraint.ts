import { Engine3D, Object3D, Scene3D, View3D, Object3DUtil, Vector3, AtmosphericComponent, DirectLight, CameraUtil, HoverCameraController, Quaternion } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { ActivationState, CollisionShapeUtil, DebugDrawMode, Generic6DofSpringConstraint, Physics, Rigidbody } from "@orillusion/physics";
import dat from "dat.gui";
import { Graphic3D } from "@orillusion/graphic";

class Sample_dofSpringConstraint {
    scene: Scene3D;
    gui: dat.GUI;

    async run() {
        // Initialize physics and engine
        await Physics.init({ useDrag: true });
        await Engine3D.init({ renderLoop: () => Physics.update() });

        let scene = this.scene = new Scene3D();
        scene.addComponent(Stats);

        // 在引擎启动后初始化物理调试功能，需要为绘制器传入 graphic3D 对象
        const graphic3D = new Graphic3D();
        scene.addChild(graphic3D);
        Physics.initDebugDrawer(graphic3D, {
            enable: false,
            debugDrawMode: DebugDrawMode.DrawConstraintLimits
        })

        this.gui = new dat.GUI();
        let f = this.gui.addFolder('PhysicsDebug');
        f.add(Physics.debugDrawer, 'enable');
        f.add(Physics.debugDrawer, 'debugMode', Physics.debugDrawer.debugModeList);
        f.open();

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 0.1, 800.0);
        camera.object3D.addComponent(HoverCameraController).setCamera(140, -25, 20, new Vector3(8, 4, 0));

        // Create directional light
        let lightObj3D = new Object3D();
        lightObj3D.localRotation = new Vector3(36, -130, 60);
        lightObj3D.addComponent(DirectLight).castShadow = true;
        scene.addChild(lightObj3D);

        // Initialize sky
        scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let view = new View3D();
        view.camera = camera;
        view.scene = scene;

        Engine3D.startRenderView(view);

        // Create ground, bridge, and ball
        this.createGround();
        this.createBridge();
        this.createBall();
    }

    //Create the ground plane.
    private async createGround() {
        let ground = Object3DUtil.GetPlane(Engine3D.res.whiteTexture);
        ground.scaleX = 50;
        ground.scaleZ = 50;
        this.scene.addChild(ground);

        let rigidbody = ground.addComponent(Rigidbody);
        rigidbody.shape = CollisionShapeUtil.createStaticPlaneShape();
        rigidbody.mass = 0;
    }

    // Create a ball with a rigid body.
    private createBall() {
        let ball = Object3DUtil.GetSingleSphere(1, 1, 1, 1);
        ball.localPosition = new Vector3(2, 10, 0);
        this.scene.addChild(ball);

        let ballRb = ball.addComponent(Rigidbody);
        ballRb.shape = CollisionShapeUtil.createSphereShape(ball);
        ballRb.mass = 50;
        ballRb.restitution = 1.2;

        let f = this.gui.addFolder('ball');
        f.add({
            ResetPosition: () => {
                let pos = new Vector3(Math.random() * 15, 10, 0);
                ballRb.updateTransform(pos, Quaternion._zero, true);
            }
        }, 'ResetPosition');
        f.open();
    }

    // Create a bridge using multiple segments and constraints.
    private createBridge() {
        const numSegments = 15;
        const segmentWidth = 1;
        const segmentHeight = 0.2;
        const segmentDepth = 5;
        const distance = 0.1; // Distance between bridge segments
        const pierHeight = 5; // Height of the piers

        let bridgeSegments: Rigidbody[] = [];
        for (let i = 0; i < numSegments; i++) {
            const isStatic = i === 0 || i === numSegments - 1;
            const mass = isStatic ? 0 : 2;
            const staticHeight = isStatic ? pierHeight : 0;
            let bridgeObj = Object3DUtil.GetSingleCube(segmentWidth, segmentHeight + staticHeight, segmentDepth, Math.random(), Math.random(), Math.random());

            const posX = i * segmentWidth + i * distance || distance;
            const posY = isStatic ? pierHeight / 2 + segmentHeight / 2 : pierHeight;
            bridgeObj.localPosition = new Vector3(posX, posY, 0);

            this.scene.addChild(bridgeObj);
            let segment = this.addBoxShapeRigidBody(bridgeObj, mass, !isStatic);
            bridgeSegments.push(segment);
        }

        let constraintList: Generic6DofSpringConstraint[] = [];
        for (let i = 0; i < numSegments - 1; i++) {
            let segmentA = bridgeSegments[i];
            let segmentB = bridgeSegments[i + 1];

            let dofSpringConstraint = segmentA.object3D.addComponent(Generic6DofSpringConstraint);
            dofSpringConstraint.targetRigidbody = segmentB;

            let selfHeight = i === 0 ? pierHeight / 2 : 0; // Start
            let targetHeight = i === numSegments - 2 ? pierHeight / 2 : 0; // End

            dofSpringConstraint.pivotSelf.set(segmentWidth / 2, selfHeight, 0);
            dofSpringConstraint.pivotTarget.set(-segmentWidth / 2, targetHeight, 0);

            dofSpringConstraint.linearLowerLimit.set(-distance, 0, 0);
            dofSpringConstraint.linearUpperLimit.set(distance, 0, 0);
            dofSpringConstraint.angularLowerLimit.set(0, -0.03, -Math.PI / 2);
            dofSpringConstraint.angularUpperLimit.set(0, 0.03, Math.PI / 2);

            // Enable angular spring and configure parameters
            for (let j = 3; j < 6; j++) {
                dofSpringConstraint.enableSpring(j, true);
                dofSpringConstraint.setStiffness(j, 10.0);
                dofSpringConstraint.setDamping(j, 0.5);
                dofSpringConstraint.setEquilibriumPoint(j);
            }

            constraintList.push(dofSpringConstraint);
        }

        this.debug(constraintList, distance);
    }

    // Add a rigid body with a box shape to an object.
    private addBoxShapeRigidBody(obj: Object3D, mass: number, disableHibernation?: boolean) {
        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.shape = CollisionShapeUtil.createBoxShape(obj);
        rigidbody.mass = mass;
        if (disableHibernation) rigidbody.activationState = ActivationState.DISABLE_DEACTIVATION;
        return rigidbody;
    }

    // Debug constraints using the dat.GUI interface.
    private debug(constraintList: Generic6DofSpringConstraint[], distance: number) {
        let f = this.gui.addFolder('Constraint');
        let refer = constraintList[0];

        const spring = {
            stiffness: 10.0,
            damping: 0.5
        };
        f.add(spring, 'stiffness', 0, 100, 0.1).onChange(() => updateSpring()).listen();
        f.add(spring, 'damping', 0, 100, 0.1).onChange(() => updateSpring()).listen();

        const updateSpring = () => {
            constraintList.forEach(constraint => {
                for (let j = 0; j < 6; j++) {
                    constraint.enableSpring(j, true);
                    constraint.setStiffness(j, spring.stiffness);
                    constraint.setDamping(j, spring.damping);
                }
                constraint.setEquilibriumPoint();
            });
        };

        f.add({ angularLower: "angularLowerLimit" }, "angularLower");
        f.add(refer.angularLowerLimit, 'x', -Math.PI, 0, 0.01).onChange(() => updateLimit('angularLowerLimit')).listen();
        f.add(refer.angularLowerLimit, 'y', -Math.PI, 0, 0.01).onChange(() => updateLimit('angularLowerLimit')).listen();
        f.add(refer.angularLowerLimit, 'z', -Math.PI, 0, 0.01).onChange(() => updateLimit('angularLowerLimit')).listen();

        f.add({ angularUpper: "angularUpperLimit" }, "angularUpper");
        f.add(refer.angularUpperLimit, 'x', 0, Math.PI, 0.01).onChange(() => updateLimit('angularUpperLimit')).listen();
        f.add(refer.angularUpperLimit, 'y', 0, Math.PI, 0.01).onChange(() => updateLimit('angularUpperLimit')).listen();
        f.add(refer.angularUpperLimit, 'z', 0, Math.PI, 0.01).onChange(() => updateLimit('angularUpperLimit')).listen();

        f.add({ linearLower: "linearLowerLimit" }, "linearLower");
        f.add(refer.linearLowerLimit, 'x', -10, 0, 0.01).onChange(() => updateLimit('linearLowerLimit')).listen();
        f.add(refer.linearLowerLimit, 'y', -10, 0, 0.01).onChange(() => updateLimit('linearLowerLimit')).listen();
        f.add(refer.linearLowerLimit, 'z', -10, 0, 0.01).onChange(() => updateLimit('linearLowerLimit')).listen();

        f.add({ linearUpper: "linearUpperLimit" }, "linearUpper");
        f.add(refer.linearUpperLimit, 'x', 0, 10, 0.01).onChange(() => updateLimit('linearUpperLimit')).listen();
        f.add(refer.linearUpperLimit, 'y', 0, 10, 0.01).onChange(() => updateLimit('linearUpperLimit')).listen();
        f.add(refer.linearUpperLimit, 'z', 0, 10, 0.01).onChange(() => updateLimit('linearUpperLimit')).listen();

        f.add({
            Reset: () => {
                constraintList.forEach(constraint => {
                    constraint.linearLowerLimit = new Vector3(-distance, 0, 0);
                    constraint.linearUpperLimit = new Vector3(distance, 0, 0);
                    constraint.angularLowerLimit = new Vector3(0, -0.03, -Math.PI / 2);
                    constraint.angularUpperLimit = new Vector3(0, 0.03, Math.PI / 2);
                });

                spring['stiffness'] = 10.0;
                spring['damping'] = 0.5;
                updateSpring();
            }
        }, 'Reset');

        const updateLimit = (key: string) => {
            constraintList.forEach(constraint => constraint[key] = refer[key]);
        };
    }
}

new Sample_dofSpringConstraint().run();

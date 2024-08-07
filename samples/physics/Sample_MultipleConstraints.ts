import { Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, Vector3, AtmosphericComponent, DirectLight, CameraUtil, HoverCameraController, BitmapTexture2D, UnLitMaterial, PlaneGeometry, GPUCullMode, Quaternion, Color } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { ActivationState, ClothSoftbody, CollisionShapeUtil, DebugDrawMode, FixedConstraint, Generic6DofSpringConstraint, HingeConstraint, Physics, PointToPointConstraint, Rigidbody, SliderConstraint } from "@orillusion/physics";
import dat from "dat.gui";
import { Graphic3D } from "@orillusion/graphic";

/**
 * Sample class demonstrating the use of multiple constraints in a physics simulation.
 */
class Sample_MultipleConstraints {
    scene: Scene3D;
    gui: dat.GUI;

    async run() {
        // init physics and engine
        await Physics.init({ useSoftBody: true });
        await Engine3D.init({ renderLoop: () => Physics.update() });

        this.gui = new dat.GUI();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);

        // 在引擎启动后初始化物理调试功能，需要为绘制器传入 graphic3D 对象
        const graphic3D = new Graphic3D();
        this.scene.addChild(graphic3D);
        Physics.initDebugDrawer(graphic3D, {
            enable: false,
            debugDrawMode: DebugDrawMode.DrawConstraintLimits
        })

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.1, 800.0);
        camera.object3D.addComponent(HoverCameraController).setCamera(60, -25, 50);

        // create directional light
        let light = new Object3D();
        light.localRotation = new Vector3(36, -130, 60);
        let dl = light.addComponent(DirectLight)
        dl.castShadow = true;
        dl.intensity = 3;
        this.scene.addChild(light);

        // init sky
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let view = new View3D();
        view.camera = camera;
        view.scene = this.scene;

        this.physicsDebug()

        Engine3D.startRenderView(view);

        // Create ground, impactor, turntable, and chains
        this.createGround();
        await this.createImpactor();
        await this.createTurntable();
        await this.createChains();

    }

    private physicsDebug() {
        let physicsFolder = this.gui.addFolder('PhysicsDebug');
        physicsFolder.add(Physics.debugDrawer, 'enable');
        physicsFolder.add(Physics.debugDrawer, 'debugMode', Physics.debugDrawer.debugModeList);
        physicsFolder.add(Physics, 'isStop');
        physicsFolder.open();
    }

    private async createGround() {
        // Create ground
        let ground = Object3DUtil.GetSingleCube(61, 2, 20, 1, 1, 1);
        ground.y = -1; // Set ground half-height
        this.scene.addChild(ground);

        // Add rigidbody to ground
        let groundRb = ground.addComponent(Rigidbody);
        groundRb.shape = CollisionShapeUtil.createStaticPlaneShape(Vector3.UP, 1);
        groundRb.mass = 0;
    }

    private async createImpactor() {
        // Create shelves
        const shelfSize = 0.5;
        const shelfHeight = 5;

        let shelfLeft = Object3DUtil.GetCube();
        shelfLeft.localScale = new Vector3(shelfSize, shelfHeight, shelfSize);
        shelfLeft.localPosition = new Vector3(-30, shelfHeight / 2, 0);

        let shelfRight = shelfLeft.clone();
        shelfRight.localPosition = new Vector3(30, shelfHeight / 2, 0);

        let shelfTop = Object3DUtil.GetCube();
        shelfTop.localScale = new Vector3(60 - shelfSize, shelfSize, shelfSize);
        shelfTop.localPosition = new Vector3(0, shelfHeight - shelfSize / 2, 0);

        // Add rigidbodies to shelves
        let shelfRightRb = this.addBoxShapeRigidBody(shelfRight, 0);
        let shelfLeftRb = this.addBoxShapeRigidBody(shelfLeft, 0);
        this.addBoxShapeRigidBody(shelfTop, 0);

        this.scene.addChild(shelfLeft);
        this.scene.addChild(shelfRight);
        this.scene.addChild(shelfTop);

        // Create slider
        let slider = Object3DUtil.GetSingleCube(4, 1, 1, Math.random(), Math.random(), Math.random());
        this.scene.addChild(slider);

        // Add rigidbody to slider
        let sliderRb = this.addBoxShapeRigidBody(slider, 500, true, [0.2, 0]);

        // Create fulcrum
        let fulcrum = Object3DUtil.GetCube();
        fulcrum.localScale = new Vector3(1, 1, 5);
        fulcrum.localPosition = new Vector3(0, shelfHeight - shelfSize / 2, 3);
        this.scene.addChild(fulcrum);

        // Add rigidbody to fulcrum and initialize cloth softbody
        let fulcrumRb = this.addBoxShapeRigidBody(fulcrum, 200, true);
        this.initClothSoftBody(fulcrumRb);

        // Create fixed constraint to attach slider to fulcrum
        let fixedConstraint = slider.addComponent(FixedConstraint);
        fixedConstraint.targetRigidbody = fulcrumRb;
        fixedConstraint.pivotTarget = new Vector3(0, 0, -3);

        // Create slider constraint
        let sliderConstraint = shelfTop.addComponent(SliderConstraint);
        sliderConstraint.targetRigidbody = sliderRb;
        sliderConstraint.lowerLinLimit = -30;
        sliderConstraint.upperLinLimit = 30;
        sliderConstraint.lowerAngLimit = 0;
        sliderConstraint.upperAngLimit = 0;
        sliderConstraint.poweredLinMotor = true;
        sliderConstraint.maxLinMotorForce = 1;
        sliderConstraint.targetLinMotorVelocity = 20;

        // Setup slider motor event controller
        this.sliderMotorEventController(shelfLeftRb, shelfRightRb, sliderConstraint);
    }

    private sliderMotorEventController(leftRb: Rigidbody, rightRb: Rigidbody, slider: SliderConstraint) {
        // Control slider movement based on collision events
        const timer = { pauseDuration: 1000 };

        leftRb.collisionEvent = () => {
            rightRb.enableCollisionEvent = true;
            leftRb.enableCollisionEvent = false;
            setTimeout(() => {
                slider.targetLinMotorVelocity = Math.abs(slider.targetLinMotorVelocity);
                setTimeout(() => leftRb.enableCollisionEvent = true, 1000);
            }, timer.pauseDuration);
        };

        rightRb.collisionEvent = () => {
            rightRb.enableCollisionEvent = false;
            leftRb.enableCollisionEvent = true;
            setTimeout(() => {
                slider.targetLinMotorVelocity = -Math.abs(slider.targetLinMotorVelocity);
                setTimeout(() => rightRb.enableCollisionEvent = true, 1000);
            }, timer.pauseDuration);
        };

        // GUI controls for slider motor
        let folder = this.gui.addFolder('Slider Motor Controller');
        folder.open();
        folder.add(slider, 'poweredLinMotor');
        folder.add(slider, 'maxLinMotorForce', 0, 30, 1);
        folder.add({ velocity: slider.targetLinMotorVelocity }, 'velocity', 0, 30, 1).onChange(v => {
            slider.targetLinMotorVelocity = slider.targetLinMotorVelocity > 0 ? v : -v;
        });
        folder.add(timer, 'pauseDuration', 0, 3000, 1000);
    }

    private async createTurntable() {
        // Create turntable components
        const columnWidth = 0.5;
        const columnHeight = 4.75 - columnWidth / 2;
        const columnDepth = 0.5;

        let column = Object3DUtil.GetCube();
        column.localScale = new Vector3(columnWidth, columnHeight, columnDepth);
        column.localPosition = new Vector3(0, columnHeight / 2, 8);

        let arm1 = Object3DUtil.GetCube();
        arm1.localScale = new Vector3(10, 0.5, 0.5);
        arm1.localPosition = new Vector3(0, columnHeight + columnWidth / 2, 8);

        let arm2 = arm1.clone();
        arm2.y += 10; // Ensure no overlap before adding constraints
        arm2.rotationY = 45;

        this.scene.addChild(column);
        this.scene.addChild(arm1);
        this.scene.addChild(arm2);

        // Add rigidbodies to turntable components
        this.addBoxShapeRigidBody(column, 0);
        let arm1Rb = this.addBoxShapeRigidBody(arm1, 500, true);
        let arm2Rb = this.addBoxShapeRigidBody(arm2, 500, true);

        // Create hinge constraint to attach arm1 to column
        let hinge = column.addComponent(HingeConstraint);
        hinge.targetRigidbody = arm1Rb;
        hinge.pivotSelf.set(0, columnHeight / 2 + columnWidth / 2, 0);
        hinge.enableAngularMotor(true, 5, 50);

        // Create fixed constraint to attach arm2 to arm1
        let fixedConstraint = arm2.addComponent(FixedConstraint);
        fixedConstraint.targetRigidbody = arm1Rb;
        fixedConstraint.rotationTarget.fromEulerAngles(0, 90, 0);
        fixedConstraint.pivotTarget.set(0, 0, 0);
    }

    private async createChains() {
        const chainHeight = 1;

        let chainLink = Object3DUtil.GetCube();
        chainLink.localScale = new Vector3(0.25, chainHeight, 0.25);
        chainLink.localPosition = new Vector3(5, 16, 5);
        this.scene.addChild(chainLink);

        // Add static rigidbody to the first chain link
        let chainRb = this.addBoxShapeRigidBody(chainLink, 0);
        let prevRb = chainRb;

        // Create chain links and add point-to-point constraints
        for (let i = 0; i < 10; i++) {
            let link = chainLink.clone();
            link.y -= (i + 1) * chainHeight;
            this.scene.addChild(link);

            let linkRb = this.addBoxShapeRigidBody(link, 1, false, [0.3, 0.3]);
            linkRb.isSilent = true; // Disable collision events

            let p2p = link.addComponent(PointToPointConstraint);
            p2p.targetRigidbody = prevRb;
            p2p.pivotTarget.y = -chainHeight / 2;
            p2p.pivotSelf.y = chainHeight / 2;

            prevRb = linkRb;
        }

        // Create a sphere and add point-to-point constraint to the last chain link
        const sphereRadius = 0.8;
        let sphere = Object3DUtil.GetSingleSphere(sphereRadius, 1, 1, 1);
        let sphereMaterial = (sphere.getComponent(MeshRenderer).material as LitMaterial);

        sphere.localPosition = new Vector3(5, 4.5, 5);
        this.scene.addChild(sphere);

        let sphereRb = sphere.addComponent(Rigidbody);
        sphereRb.shape = CollisionShapeUtil.createSphereShape(sphere);
        sphereRb.mass = 2;
        sphereRb.damping = [0.3, 0.3];
        sphereRb.enablePhysicsTransformSync = true;

        // Sphere collision event to change color
        let timer: number | null = null;
        sphereRb.collisionEvent = () => {
            if (timer !== null) clearTimeout(timer);
            else sphereMaterial.baseColor = new Color(Color.SALMON);

            timer = setTimeout(() => {
                sphereMaterial.baseColor = Color.COLOR_WHITE;
                timer = null;
            }, 1000);
        };

        let p2p = sphere.addComponent(PointToPointConstraint);
        p2p.disableCollisionsBetweenLinkedBodies = true;
        p2p.targetRigidbody = prevRb;
        p2p.pivotTarget.y = -chainHeight / 2;
        p2p.pivotSelf.y = sphereRadius;
    }

    private async initClothSoftBody(anchorRb: Rigidbody) {
        const cloth = new Object3D();
        let meshRenderer = cloth.addComponent(MeshRenderer);
        meshRenderer.geometry = new PlaneGeometry(3, 3, 10, 10);
        let material = new LitMaterial();
        material.baseMap = Engine3D.res.redTexture;
        material.cullMode = GPUCullMode.none;
        meshRenderer.material = material;

        this.scene.addChild(cloth);

        // Add cloth softbody component
        let softBody = cloth.addComponent(ClothSoftbody);
        softBody.mass = 5;
        softBody.margin = 0.1;
        softBody.anchorRigidbody = anchorRb; // Anchor rigidbody
        softBody.anchorIndices = ['leftTop', 'top', 'rightTop']; // Anchor points
        softBody.influence = 1; // Attachment influence
        softBody.disableCollision = false; // Enable collision with anchor
        softBody.applyPosition = new Vector3(0, -2.1, 0); // Relative position to anchor
        softBody.applyRotation = new Vector3(0, 90, 0); // Relative rotation to anchor

        // Configure softbody parameters
        softBody.wait().then(btSoftbody => {
            let sbConfig = btSoftbody.get_m_cfg();
            sbConfig.set_kDF(0.2);
            sbConfig.set_kDP(0.01);
            sbConfig.set_kLF(0.02);
            sbConfig.set_kDG(0.001);
        });
    }

    private addBoxShapeRigidBody(obj: Object3D, mass: number, disableHibernation?: boolean, damping?: [number, number]) {
        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.shape = CollisionShapeUtil.createBoxShape(obj);
        rigidbody.mass = mass;

        if (disableHibernation) rigidbody.activationState = ActivationState.DISABLE_DEACTIVATION;
        if (damping) rigidbody.damping = damping;

        return rigidbody;
    }
}

new Sample_MultipleConstraints().run();

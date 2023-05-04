import { Ammo, Physics, Rigidbody } from "@orillusion/physics";
import { Object3D, Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, DirectLight, View3D, Vector3, MeshRenderer, PlaneGeometry, LitMaterial, Color, ColliderComponent, BoxColliderShape, BoxGeometry } from "@orillusion/core";

export class Sample_paw {
    leftPad: Ammo.btSliderConstraint;
    left: Ammo.btRigidBody;
    right: Ammo.btRigidBody;
    box: Ammo.btRigidBody;
    leftUserIndex: number = 1;
    rightUserIndex: number = 2;
    boxUserIndex: number = 3;
    pawLocked: boolean = false;
    pawVec: number = 0;
    pawVecTarget: number = 0;
    sliderLeft: Ammo.btSliderConstraint;
    sliderRight: Ammo.btSliderConstraint;

    point2PointLeft: Ammo.btPoint2PointConstraint;
    point2PointRight: Ammo.btPoint2PointConstraint;

    pawModel: Object3D;

    constructor() { }

    async run() {

        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 77;
        Engine3D.setting.shadow.shadowBias = 0.00195;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.render.postProcessing.gtao.debug = false;
        Engine3D.setting.render.postProcessing.taa.debug = false;
        await Physics.init();
        Physics.world.getSolverInfo().set_m_numIterations(20);
        Physics.world.getSolverInfo().set_m_splitImpulse(true);
        Physics.world.getSolverInfo().set_m_splitImpulsePenetrationThreshold(0.0);
        await Engine3D.init({
            renderLoop: () => this.loop(), canvasConfig: {
                alpha: true,
                backgroundImage: '/logo/bg.webp',
            }
        });


        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.hideSky();
        scene.transform.scaleX = 10;
        scene.transform.scaleY = 10;
        scene.transform.scaleZ = 10;

        let mainCamera = CameraUtil.createCamera3DObject(scene);

        mainCamera.perspective(60, webGPUContext.aspect, 0.1, 2000.0);
        // let hoverCameraController = this.scene.mainCamera.addComponent(FlyCameraController);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(-135, -25, 15);
        hoverCameraController.mouseRightFactor = 0.01;
        hoverCameraController.wheelStep = 0.0005;

        let ligthObj = new Object3D();
        let dl = ligthObj.addComponent(DirectLight);
        dl.transform.rotationX = 45;
        dl.intensity = 5.5;
        dl.castShadow = true;
        // dl.debug();
        scene.addChild(ligthObj);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);

        let root = new Object3D();
        root.y = -1;
        scene.addChild(root);

        let paw = await Engine3D.res.loadGltf('gltfs/glb/CTP2F50.glb');

        paw.localScale = new Vector3(10, 10, 10);
        // scene.addChild(paw);
        let scale = new Vector3(10, 10, 10);
        let finger2 = paw.getChildByName('FingerTip2') as Object3D;
        let finger1 = paw.getChildByName('FingerTip1') as Object3D;
        // finger1.transform.worldPosition
        let pedestal = paw.getChildByName('Pedestal') as Object3D;
        let logo = paw.getChildByName('Logo') as Object3D;
        pedestal.addChild(logo);
        finger1.localScale = finger2.localScale = pedestal.localScale = scale;
        this.pawModel = paw;

        //标尺 参照物
        {
            // let box = new Object3D();
            // let mr = box.addComponent(MeshRenderer)
            // mr.geometry = new BoxGeometry();
            // mr.material = new LitMaterial();
            // scene.addChild(box);
            // scene.addChild(new AxisObject(10));
        }

        let ground = new Object3D();
        {
            let mr = ground.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(5, 5, 1, 1);
            let mat = mr.material = new LitMaterial();
            mat.baseColor = new Color(75.0 / 255.0, 75.0 / 255.0, 75.0 / 255.0);
            mat.roughness = 0.85;
            let physcisGround = new Object3D();
            let rb = physcisGround.addComponent(Rigidbody);
            rb.mass = 0;
            let collider = physcisGround.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(500, 1, 500);
            physcisGround.y = -0.5;
            ground.addChild(physcisGround);
            root.addChild(ground);
        }
        // return;
        let staticBox = new Object3D();

        {
            let size = new Vector3(1, 1, 1);
            let mr = staticBox.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(size.x, size.y, size.z);
            mr.enable = false;

            mr.material = new LitMaterial();
            mr.material.baseColor = new Color(1, 0.5, 0.5);
            let rb = staticBox.addComponent(Rigidbody);
            // staticBox.scaleX = 4;
            // staticBox.rotationZ=70 
            staticBox.y = 5;
            rb.mass = 10;
            // rb.isKinematic = true;

            let collider = staticBox.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(size.x, size.y, size.z);
            root.addChild(staticBox);
            staticBox.addChild(pedestal);
            pedestal.rotationX = -90;
            pedestal.y = 0.5;

            // staticBox.addChild(new AxisObject(3));
        }
        let base = new Object3D();
        {
            let size = new Vector3(0.01, 0.01, 0.01);
            let mr = base.addComponent(MeshRenderer);

            mr.geometry = new BoxGeometry(size.x, size.y, size.z);
            mr.material = new LitMaterial();
            mr.material.baseColor = new Color(1, 0.5, 0.5);
            base.scaleX = 3;
            base.scaleZ = 4;
            let rb = base.addComponent(Rigidbody);
            rb.mass = 0;
            base.y = 8;
            base.rotationZ = 90;
            let collider = base.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = size; //new Vector3(0.01, 0.01, 0.01);
            root.addChild(base);
        }



        let pawY = 3;
        let pawMass = 3;
        let pawScale = new Vector3(0.06, 0.45, 0.25);
        let pawOffset = new Vector3(0.28, 1.3, 0);
        let pawORot = new Vector3(-90, 0, 0);

        let pawleft = new Object3D();
        {
            let mr = pawleft.addComponent(MeshRenderer);
            mr.enable = false;
            mr.geometry = new BoxGeometry(pawScale.x, pawScale.y, pawScale.z);
            mr.material = new LitMaterial();
            mr.material.baseColor = new Color(0.5, 0.5, 1);
            let rb = pawleft.addComponent(Rigidbody);
            rb.mass = pawMass;
            // pawleft.localScale = pawScale.clone();
            // paw.rotationZ = 90;
            pawleft.y = pawY;
            let collider = pawleft.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = pawScale;
            pawleft.x = -pawScale.x;
            root.addChild(pawleft);
            rb.addInitedFunction(() => {
                this.left = rb.btRigidbody;
                rb.btRigidbody.setUserIndex(this.leftUserIndex);
            }, this);
            pawleft.addChild(finger1);
            finger1.x = pawOffset.x;
            finger1.y = pawOffset.y;
            finger1.z = pawOffset.z;
            finger1.rotationX = pawORot.x;
            finger1.rotationY = pawORot.y;
            finger1.rotationZ = pawORot.z;
            // let axioObj = new AxisObject(5,);
            // pawleft.addChild(axioObj);
        }
        let pawRight = new Object3D();
        {
            let mr = pawRight.addComponent(MeshRenderer);
            mr.enable = false;
            mr.geometry = new BoxGeometry(pawScale.x, pawScale.y, pawScale.z);
            mr.material = new LitMaterial();
            mr.material.baseColor = new Color(0.5, 0.5, 1);
            let rb = pawRight.addComponent(Rigidbody);
            rb.mass = pawMass;
            // pawRight.scaleX = 2;
            // pawRight.localScale = pawScale.clone();
            // paw.rotationZ = 90;
            pawRight.y = pawY;
            let collider = pawRight.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = pawScale;
            pawRight.x = pawScale.x;
            rb.addInitedFunction(() => {
                this.right = rb.btRigidbody;
                rb.btRigidbody.setUserIndex(this.rightUserIndex);
            }, this);
            root.addChild(pawRight);
            pawRight.addChild(finger2);
            finger2.x = pawOffset.x - 0.56;
            finger2.y = pawOffset.y;
            finger2.z = pawOffset.z;
            finger2.rotationX = pawORot.x;
            finger2.rotationY = 180;
            finger2.rotationZ = pawORot.z;
        }

        let createHinge = () => {
            let baseRb = staticBox.getComponent(Rigidbody).btRigidbody;
            let pawRb = pawleft.getComponent(Rigidbody).btRigidbody;
            let axis = new Ammo.btVector3(0, 0, 1);
            let pa = new Ammo.btVector3(0, 0, 4);
            let pb = new Ammo.btVector3(0, 0, 0);
            let hinge = new Ammo.btHingeConstraint(baseRb, pawRb, pa, pb, axis, axis, true);
            Physics.world.addConstraint(hinge);
            let temp = {};
            temp['force'] = 0;
            temp['v'] = 10;
            hinge.enableAngularMotor(true, temp['v'], 50);
        };

        let constraintBase = () => {
            let upperLimit = -4;
            let lowerLimit = -8 + 1.05;
            let baseRb = base.getComponent(Rigidbody).btRigidbody;
            let boxRb = staticBox.getComponent(Rigidbody).btRigidbody;
            baseRb.setActivationState(4);
            boxRb.setActivationState(4);
            let localA = new Ammo.btTransform();
            let localB = new Ammo.btTransform();
            localA.setIdentity();
            localB.setIdentity();
            localA.getBasis().setEulerZYX(0, 0, 0);
            localA.setOrigin(new Ammo.btVector3(0, 0, 0));
            localB.getBasis().setEulerZYX(0, 0, Math.PI / 2);
            localB.setOrigin(new Ammo.btVector3(0, 0, 0));
            let constraint = new Ammo.btSliderConstraint(baseRb, boxRb, localA, localB, true);
            constraint.setUpperLinLimit(upperLimit);
            constraint.setLowerLinLimit(lowerLimit);
            constraint.setUpperAngLimit(0);
            constraint.setLowerAngLimit(0);
            constraint['setTargetLinMotorVelocity'](0);
            constraint['setPoweredLinMotor'](true);
            constraint['setBreakingImpulseThreshold'](99999999);
            constraint['setMaxLinMotorForce'](99);
            Physics.world.addConstraint(constraint);
            // base.addChild(new AxisObject(3,));
        };
        let initSliders = () => {
            let pawOrigin = new Vector3(-1, 0.8, 0);
            let upperLimit = 1.3;
            let lowerLimit = 1.02;
            // createHinge();
            // return;
            let baseRb = staticBox.getComponent(Rigidbody).btRigidbody;
            let pawRbLeft = pawleft.getComponent(Rigidbody).btRigidbody;
            let pawRbRight = pawRight.getComponent(Rigidbody).btRigidbody;
            pawRbLeft.setRestitution(0);
            pawRbRight.setRestitution(0);
            //friction
            pawRbLeft.setFriction(0.8);
            pawRbRight.setFriction(0.8);
            pawRbLeft.setRollingFriction(10);
            pawRbRight.setRollingFriction(10);

            baseRb.setActivationState(4);
            pawRbLeft.setActivationState(4);
            pawRbRight.setActivationState(4);

            //init left paw
            let localA = new Ammo.btTransform();
            let localB = new Ammo.btTransform();
            localA.setIdentity();
            localB.setIdentity();

            localA.getBasis().setEulerZYX(0, 0, 0);
            localA.setOrigin(new Ammo.btVector3(0, 0, 0));
            localB.getBasis().setEulerZYX(0, 0, 0);
            localB.setOrigin(new Ammo.btVector3(pawOrigin.x, pawOrigin.y, pawOrigin.z));
            let sliderConstraintLeft = new Ammo.btSliderConstraint(baseRb, pawRbLeft, localA, localB, true);
            sliderConstraintLeft.setUpperLinLimit(-lowerLimit);
            sliderConstraintLeft.setLowerLinLimit(-upperLimit);
            sliderConstraintLeft.setUpperAngLimit(0);
            sliderConstraintLeft.setLowerAngLimit(0);
            sliderConstraintLeft['setTargetLinMotorVelocity'](0);
            sliderConstraintLeft['setPoweredLinMotor'](true);
            sliderConstraintLeft['setBreakingImpulseThreshold'](9999);
            sliderConstraintLeft['setMaxLinMotorForce'](5);
            console.log(sliderConstraintLeft);

            //init right paw
            localA.getBasis().setEulerZYX(0, Math.PI * 2, 0);
            localA.setOrigin(new Ammo.btVector3(0, 0, 0));
            localB.getBasis().setEulerZYX(0, Math.PI * 2, 0);
            localB.setOrigin(new Ammo.btVector3(-pawOrigin.x, pawOrigin.y, pawOrigin.z));
            let sliderConstraintRight = new Ammo.btSliderConstraint(baseRb, pawRbRight, localA, localB, true);
            sliderConstraintRight.setUpperLinLimit(upperLimit);
            sliderConstraintRight.setLowerLinLimit(lowerLimit);
            sliderConstraintRight.setUpperAngLimit(0);
            sliderConstraintRight.setLowerAngLimit(0);
            sliderConstraintRight['setTargetLinMotorVelocity'](0);
            sliderConstraintRight['setPoweredLinMotor'](true);
            sliderConstraintRight['setBreakingImpulseThreshold'](9999);
            sliderConstraintRight['setMaxLinMotorForce'](5);

            // sliderConstraint.enableFeedback(true);

            // /setMaxLinMotorForce
            // sliderConstraint['setMaxLinMotorForce'](0.01);

            this.leftPad = sliderConstraintLeft;

            Physics.world.addConstraint(sliderConstraintLeft);
            Physics.world.addConstraint(sliderConstraintRight);
            this.sliderLeft = sliderConstraintLeft;
            this.sliderRight = sliderConstraintRight;
        }

        //抓取的box
        {
            let size = 0.2;
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(size, size, size);
            mr.material = new LitMaterial();
            mr.receiveShadow = true;
            mr.castShadow = true;
            let rb = box.addComponent(Rigidbody);
            rb.friction = 0.8;
            rb.restitution = 0;
            // rb.btRigidbody.getLinearFactor
            rb.mass = 0.1;
            let collider = box.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(size, size, size);
            box.y = size / 2;
            root.addChild(box);
            rb.addInitedFunction(() => {
                this.box = rb.btRigidbody;
                rb.btRigidbody.setUserIndex(this.boxUserIndex);

                constraintBase();
                initSliders();

            }, this);
            // rb.addInitedFunction(() => {
            //     rb.btRigidbody.setRestitution(0);
            //     rb.btRigidbody.setFriction(1);
            // }, rb);
        }

        setTimeout(() => {

        }, 200);
    }
    loop() {
        // sliderConstraintLeft['setTargetLinMotorVelocity'](temp['v']);

        // sliderConstraintRight['setTargetLinMotorVelocity'](-temp['v']);
        this.pawVec = this.pawVecTarget;
        if (this.pawLocked) {
            if (this.pawVecTarget > 0) {
                this.pawVec = 0;
            }
        }
        if (this.sliderLeft && this.sliderRight) {
            this.sliderLeft['setTargetLinMotorVelocity'](this.pawVec);
            this.sliderRight['setTargetLinMotorVelocity'](-this.pawVec);
        }

        Physics.update();
        let dis = Physics.world.getDispatcher();
        let num = dis.getNumManifolds();
        let isLeftConcat = false;
        let isRightCOncat = false;
        let leftConcatOnPaw: Ammo.btVector3;
        let leftConcatOnBox: Ammo.btVector3;
        let rightConcatOnPaw: Ammo.btVector3;
        let rightConcatOnBox: Ammo.btVector3;
        for (let i = 0; i < num; i++) {
            let contactMainFold = dis.getManifoldByIndexInternal(i);
            let ra = contactMainFold.getBody0();
            let rb = contactMainFold.getBody1();
            let raUserIndex = ra.getUserIndex();
            let rbUserIndex = rb.getUserIndex();
            if ((raUserIndex === this.leftUserIndex && rbUserIndex === this.boxUserIndex) || (raUserIndex === this.boxUserIndex && rbUserIndex === this.leftUserIndex)) {
                let numPt = contactMainFold.getNumContacts();
                for (let j = 0; j < numPt; j++) {
                    let pt = contactMainFold.getContactPoint(j);
                    if (pt.getDistance() <= 0.0001) {
                        if (raUserIndex === this.leftUserIndex) {
                            leftConcatOnPaw = pt.get_m_localPointA();
                            leftConcatOnBox = pt.get_m_localPointB();
                        } else {
                            leftConcatOnBox = pt.get_m_localPointA();
                            leftConcatOnPaw = pt.get_m_localPointB();
                        }
                        if (leftConcatOnPaw.x() > 0.03 && leftConcatOnPaw.y() >= -0.2) {
                            isLeftConcat = true;
                            // console.log("left concat on paw", leftConcatOnPaw.x(), leftConcatOnPaw.y(), leftConcatOnPaw.z());
                            break;
                        }
                    }
                }
                // let pt = contactMainFold.getContactPoint(0);
            }
            if ((raUserIndex === this.rightUserIndex && rbUserIndex === this.boxUserIndex) || (raUserIndex === this.boxUserIndex && rbUserIndex === this.rightUserIndex)) {
                let numPt = contactMainFold.getNumContacts();
                for (let j = 0; j < numPt; j++) {
                    let pt = contactMainFold.getContactPoint(j);
                    if (pt.getDistance() <= 0.0001) {
                        if (raUserIndex === this.rightUserIndex) {
                            rightConcatOnPaw = pt.get_m_localPointA();
                            rightConcatOnBox = pt.get_m_localPointB();
                        } else {
                            rightConcatOnBox = pt.get_m_localPointA();
                            rightConcatOnPaw = pt.get_m_localPointB();
                        }

                        if (rightConcatOnPaw.x() < -0.03 && rightConcatOnPaw.y() >= -0.2) {
                            // console.log("right concat on paw", rightConcatOnPaw.x());
                            isRightCOncat = true;
                            break;
                        }
                    }
                }

                // let pt = contactMainFold.getContactPoint(0);
            }

            // if ((ra === this.left && rb === this.box) ||
            //     (rb === this.left && ra === this.box)) {
            //     {
            //         isLeftConcat = true;
            //     }
            //     // console.log(contactMainFold);
            // }
            // if ((ra === this.right && rb === this.box) ||
            //     (rb === this.right && ra === this.box)) {
            //     isRightCOncat = true;
            // }

            //use user index
            // console.log(num);
            if (isLeftConcat && isRightCOncat) {
                if (!this.pawLocked) {
                    // console.log('start lock');
                    this.pawLocked = true;
                    //add point2point
                    let p1 = new Ammo.btPoint2PointConstraint(this.left, this.box, leftConcatOnPaw, leftConcatOnBox);
                    let p2 = new Ammo.btPoint2PointConstraint(this.right, this.box, rightConcatOnPaw, rightConcatOnBox);
                    let breakValue = 10;
                    p1.setBreakingImpulseThreshold(breakValue);
                    p2.setBreakingImpulseThreshold(breakValue);
                    Physics.world.addConstraint(p1);
                    Physics.world.addConstraint(p2);
                    this.point2PointLeft = p1;
                    this.point2PointRight = p2;
                    this.box.setActivationState(3);
                } else {
                    if (this.pawVecTarget < 0) {
                    }
                }
            }
            if (this.pawVecTarget < 0 && this.pawLocked) {
                this.pawLocked = false;
                Physics.world.removeConstraint(this.point2PointLeft);
                Physics.world.removeConstraint(this.point2PointRight);
                this.box.setActivationState(3);
            }
            // if (this.pawLocked && (!isLeftConcat || !isRightCOncat)) {
            //     this.pawLocked = false;
            //     console.log("break lock");
            // }

            if (this.leftPad) {
                // this.leftPad['setTargetLinMotorVelocity'](1);
            }
        }
    }
}

// #define ACTIVE_TAG 1
// #define ISLAND_SLEEPING 2
// #define WANTS_DEACTIVATION 3
// #define DISABLE_DEACTIVATION 4
// #define DISABLE_SIMULATION 5

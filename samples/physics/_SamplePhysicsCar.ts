import { Physics, Ammo, Rigidbody } from "@orillusion/physics";
import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, LitMaterial, Color, DirectLight, KeyEvent, MeshRenderer, CylinderGeometry, Quaternion, BoxGeometry, KeyCode, PlaneGeometry, ColliderComponent, BoxColliderShape, Vector3 } from "@orillusion/core";

export class SamplePhysicsCar {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    syncList: Function[] = [];
    actions = {};
    keysActions = {
        KeyUp: 'acceleration',
        KeyDown: 'braking',
        KeyLeft: 'left',
        KeyRight: 'right',
    };
    hoverCameraController: HoverCameraController;
    constructor() { }
    async run() {
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
        this.createCar();
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
        return true;
    }

    private createWheelObject(radius: number, width: number): Object3D {
        let wheelMat = new LitMaterial();
        wheelMat.baseMap = Engine3D.res.redTexture;
        wheelMat.normalMap = Engine3D.res.normalTexture;
        wheelMat.aoMap = Engine3D.res.whiteTexture;
        wheelMat.maskMap = Engine3D.res.whiteTexture;
        wheelMat.emissiveMap = Engine3D.res.blackTexture;
        // wheelMat.blendMode = BlendMode.NORMAL;
        wheelMat.roughness = 0.85;
        wheelMat.metallic = 0.01;
        wheelMat.envIntensity = 0.01;

        let wheel = new Object3D();
        // let leftFrontWheel = new Object3D();
        let mr = wheel.addComponent(MeshRenderer);

        mr.geometry = new CylinderGeometry(radius, radius, width, 24, 1);
        mr.material = wheelMat;
        // wheel.rotationZ = 90;
        let q = Quaternion.HELP_0;
        q.fromEulerAngles(0, 0, 90);
        wheel.transform.localRotQuat = q.clone();
        var p = new Object3D();
        p.addChild(wheel);
        this.scene.addChild(p);

        return p;
        // this.scene.addChild(wheel);

        // return wheel;
    }

    private createCar() {
        let bodyWidth = 1.8;
        let bodyHeight = 0.6;
        let bodyLength = 4;
        let bodyMass = 800;

        let wheelAxisPositionBack = -1;
        let wheelRadiusBack = 0.4;
        let wheelWidthBack = 0.3;
        let wheelHalfTrackBack = 2.2;
        let wheelAxisHeightBack = 0.3;

        let wheelAxisFrontPosition = 1.7;
        let wheelHalfTrackFront = 2.2;
        let wheelAxisHeightFront = 0.3;
        let wheelRadiusFront = 0.35;
        let wheelWidthFront = 0.2;

        let friction = 1000;
        let suspensionStiffness = 20.0;
        let suspensionDamping = 2.3;
        let suspensionCompression = 4.4;
        let suspensionRestLength = 0.6;
        let rollInfluence = 0.2;

        let steeringIncrement = 0.04;
        let steeringClamp = 0.5;
        let maxEngineForce = 2000;
        let maxBreakingForce = 100;

        let bodyObj = new Object3D();
        let bodyMat = new LitMaterial();
        bodyMat.baseMap = Engine3D.res.whiteTexture;
        bodyMat.normalMap = Engine3D.res.normalTexture;
        bodyMat.aoMap = Engine3D.res.whiteTexture;
        bodyMat.maskMap = Engine3D.res.whiteTexture;
        bodyMat.emissiveMap = Engine3D.res.blackTexture;
        // bodyMat.blendMode = BlendMode.NORMAL;
        let bodyMr = bodyObj.addComponent(MeshRenderer);

        bodyMr.geometry = new BoxGeometry();
        bodyMr.material = bodyMat;
        bodyObj.scaleX = bodyWidth;
        bodyObj.scaleY = bodyHeight;
        bodyObj.scaleZ = bodyLength;
        bodyObj.y = 10;
        var geometry = new Ammo.btBoxShape(new Ammo.btVector3(bodyWidth * 0.5, bodyHeight * 0.5, bodyLength * 0.5));
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(bodyObj.x, bodyObj.y, bodyObj.z));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
        var motionState = new Ammo.btDefaultMotionState(transform);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        geometry.calculateLocalInertia(bodyMass, localInertia);
        var bodyRb = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(bodyMass, motionState, geometry, localInertia));
        bodyRb.setActivationState(4);
        Physics.world.addRigidBody(bodyRb);

        this.scene.addChild(bodyObj);

        //raycast Vehicle
        let engineForce = 0;
        let vehicleSteering = 0;
        let breakingForce = 0;
        let tuning = new Ammo.btVehicleTuning();
        let rayCaster = new Ammo.btDefaultVehicleRaycaster(Physics.world);
        let vehicle = new Ammo.btRaycastVehicle(tuning, bodyRb, rayCaster);
        vehicle.setCoordinateSystem(0, 1, 2);
        Physics.world.addAction(vehicle);

        //create wheels

        const FRONT_LEFT = 0;
        const FRONT_RIGHT = 1;
        const BACK_LEFT = 2;
        const BACK_RIGHT = 3;

        let wheelMeshes = [];
        let wheelDirectCS0 = new Ammo.btVector3(0, -1, 0);
        let wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

        let addWheel = (isFront: boolean, pos: Ammo.btVector3, radius: number, width: number, index: number) => {
            let wheelInfo = vehicle.addWheel(pos, wheelDirectCS0, wheelAxleCS, suspensionRestLength, radius, tuning, isFront);
            wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
            wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
            wheelInfo.set_m_frictionSlip(friction);
            wheelInfo.set_m_rollInfluence(rollInfluence);
            wheelMeshes[index] = this.createWheelObject(radius, width);
        };

        addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
        addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
        addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
        addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

        let actions = this.actions;
        function sync(dt: number) {
            var speed = vehicle.getCurrentSpeedKmHour();

            breakingForce = 0;
            engineForce = 0;

            if (actions['acceleration']) {
                if (speed < -1) breakingForce = maxBreakingForce;
                else engineForce = maxEngineForce;
            }
            if (actions[`braking`]) {
                if (speed > 1) breakingForce = maxBreakingForce;
                else engineForce = -maxEngineForce / 2;
            }
            if (actions[`left`]) {
                if (vehicleSteering < steeringClamp) vehicleSteering += steeringIncrement;
            } else {
                if (actions[`right`]) {
                    if (vehicleSteering > -steeringClamp) vehicleSteering -= steeringIncrement;
                } else {
                    if (vehicleSteering < -steeringIncrement) vehicleSteering += steeringIncrement;
                    else {
                        if (vehicleSteering > steeringIncrement) vehicleSteering -= steeringIncrement;
                        else {
                            vehicleSteering = 0;
                        }
                    }
                }
            }

            vehicle.applyEngineForce(engineForce, BACK_LEFT);
            vehicle.applyEngineForce(engineForce, BACK_RIGHT);

            vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
            vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
            vehicle.setBrake(breakingForce, BACK_LEFT);
            vehicle.setBrake(breakingForce, BACK_RIGHT);

            vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
            vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);

            var tm, p, q, i;
            var n = vehicle.getNumWheels();
            for (i = 0; i < n; i++) {
                vehicle.updateWheelTransform(i, true);
                tm = vehicle.getWheelTransformWS(i);
                p = tm.getOrigin();
                q = tm.getRotation();
                let obj: Object3D = wheelMeshes[i] as Object3D;
                obj.transform.x = p.x();
                obj.transform.y = p.y();
                obj.transform.z = p.z();
                let qua = Quaternion.HELP_0;

                qua.set(q.x(), q.y(), q.z(), q.w());
                obj.transform.localRotQuat = qua;
            }

            tm = vehicle.getChassisWorldTransform();
            p = tm.getOrigin();
            let q2: Ammo.btQuaternion = tm.getRotation();
            bodyObj.x = p.x();
            bodyObj.y = p.y();
            bodyObj.z = p.z();
            let qua = Quaternion.HELP_0;
            // q.
            qua.set(q2.x(), q2.y(), q2.z(), q2.w());
            // qua.
            bodyObj.transform.localRotQuat = qua;
        }

        this.syncList.push(sync);

        let wheelMat = new LitMaterial();
        wheelMat.baseMap = Engine3D.res.whiteTexture;
        wheelMat.normalMap = Engine3D.res.normalTexture;
        wheelMat.aoMap = Engine3D.res.whiteTexture;
        wheelMat.maskMap = Engine3D.res.whiteTexture;
        wheelMat.emissiveMap = Engine3D.res.blackTexture;
        // wheelMat.blendMode = BlendMode.NORMAL;
        wheelMat.roughness = 0.85;
        wheelMat.metallic = 0.01;
        wheelMat.envIntensity = 0.01;

        //left front wheel
        // let leftFrontWheel = new Object3D();
        // let leftFrontWheelMr = leftFrontWheel.addComponent(MeshRenderer);
        // leftFrontWheelMr.castShadow = true;
        // leftFrontWheelMr.receiveShadow = true;
        // leftFrontWheelMr.geometry = new CylinderGeometry();
        // leftFrontWheelMr.material = wheelMat;
        // let q = Quaternion.HELP_0;
        // q.fromEulerAngles(90, 90, 0);
        // leftFrontWheel.transform.localRotQuat = q.clone();
        // // leftFrontWheel.rotationX = 90;
        // // leftFrontWheel.rotationY = 90;
        // leftFrontWheel.x = -carBodyW - 0.8;
        // leftFrontWheel.y = baseY - carBodyH;
        // leftFrontWheel.z = carBodyD;
        // let leftFrontcc = leftFrontWheel.addComponent(Collider);
        // let leftFrontWheelShape = new CapsuleColliderShape();
        // leftFrontcc.shape = leftFrontWheelShape;
        // leftFrontWheelShape.radius = 1;
        // leftFrontWheelShape.height = 10;
        // let leftFrontRigid = leftFrontWheel.addComponent(Rigidbody);
        // leftFrontRigid.mass = wheelMass;

        // this.scene.addChild(leftFrontWheel);
    }

    private keyUp(e: KeyEvent) {
        switch (e.keyCode) {
            case KeyCode.Key_Up:
                this.actions[this.keysActions['KeyUp']] = false;
                break;
            case KeyCode.Key_Down:
                this.actions[this.keysActions['KeyDown']] = false;
                break;
            case KeyCode.Key_Left:
                this.actions[this.keysActions['KeyLeft']] = false;
                break;
            case KeyCode.Key_Right:
                this.actions[this.keysActions['KeyRight']] = false;
                break;
        }
    }

    private keyDown(e: KeyEvent) {
        switch (e.keyCode) {
            case KeyCode.Key_Up:
                this.actions[this.keysActions['KeyUp']] = true;
                break;
            case KeyCode.Key_Down:
                this.actions[this.keysActions['KeyDown']] = true;
                break;
            case KeyCode.Key_Left:
                this.actions[this.keysActions['KeyLeft']] = true;
                break;
            case KeyCode.Key_Right:
                this.actions[this.keysActions['KeyRight']] = true;
                break;
        }
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

        mr.geometry = new PlaneGeometry(500, 500, 1, 1);
        mr.material = floorMat;
        let collider = obj.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(500, 0.5, 1000);
        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.mass = 0;
        this.scene.addChild(obj);
    }

    loop() {
        if (Physics.isInited) {
            Physics.update();
            for (let i = 0; i < this.syncList.length; i++) {
                this.syncList[i](16);
            }
        }
    }
}

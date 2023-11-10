import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, Object3D, Engine3D, ColliderComponent, BoxColliderShape, Vector3, ComponentBase, KeyCode, KeyEvent, Quaternion, BoundUtil, Camera3D, Vector3Ex, MeshRenderer, LitMaterial, Color, BoxGeometry } from "@orillusion/core";

class Sample_PhysicsCar {
    private scene: Scene3D;
    private car: Object3D;
    private boxes: Object3D[];
    private road: Object3D;
    private camera: Camera3D;
    private controller: fixedCameraController

    public score = { Score: 0 }
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 150;

        await Physics.init();
        await Engine3D.init({ renderLoop: () => this.loop() });

        let sceneParam = createSceneParam();
        let exampleScene = createExampleScene(sceneParam);
        this.camera = exampleScene.camera;
        this.scene = exampleScene.scene;
        await this.initScene(this.scene);

        Engine3D.startRenderView(exampleScene.view);
        
        GUIHelp.init();
        GUIHelp.open();
        GUIHelp.add(this.controller, 'enable').name('Fix Camera');
        GUIHelp.add(this.score, 'Score').listen();
        GUIHelp.addButton('Reset', () => {
            location.reload()
        })
    }

    async initScene(scene: Scene3D) {
        // load a car model
        {
            this.car = await Engine3D.res.loadGltf(
                "https://cdn.orillusion.com/gltfs/glb/vevhicle.glb"
            );
            this.car.y = 2
            let collider = this.car.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = BoundUtil.genMeshBounds(this.car).size.clone();
            scene.addChild(this.car);
            // add keyboard controller to the car
            this.car.addComponent(VehicleKeyboardController);
            // fix the camera to the car
            this.controller = this.camera.object3D.addComponent(
                fixedCameraController
            );
            this.controller.target = this.car;
            this.controller.distance = 50;
        }
        // add a plane as road
        {
            this.road = new Object3D();
            let mr = this.road.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(200, 0.1, 40);
            let mat = (mr.material = new LitMaterial());
            mat.roughness = 1;
            mat.metallic = 0;
            mat.baseMap = await Engine3D.res.loadTexture("data:image/webp;base64,UklGRqAAAABXRUJQVlA4TJMAAAAvV8INER8gEEhxXGstIEmxu7qVgCTF7upWAgFCiv8qJwJXoF8wimQrDiiLCnCG0KzXL4DlRKoj+j8BtSxpW5XY2teypI3/+I//+I//+I//+I//+I//+I//+I//+I//+G8vkFO/Yzuj24P/flBy6nds0+Q//uM//uM//uM//uM//uM//uM//uM//uM//gOwL9Z0FwUA");
            let collider = this.road.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = BoundUtil.genMeshBounds(
                this.road
            ).size.clone();
            console.log(collider.shape.size)
            this.road.rotationY = -90;
            let rigidbody = this.road.addComponent(Rigidbody);
            rigidbody.mass = 0;
            scene.addChild(this.road);
        }
        // add boxes
        {
            let geometry = new BoxGeometry(1,1,1)
            let mat = new LitMaterial();
            mat.baseColor = Color.random()
            this.boxes = [];
            for (let i = 0; i < 20; i++) {
                this.boxes[i] = new Object3D()
                let mr = this.boxes[i].addComponent(MeshRenderer)
                mr.geometry = geometry;
                mr.material = mat;
                this.boxes[i].x = Math.random() * 30 - 15;
                this.boxes[i].y = Math.random() * 2;
                this.boxes[i].z = Math.random() * 200 - 100;
                let rigidbody = this.boxes[i].addComponent(Rigidbody);
                rigidbody.mass = 1;
                let collider = this.boxes[i].addComponent(ColliderComponent);
                collider.shape = new BoxColliderShape();
                collider.shape.size = BoundUtil.genMeshBounds(
                    this.boxes[i]
                ).size.clone();
                scene.addChild(this.boxes[i]);
            }
        }
    }

    private loop() {
        Physics.update();
        this.boxes.map((box, index) => {
            if (box.y < -5) {
                this.score.Score++;
                this.scene.removeChild(box);
                this.boxes.splice(index, 1);
            }
        });
    }
}

enum VehicleControlType {
    acceleration,
    braking,
    left,
    right,
}
/**
 * Keyboard controller for the car
 */
class VehicleKeyboardController extends ComponentBase {
    protected mBody: Object3D;
    protected mWheels: Object3D[];
    protected mEngineForce = 0;
    protected mBreakingForce = 0;
    protected mVehicleSteering = 0;
    protected mAmmoVehicle;
    protected mVehicleArgs = {
        bodyMass: 800,
        friction: 1000,
        suspensionStiffness: 20.0,
        suspensionDamping: 2.3,
        suspensionCompression: 4.4,
        suspensionRestLength: 0.6,
        rollInfluence: 0.2,
        steeringIncrement: 0.04,
        steeringClamp: 0.5,
        maxEngineForce: 1500,
        maxBreakingForce: 500
    }
    protected mVehicleControlState = [false, false, false, false];
    async start() {
        this.mBody = this.object3D;
        let w1 = this.object3D.getChildByName("wheel_1");
        let w2 = this.object3D.getChildByName("wheel_2");
        let w3 = this.object3D.getChildByName("wheel_3");
        let w4 = this.object3D.getChildByName("wheel_4");
        this.mWheels = [w1, w2, w3, w4];
        this.initController();
    }
    initController() {
        let bound = BoundUtil.genMeshBounds(this.mBody);
        this.mBody.entityChildren[0].transform.y = -bound.size.y / 2 - 0.05;
        let geometry = new Ammo.btBoxShape(
            new Ammo.btVector3(
                bound.size.x / 2,
                bound.size.y / 2,
                bound.size.z / 2
            )
        );
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(
            new Ammo.btVector3(
                this.mBody.transform.worldPosition.z,
                this.mBody.transform.worldPosition.y,
                this.mBody.transform.worldPosition.z
            )
        );
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
        let motionState = new Ammo.btDefaultMotionState(transform);
        let localInertia = new Ammo.btVector3(0, 0, 0);
        geometry.calculateLocalInertia(
            this.mVehicleArgs.bodyMass,
            localInertia
        );
        let bodyRb = new Ammo.btRigidBody(
            new Ammo.btRigidBodyConstructionInfo(
                this.mVehicleArgs.bodyMass,
                motionState,
                geometry,
                localInertia
            )
        );
        bodyRb.setActivationState(4);
        Physics.world.addRigidBody(bodyRb);
        //raycast Vehicle
        let tuning = new Ammo.btVehicleTuning();
        let rayCaster = new Ammo.btDefaultVehicleRaycaster(Physics.world);
        let vehicle = new Ammo.btRaycastVehicle(tuning, bodyRb, rayCaster);
        vehicle.setCoordinateSystem(0, 1, 2);
        this.mAmmoVehicle = vehicle;
        Physics.world.addAction(vehicle);
        let wheelDirectCS0 = new Ammo.btVector3(0, -1, 0);
        let wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
        let addWheel = (isFront:boolean, x:number, y:number, z:number, radius:number) => {
            let pos = new Ammo.btVector3(x, y, z);
            let wheelInfo = vehicle.addWheel(
                pos,
                wheelDirectCS0,
                wheelAxleCS,
                this.mVehicleArgs.suspensionRestLength,
                radius,
                tuning,
                isFront
            );
            wheelInfo.set_m_suspensionStiffness(this.mVehicleArgs.suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(this.mVehicleArgs.suspensionDamping);
            wheelInfo.set_m_wheelsDampingCompression(this.mVehicleArgs.suspensionCompression);
            wheelInfo.set_m_frictionSlip(this.mVehicleArgs.friction);
            wheelInfo.set_m_rollInfluence(this.mVehicleArgs.rollInfluence);
        };

        const r = BoundUtil.genMeshBounds(this.mWheels[0]).size.y / 2;
        const x =this.mWheels[0].transform.worldPosition.x - this.mBody.transform.worldPosition.x;
        const y = BoundUtil.genMeshBounds(this.mWheels[0]).size.y - r + 0.1;
        const z = this.mWheels[0].transform.worldPosition.z - this.mBody.transform.worldPosition.z;
        addWheel(true, -x, -y, z, r);
        addWheel(true, x, -y, z, r);
        addWheel(false, -x, -y, -z, r);
        addWheel(false, x, -y, -z, r);
    }
    onEnable() {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);
    }
    onDisable() {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.onKeyUp, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.onKeyDown, this);
    }
    onUpdate() {
        if (!this.mAmmoVehicle) return;
        const vehicle = this.mAmmoVehicle;
        const speed = vehicle.getCurrentSpeedKmHour();
        this.mBreakingForce = 0;
        this.mEngineForce = 0;
        if (this.mVehicleControlState[VehicleControlType.acceleration]) {
            if (speed < -1)
                this.mBreakingForce = Math.min(this.mVehicleArgs.maxEngineForce / 3, 1000);
            else this.mEngineForce = this.mVehicleArgs.maxEngineForce;
        }
        if (this.mVehicleControlState[VehicleControlType.braking]) {
            if (speed > 1)
                this.mBreakingForce = Math.min(this.mVehicleArgs.maxEngineForce / 3, 1000);
            else this.mEngineForce = -this.mVehicleArgs.maxEngineForce / 2;
        }
        if (this.mVehicleControlState[VehicleControlType.left]) {
            if (this.mVehicleSteering < this.mVehicleArgs.steeringClamp)
                this.mVehicleSteering += this.mVehicleArgs.steeringIncrement;
        } else if (this.mVehicleControlState[VehicleControlType.right]) {
            if (this.mVehicleSteering > -this.mVehicleArgs.steeringClamp)
                this.mVehicleSteering -= this.mVehicleArgs.steeringIncrement;
        } else {
            if (this.mVehicleSteering < -this.mVehicleArgs.steeringIncrement) {
                this.mVehicleSteering += this.mVehicleArgs.steeringIncrement;
            } else {
                if (this.mVehicleSteering > this.mVehicleArgs.steeringIncrement)
                    this.mVehicleSteering -=
                        this.mVehicleArgs.steeringIncrement;
                else this.mVehicleSteering = 0;
            }
        }
        const FRONT_LEFT = 0;
        const FRONT_RIGHT = 1;
        const BACK_LEFT = 2;
        const BACK_RIGHT = 3;
        vehicle.applyEngineForce(this.mEngineForce, BACK_LEFT);
        vehicle.applyEngineForce(this.mEngineForce, BACK_RIGHT);
        vehicle.setBrake(this.mBreakingForce / 2, FRONT_LEFT);
        vehicle.setBrake(this.mBreakingForce / 2, FRONT_RIGHT);
        vehicle.setBrake(this.mBreakingForce, BACK_LEFT);
        vehicle.setBrake(this.mBreakingForce, BACK_RIGHT);
        vehicle.setSteeringValue(this.mVehicleSteering, FRONT_LEFT);
        vehicle.setSteeringValue(this.mVehicleSteering, FRONT_RIGHT);

        // update wheel rotation
        const n = vehicle.getNumWheels();
        const angle = 40;
        for (let i = 0; i < n; i++) {
            let wheel = this.mWheels[i]
            wheel.rotationX += speed;
            if (i < 2) {
                let offset = wheel.rotationZ;
                this.mVehicleSteering === 0
                    ? (wheel.rotationZ-= offset / 5)
                    : (wheel.rotationZ = offset - this.mVehicleSteering * 10);
                if (wheel.rotationZ < -angle)
                    wheel.rotationZ = -angle;
                else if (wheel.rotationZ > angle)
                    wheel.rotationZ = angle;
            }
        }
        // update body position
        let tm, p, q, qua = Quaternion.HELP_0;
        tm = vehicle.getChassisWorldTransform();
        p = tm.getOrigin();
        this.mBody.x = p.x()
        this.mBody.y = p.y()
        this.mBody.z = p.z()
        q = tm.getRotation();
        qua.set(q.x(), q.y(), q.z(), q.w());
        this.mBody.transform.localRotQuat = qua;
    }
    onKeyUp(e:KeyEvent) {
        this.updateControlState(e.keyCode, false);
    }
    onKeyDown(e:KeyEvent) {
        this.updateControlState(e.keyCode, true);
    }
    updateControlState(keyCode:number, state:boolean) {
        switch (keyCode) {
            case KeyCode.Key_W:
                this.mVehicleControlState[VehicleControlType.acceleration] =
                    state;
                break;
            case KeyCode.Key_Up:
                this.mVehicleControlState[VehicleControlType.acceleration] =
                    state;
                break;
            case KeyCode.Key_S:
                this.mVehicleControlState[VehicleControlType.braking] = state;
                break;
            case KeyCode.Key_Down:
                this.mVehicleControlState[VehicleControlType.braking] = state;
                break;
            case KeyCode.Key_A:
                this.mVehicleControlState[VehicleControlType.left] = state;
                break;
            case KeyCode.Key_Left:
                this.mVehicleControlState[VehicleControlType.left] = state;
                break;
            case KeyCode.Key_D:
                this.mVehicleControlState[VehicleControlType.right] = state;
                break;
            case KeyCode.Key_Right:
                this.mVehicleControlState[VehicleControlType.right] = state;
                break;
        }
    }
}

/**
 * Fix camera to a target
 */
class fixedCameraController extends ComponentBase {
    private camera: Camera3D;
    public distance = 50; // distance to target
    public pitch = 30; // camera pitch angle
    private _tempDir: Vector3;
    private _tempPos: Vector3;
    private _target: Object3D;
    start() {
        this._tempDir = new Vector3();
        this._tempPos = new Vector3();
        this.camera = this.object3D.getComponent(Camera3D);
    }
    get target() {
        return this._target;
    }
    set target(obj) {
        this._target = obj;
    }
    onUpdate() {
        if (!this._target) return;
        this._tempDir.set(0, 0, -1);
        const q = Quaternion.HELP_0;
        q.fromEulerAngles(this.pitch, 0, 0.0);
        this._tempDir.applyQuaternion(q);
        this._tempDir = this._target.transform.worldMatrix.transformVector(
            this._tempDir,
            this._tempDir
        );
        this._tempDir.normalize();
        let position = this._target.transform.worldPosition;
        this._tempPos = Vector3Ex.mulScale(
            this._tempDir,
            this.distance,
            this._tempPos
        );
        this._tempPos = position.add(this._tempPos, this._tempPos);
        this.camera.lookAt(this._tempPos, this._target.transform.worldPosition);
    }
}
new Sample_PhysicsCar().run();

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, Object3D, LitMaterial, Engine3D, BoxGeometry, MeshRenderer, ColliderComponent, BoxColliderShape, Vector3, PlaneGeometry, Color, ComponentBase, KeyCode, KeyEvent, Quaternion, CylinderGeometry, BoundUtil, Camera3D, Vector3Ex, HoverCameraController } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_PhysicsCar {
    private scene: Scene3D;
    private materials: LitMaterial[];
    private boxGeometry: BoxGeometry;
    private score: number;
    private car: Object3D;
    private boxes: Array<Object3D>;
    private road: Object3D;
    private camera: Camera3D;
    hoverCtrl: HoverCameraController;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 150;

        await Physics.init();
        await Engine3D.init({ renderLoop: () => this.loop() });

        let sceneParam = createSceneParam();
        sceneParam.camera.distance = 50;
        let exampleScene = createExampleScene(sceneParam);
        this.camera = exampleScene.camera
        this.hoverCtrl = exampleScene.hoverCtrl

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        this.scene = exampleScene.scene;
        await this.initScene(this.scene);

        Engine3D.startRenderView(exampleScene.view);
    }

    async initScene(scene: Scene3D) {
        const updateMaterial = (node) => {
            let mr = node.getComponent(MeshRenderer);
            if (mr) {
                let materials = mr.materials;
                for (let i = 0; i < materials.length; ++i) {
                    let material = materials[i];
                    if (material.metallic > 0.2) {
                        material.metallic = 0.1;
                        material.roughness = 0.45;
                    }
                }
            }
        }
        this.score = 0;
        this.car = await Engine3D.res.loadGltf('https://cdn.orillusion.com/gltfs/glb/vevhicle.glb');
        let collider = this.car.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape()
        collider.shape.size = BoundUtil.genMeshBounds(this.car).size.clone()
        this.car.x = 0;
        this.car.y = 1;
        this.car.z = 0;
        this.road = await Engine3D.res.loadGltf('https://cdn.orillusion.com/gltfs/glb/road.glb');
        collider = this.road.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape()
        collider.shape.size = BoundUtil.genMeshBounds(this.road).size.clone()
        this.road.rotationX = -90;
        let rigidbody = this.road.addComponent(Rigidbody);
        rigidbody.mass = 0;
        this.boxes = [];
        for (let i = 0; i < 20; i++) {
            this.boxes[i] = (await Engine3D.res.loadGltf('https://cdn.orillusion.com/gltfs/glb/obstacle.glb')).clone();
            this.boxes[i].x = Math.random() * 30 - 15;
            this.boxes[i].y = Math.random() * 2;
            this.boxes[i].z = Math.random() * 200 - 100;
            rigidbody = this.boxes[i].addComponent(Rigidbody);
            rigidbody.mass = 1;
            let collider = this.boxes[i].addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape()
            collider.shape.size = BoundUtil.genMeshBounds(this.boxes[i]).size.clone()
            updateMaterial(this.boxes[i])
            scene.addChild(this.boxes[i])
        }
        updateMaterial(this.car)
        updateMaterial(this.road)
        scene.addChild(this.road);
        scene.addChild(this.car);
        let VehicleControlType;
        (function (VehicleControlType) {
        VehicleControlType[VehicleControlType["acceleration"] = 0] = "acceleration";
        VehicleControlType[VehicleControlType["braking"] = 1] = "braking";
        VehicleControlType[VehicleControlType["left"] = 2] = "left";
        VehicleControlType[VehicleControlType["right"] = 3] = "right";
        })(VehicleControlType || (VehicleControlType = {}));
        class VehicleArgs {
            bodyMass = 800;
            friction = 1000;
            suspensionStiffness = 20.0;
            suspensionDamping = 2.3;
            suspensionCompression = 4.4;
            suspensionRestLength = 0.6;
            rollInfluence = 0.2;
            steeringIncrement = 0.04;
            steeringClamp = 0.5;
            maxEngineForce = 1500;
            maxBreakingForce = 500;
        }
        class VehicleKeyboardController extends ComponentBase {
            mBody;
            mWheels;
            mEngineForce = 0;
            mBreakingForce = 0;
            mVehicleSteering = 0;
            mAmmoVehicle;
            mVehicleArgs = new VehicleArgs();
            mVehicleControlState = [
                false,
                false,
                false,
                false,
            ];
            async start() {
                this.mVehicleArgs = new VehicleArgs();
                this.mBody = this.object3D;
                await new Promise((res) => {
                    let timer = setInterval(()=>{
                        if (this.checkModel()) {
                            res(true)
                            clearInterval(timer)
                        } else {
                            console.log('wait for model ready')
                        }
                    }, 100)
                })
                let w1 = this.object3D.getChildByName("wheel_1");
                let w2 = this.object3D.getChildByName("wheel_2");
                let w3 = this.object3D.getChildByName("wheel_3");
                let w4 = this.object3D.getChildByName("wheel_4");
                this.mWheels = [w1, w2, w3, w4];
                this.initController();
            }
            checkModel() {
                return this.object3D.getChildByName("wheel_1") !== null
            }
            initController() {
                let bound = BoundUtil.genMeshBounds(this.mBody);
                this.mBody.entityChildren[0].transform.y = -bound.size.y / 2 - 0.05;
                let geometry = new Ammo.btBoxShape(new Ammo.btVector3(bound.size.x / 2, bound.size.y / 2, bound.size.z / 2));
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(this.mBody.transform.worldPosition.z, this.mBody.transform.worldPosition.y, this.mBody.transform.worldPosition.z));
                transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
                let motionState = new Ammo.btDefaultMotionState(transform);
                let localInertia = new Ammo.btVector3(0, 0, 0);
                geometry.calculateLocalInertia(this.mVehicleArgs.bodyMass, localInertia);
                let bodyRb = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(this.mVehicleArgs.bodyMass, motionState, geometry, localInertia));
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
                let addWheel = (isFront, x, y, z, radius) => {
                    let pos = new Ammo.btVector3(x, y, z);
                    let wheelInfo = vehicle.addWheel(pos, wheelDirectCS0, wheelAxleCS, this.mVehicleArgs.suspensionRestLength, radius, tuning, isFront);
                    wheelInfo.set_m_suspensionStiffness(this.mVehicleArgs.suspensionStiffness);
                    wheelInfo.set_m_wheelsDampingRelaxation(this.mVehicleArgs.suspensionDamping);
                    wheelInfo.set_m_wheelsDampingCompression(this.mVehicleArgs.suspensionCompression);
                    wheelInfo.set_m_frictionSlip(this.mVehicleArgs.friction);
                    wheelInfo.set_m_rollInfluence(this.mVehicleArgs.rollInfluence);
                };
            
                const r = BoundUtil.genMeshBounds(this.mWheels[0]).size.y / 2
                const x = this.mWheels[0].transform.worldPosition.x -
                this.mBody.transform.worldPosition.x
                const y = BoundUtil.genMeshBounds(this.mWheels[0]).size.y - r + 0.1
                const z = this.mWheels[0].transform.worldPosition.z -
                this.mBody.transform.worldPosition.z
                console.log(x,y,z,r) // 1.6806783378124237 0.4682487627174974 1.101665198802948 0.36824876271749735
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
                if(!this.mAmmoVehicle)
                return 
                const vehicle = this.mAmmoVehicle;
                const speed = vehicle.getCurrentSpeedKmHour();
                this.mBreakingForce = 0;
                this.mEngineForce = 0;
                if (this.mVehicleControlState[VehicleControlType.acceleration]) {
                    if (speed < -1)
                        this.mBreakingForce = Math.min(this.mVehicleArgs.maxEngineForce/3, 1000);
                    else
                        this.mEngineForce = this.mVehicleArgs.maxEngineForce;
                }
                if (this.mVehicleControlState[VehicleControlType.braking]) {
                if (speed > 1)
                    this.mBreakingForce = Math.min(this.mVehicleArgs.maxEngineForce/3, 1000);
                else
                    this.mEngineForce = -this.mVehicleArgs.maxEngineForce / 2;
                }
                if (this.mVehicleControlState[VehicleControlType.left]) {
                if (this.mVehicleSteering < this.mVehicleArgs.steeringClamp)
                    this.mVehicleSteering +=
                    this.mVehicleArgs.steeringIncrement;
                }
                else if (this.mVehicleControlState[VehicleControlType.right]) {
                if (this.mVehicleSteering > -this.mVehicleArgs.steeringClamp)
                    this.mVehicleSteering -=
                    this.mVehicleArgs.steeringIncrement;
                }
                else {
                    if (this.mVehicleSteering < -this.mVehicleArgs.steeringIncrement) {
                        this.mVehicleSteering +=
                        this.mVehicleArgs.steeringIncrement;
                    }
                    else {
                        if (this.mVehicleSteering >
                            this.mVehicleArgs.steeringIncrement)
                            this.mVehicleSteering -=
                            this.mVehicleArgs.steeringIncrement;
                        else
                            this.mVehicleSteering = 0;
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
                const n = vehicle.getNumWheels();
                const angle = 40;
                var tm, p, q;

                for (let i = 0; i < n; i++) {
                    vehicle.updateWheelTransform(i, true);
                    tm = vehicle.getWheelTransformWS(i);
                    p = tm.getOrigin();
                    q = tm.getRotation();
                    let obj = this.mWheels[i];
                    obj.transform.x = p.x();
                    obj.transform.y = p.y();
                    obj.transform.z = p.z();
                    let qua = Quaternion.HELP_0;

                    qua.set(q.x(), q.y(), q.z(), q.w());
                    obj.transform.localRotQuat = qua;
                }

                tm = vehicle.getChassisWorldTransform();
                p = tm.getOrigin();
                let q2 = tm.getRotation();
                this.mBody.x = p.x();
                this.mBody.y = p.y();
                this.mBody.z = p.z();
                let qua = Quaternion.HELP_0;
                // q.
                qua.set(q2.x(), q2.y(), q2.z(), q2.w());
                // qua.
                this.mBody.transform.localRotQuat = qua;
            }
            onKeyUp(e) {
                this.updateControlState(e.keyCode, false);
            }
            onKeyDown(e) {
                this.updateControlState(e.keyCode, true);
            }
            updateControlState(keyCode, state) {
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
                        this.mVehicleControlState[VehicleControlType.braking] =
                    state;
                    break;
                    case KeyCode.Key_Down:
                        this.mVehicleControlState[VehicleControlType.braking] =
                    state;
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
        this.car.addComponent(VehicleKeyboardController);

        class fixedCameraController extends ComponentBase {
            distance = 12;
            pitch = 30;
            private _tempDir: Vector3;
            private _tempPos: Vector3;
            camera: any;
            private _target: any;
            start() {
                this._tempDir = new Vector3()
                this._tempPos = new Vector3()
                this.camera = this.object3D.getComponent(Camera3D)
            }
            setTarget(obj){
                this._target = obj
            }
            onUpdate() {
                if(!this._target)
                return
                this._tempDir.set(0, 0, -1);
                const q = Quaternion.HELP_0;
                q.fromEulerAngles(this.pitch, 0, 0.0);
                this._tempDir.applyQuaternion(q);
                this._tempDir = this._target.transform.worldMatrix.transformVector(this._tempDir, this._tempDir);
                this._tempDir.normalize();
                let position = this._target.transform.worldPosition;
                this._tempPos = Vector3Ex.mulScale(this._tempDir, this.distance, this._tempPos);
                this._tempPos = position.add(this._tempPos, this._tempPos);
                this.camera.lookAt(this._tempPos, this._target.transform.worldPosition);
            }
        }
        this.camera.object3D.addComponent(fixedCameraController);
        this.hoverCtrl.roll = 180

        let span = document.createElement('span');
        span.style.position = 'fixed';
        span.style.zIndex = '9999';
        span.style.fontSize = '30px';
        span.style.color = 'white';
        span.style.padding = '20px';
        span.style.top = '0';
        span.style.right = '0';
        span.innerHTML = '0';
        span.id = 'score'
        document.querySelector('body').appendChild(span);
    }

    private loop() {
        Physics.update();
        this.boxes.map((box, index) => {
            if (box.y < 0) {
                this.score++
                this.scene.removeChild(box)
                this.boxes.splice(index, 1)
                document.querySelector('#score').innerHTML = `${this.score}`
            }
        });
        this.hoverCtrl.target = this.car.localPosition;
    }
}
new Sample_PhysicsCar().run();
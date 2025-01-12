import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, Vector3, AtmosphericComponent, ColliderComponent, BoxColliderShape, KeyEvent, SphereColliderShape, DirectLight, SphereGeometry, ComponentBase, KeyCode, KelvinUtil, Time } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Ammo, Physics, Rigidbody } from "@orillusion/physics";
import dat from "dat.gui";

class Sample_EatTheBox {
    view: View3D;
    ammoWorld: Ammo.btDiscreteDynamicsWorld;
    foods: Object3D[] = [];
    dispatcher: Ammo.btDispatcher;
    numManifolds: number;
    Manifold: Ammo.btPersistentManifold;
    objIndex: number;
    tempObj: Object3D;
    score: number = 0;
    moveScript: MoveScript;
    async run() {
        //init physics and engine
        await Physics.init();
        await Engine3D.init({
            renderLoop: () => this.loop()
        });

        //set shadow
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.01;
        //get original ammo world for processing more custom function
        this.ammoWorld = Physics.world;

        //create scene,add sky and FPS
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        // camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.lookAt(new Vector3(0, 40, 35), new Vector3());
        scene.addChild(cameraObj);

        //add DirectLight
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 8;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 80;
        sky.relativeTransform = light.transform;
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        scene.addChild(lightObj);

        //create view
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;

        //create floor and wall
        this.createFloor();
        //create foods(box)
        this.createFoods();
        //create player(ball)
        this.createBall();
        //start render
        Engine3D.startRenderView(this.view);

        //add debug UI
        const gui = new dat.GUI();
        let tip = gui.addFolder("Orillusion");
        tip.add({ tip1: "press wasd to move" }, "tip1");
        tip.add({ tip2: "eat box to get score" }, "tip2");
        tip.add(this, "score").listen();
        tip.add(this.moveScript, "moveSpeed", 10, 50, 1);
        tip.open();
    }
    private createFloor() {
        //create floor and wall
        let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.6);
        let border1 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        let border2 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        let border3 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        let border4 = Object3DUtil.GetSingleCube(50, 5, 1, 0.3, 0.3, 0.6);
        //set their mass to 0,because they are static
        let rigidbody = floor.addComponent(Rigidbody);
        let rigidbody1 = border1.addComponent(Rigidbody);
        let rigidbody2 = border2.addComponent(Rigidbody);
        let rigidbody3 = border3.addComponent(Rigidbody);
        let rigidbody4 = border4.addComponent(Rigidbody);
        rigidbody.mass = rigidbody1.mass = rigidbody2.mass = rigidbody3.mass = rigidbody4.mass = 0;
        //add collider component ,collider shape and size is same as their geometry
        let collider = floor.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(50, 1, 50);
        let colshape = new BoxColliderShape();
        colshape.size = new Vector3(50, 5, 1);
        let collider1 = border1.addComponent(ColliderComponent);
        let collider2 = border2.addComponent(ColliderComponent);
        let collider3 = border3.addComponent(ColliderComponent);
        let collider4 = border4.addComponent(ColliderComponent);
        collider1.shape = collider2.shape = collider3.shape = collider4.shape = colshape;
        //place the floor and walls
        border1.y = 3;
        border1.z = 24.5;
        border2.y = 3;
        border2.z = -24.5;
        border3.y = 3;
        border3.x = 24.5;
        border3.rotationY = 90;
        border4.y = 3;
        border4.x = -24.5;
        border4.rotationY = 90;
        //set friction and restitution
        rigidbody.rollingFriction = 10;
        rigidbody1.restitution = rigidbody2.restitution = rigidbody3.restitution = rigidbody4.restitution = 0.3;
        //set their index to -1
        rigidbody.wait().then(btRigidbody => btRigidbody.setUserIndex(-1));
        rigidbody1.wait().then(btRigidbody => btRigidbody.setUserIndex(-1));
        rigidbody2.wait().then(btRigidbody => btRigidbody.setUserIndex(-1));
        rigidbody3.wait().then(btRigidbody => btRigidbody.setUserIndex(-1));
        rigidbody4.wait().then(btRigidbody => btRigidbody.setUserIndex(-1));

        this.view.scene.addChild(floor);
        this.view.scene.addChild(border1);
        this.view.scene.addChild(border2);
        this.view.scene.addChild(border3);
        this.view.scene.addChild(border4);
    }
    private createFoods() {
        //create the sample food
        let boxobj = new Object3D();
        let mr = boxobj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(2, 2, 2);
        mr.material = new LitMaterial();
        let boxColliderShape = new BoxColliderShape();
        boxColliderShape.size = new Vector3(2, 2, 2);
        //create 10 food box
        for (let index = 0; index < 10; index++) {
            let boxObj = boxobj.clone();
            boxObj.y = 2;
            //random position
            boxObj.x = Math.random() * 40 - 20;
            boxObj.z = Math.random() * 40 - 20;
            let rig = boxObj.addComponent(Rigidbody);
            rig.mass = 0;
            let col = boxObj.addComponent(ColliderComponent);
            col.shape = boxColliderShape;
            rig.wait().then(btRigidbody => {
                //set this colider as trigger,trigger will not respond to collision
                btRigidbody.setCollisionFlags(4);
                //set index to 0~9
                btRigidbody.setUserIndex(index);
                this.foods[index] = boxObj;
            });
            boxObj.addComponent(RotateScript);
            this.view.scene.addChild(boxObj);
        }
    }
    private createBall() {
        //add player(ball)
        let sphereObj = new Object3D();
        let mr = sphereObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        let mat = new LitMaterial();
        mr.material = mat;
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        sphereObj.y = 5;
        //add movescript
        this.moveScript = sphereObj.addComponent(MoveScript);
        this.moveScript.rigidbody = sphereObj.addComponent(Rigidbody);
        this.moveScript.rigidbody.wait().then(btRigidbody => btRigidbody.setUserIndex(-1));
        this.moveScript.rigidbody.mass = 10;
        let collider = sphereObj.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(1);
        this.view.scene.addChild(sphereObj);
    }
    private loop() {
        if (Physics.isInited) {
            //get ammo world collision info
            this.dispatcher = this.ammoWorld.getDispatcher();
            //get count of collision info
            this.numManifolds = this.dispatcher.getNumManifolds();
            if (this.numManifolds > 0) {
                //iterate all collision info
                for (let index = 0; index < this.numManifolds; index++) {
                    this.Manifold = this.dispatcher.getManifoldByIndexInternal(index);
                    //detect ammo rigidbody's userindex,if greater than -1,the box(food) is colliding
                    if (this.Manifold.getBody0().getUserIndex() > -1 || this.Manifold.getBody1().getUserIndex() > -1) {
                        this.objIndex = Math.max(this.Manifold.getBody0().getUserIndex(), this.Manifold.getBody1().getUserIndex());
                        //destroy this box
                        this.tempObj = this.foods[this.objIndex];
                        if (this.tempObj) {
                            this.foods[this.objIndex] = undefined;
                            this.score++;
                            this.tempObj.destroy();
                        }
                    }
                }
            }
            Physics.update();
        }
    }
}

class MoveScript extends ComponentBase {
    forward: boolean = false;
    back: boolean = false;
    left: boolean = false;
    right: boolean = false;
    moveSpeed: number = 30;
    rigidbody: Rigidbody;
    x: number = 0;
    y: number = 0;
    direction: Vector3 = new Vector3();
    init(): void {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
    }
    private keyDown(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = true;
        } else if (e.keyCode == KeyCode.Key_D) {
            this.right = true;
        } else if (e.keyCode == KeyCode.Key_W) {
            this.forward = true;
        } else if (e.keyCode == KeyCode.Key_S) {
            this.back = true;
        }
    }
    private keyUp(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = false;
        } else if (e.keyCode == KeyCode.Key_D) {
            this.right = false;
        } else if (e.keyCode == KeyCode.Key_W) {
            this.forward = false;
        } else if (e.keyCode == KeyCode.Key_S) {
            this.back = false;
        }
    }

    onUpdate() {
        //if w or a or s or d was pressed
        if (this.forward || this.back || this.left || this.right) {
            //activate ammo btrigidbody if its state is inactive
            if (!this.rigidbody.btRigidbody.isActive()) {
                this.rigidbody.btRigidbody.activate();
            }
            //force the ball to move
            this.x = -1 * Number(this.left) + Number(this.right);
            this.y = -1 * Number(this.forward) + Number(this.back);
            this.direction.set(this.x * this.moveSpeed * Time.delta, 0, this.y * this.moveSpeed * Time.delta);
            this.rigidbody.velocity = this.direction;
        }
    }
}
//rotate script
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += (90 * Time.delta) / 1000;
    }
}

new Sample_EatTheBox().run();

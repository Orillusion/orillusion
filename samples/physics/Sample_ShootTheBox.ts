import dat from "dat.gui";
import { BoxGeometry, Camera3D, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, Vector3, AtmosphericComponent, HoverCameraController, ColliderComponent, BoxColliderShape, KeyEvent, SphereColliderShape, DirectLight, SphereGeometry, ComponentBase, KeyCode, KelvinUtil, Time } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Physics, Rigidbody } from "@orillusion/physics";

class Sample_ShootTheBox {
    aim: Object3D;
    moveScript: MoveScript;
    view: View3D;
    ballSpeed: Vector3 = new Vector3(0, 0, -30000);
    async run() {
        //init Physics System 
        await Physics.init();
        await Engine3D.init({
            //make Physics System continuously effective
            renderLoop: () => {
                if (Physics.isInited) {
                    Physics.update();
                }
            }
        });
        //update shadow every frame
        Engine3D.setting.shadow.updateFrameRate = 1;

        //add keydown event listener
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);

        //create scene,add sky and FPS
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        let con = cameraObj.addComponent(HoverCameraController);
        con.setCamera(0, -30, 50);
        scene.addChild(cameraObj);

        //add DirectLight
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 50;
        light.castShadow = true;
        lightObj.rotationX = 60;
        lightObj.rotationY = 140;
        sky.relativeTransform = light.transform;
        scene.addChild(lightObj);

        //add a floor
        {
            let floor = Object3DUtil.GetSingleCube(50, 1, 50, 0.3, 0.3, 0.3);
            floor.y = -0.5;
            let rigidBody = floor.addComponent(Rigidbody);
            //set static object mass(0)
            rigidBody.mass = 0;
            let collider = floor.addComponent(ColliderComponent);
            collider.shape = new BoxColliderShape();
            collider.shape.size = new Vector3(50, 1, 50);
            scene.addChild(floor);
        }
        let mats = [new LitMaterial(), new LitMaterial(), new LitMaterial(), new LitMaterial(), new LitMaterial()];
        {
            let box = new Object3D();
            let mr = box.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(2, 2, 2);
            mats.forEach(element => {
                element.baseColor = Color.random();
            });
            //add 100 box with different color
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    let b = box.clone();
                    b.x = 2 * i - 9;
                    b.y = 2 * j + 1;
                    b.z = -10;
                    b.getComponent(MeshRenderer).material = mats[Math.floor(Math.random() * 5)];
                    let rig = b.addComponent(Rigidbody);
                    rig.mass = 10;
                    let col = b.addComponent(ColliderComponent);
                    col.shape = new BoxColliderShape();
                    col.shape.size = new Vector3(2, 2, 2);
                    scene.addChild(b);
                }
            }
        }

        //add the aiming point
        {
            this.aim = new Object3D();
            let aim1 = Object3DUtil.GetSingleCube(0.5, 2, 0.5, 0.8, 0.2, 0.1);
            this.aim.addChild(aim1);
            let aim2 = Object3DUtil.GetSingleCube(0.5, 2, 0.5, 0.8, 0.2, 0.1);
            aim2.rotationZ = 90;
            this.aim.addChild(aim2);
            this.aim.z = 10;
            this.aim.y = 10;
            this.moveScript = this.aim.addComponent(MoveScript);
            scene.addChild(this.aim);
        }

        //add a ball as prefeb
        let sphereObj = new Object3D();
        let mr = sphereObj.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(1, 20, 20);
        let mat = new LitMaterial();
        mr.material = mat;
        mat.baseColor = KelvinUtil.color_temperature_to_rgb(1325);
        Engine3D.res.addPrefab("ball", sphereObj);

        //add some tips
        const gui = new dat.GUI();
        let tip = gui.addFolder("Tips");
        let tips = {
            tip1: "press WASD to move",
            tip2: "press space to fire"
        };
        tip.add(tips, "tip1");
        tip.add(tips, "tip2");
        tip.open();
        let speed = gui.addFolder("Speed");
        speed.add({ ballSpeed: 30 }, "ballSpeed", 10, 60, 1).onChange((v) => {
            this.ballSpeed.z = -1 * v * 1000;
        });
        speed.add(this.moveScript, "moveSpeed", 1, 50, 1);
        speed.open();

        //start render
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);
    }
    private keyDown(e: KeyEvent) {
        //fire only when pressed the space key
        if (e.keyCode == KeyCode.Key_Space) {
            let sphereObj = Engine3D.res.getPrefab("ball");
            let collider = sphereObj.addComponent(ColliderComponent);
            collider.shape = new SphereColliderShape(1);
            let rigidBody = sphereObj.addComponent(Rigidbody);
            rigidBody.mass = 10;
            //set velocity after rigidbody inited
            rigidBody.addInitedFunction(() => {
                rigidBody.velocity = this.ballSpeed;
            }, this);
            sphereObj.transform.localPosition = this.aim.localPosition;
            this.view.scene.addChild(sphereObj);
        }
    }
}
//move script
class MoveScript extends ComponentBase {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    moveSpeed: number = 10;
    init(): void {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, this.keyUp, this);
    }
    private keyDown(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = true;
        }
        else if (e.keyCode == KeyCode.Key_D) {
            this.right = true;
        }
        else if (e.keyCode == KeyCode.Key_W) {
            this.up = true;
        }
        else if (e.keyCode == KeyCode.Key_S) {
            this.down = true;
        }
    }
    private keyUp(e: KeyEvent) {
        if (e.keyCode == KeyCode.Key_A) {
            this.left = false;
        }
        else if (e.keyCode == KeyCode.Key_D) {
            this.right = false;
        }
        else if (e.keyCode == KeyCode.Key_W) {
            this.up = false;
        }
        else if (e.keyCode == KeyCode.Key_S) {
            this.down = false;
        }
    }
    onUpdate() {
        if (this.up) {
            this.transform.y += this.moveSpeed * Time.delta / 1000;
        }
        else if (this.down) {
            this.transform.y -= this.moveSpeed * Time.delta / 1000;
        }
        else if (this.left) {
            this.transform.x -= this.moveSpeed * Time.delta / 1000;
        }
        else if (this.right) {
            this.transform.x += this.moveSpeed * Time.delta / 1000;
        }
    }
}

new Sample_ShootTheBox().run();
import { BoxGeometry, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, Vector3, AtmosphericComponent, HoverCameraController, ColliderComponent, BoxColliderShape, SphereColliderShape, DirectLight, SphereGeometry, KelvinUtil, PointerEvent3D, CameraUtil } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Physics, Rigidbody } from "@orillusion/physics";
import dat from "dat.gui";

class Sample_ShootTheBox {
    view: View3D;
    ballSpeed: number = 5;
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
        //set shadow
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.005;

        //add mouse event listener
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.MouseDown, this);

        //create scene,add sky and FPS
        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        //create camera
        let camera = CameraUtil.createCamera3DObject(scene);
        // camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        let controller = camera.object3D.addComponent(HoverCameraController);
        //disable controller move
        controller.mouseRightFactor = 0;
        controller.setCamera(0, -30, 50);

        //add DirectLight
        let lightObj = new Object3D();
        let light = lightObj.addComponent(DirectLight);
        light.intensity = 4;
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
            mats.forEach((element) => {
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
        gui.width = 280;
        let tip = gui.addFolder("Tips");
        let tips = {
            tip1: "left mouse:rotate camera",
            tip2: "right mouse:shoot ball"
        };
        tip.add(tips, "tip1");
        tip.add(tips, "tip2");
        tip.open();
        let speed = gui.addFolder("Speed");
        speed.add(this, "ballSpeed", 1, 10, 0.1);
        speed.open();

        //start render
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = camera;
        Engine3D.startRenderView(this.view);
    }

    private MouseDown(e: PointerEvent3D) {
        //right mouse down
        if (e.mouseCode == 2) {
            let ray = this.view.camera.screenPointToRay(e.mouseX, e.mouseY);
            let ball = Engine3D.res.getPrefab("ball");
            let collider = ball.addComponent(ColliderComponent);
            collider.shape = new SphereColliderShape(1);
            let rigidBody = ball.addComponent(Rigidbody);
            rigidBody.mass = 10;
            //set velocity after rigidbody inited
            rigidBody.wait().then(() => {
                rigidBody.linearVelocity = ray.direction.multiplyScalar(20 * this.ballSpeed);
            });
            ball.transform.localPosition = ray.origin;
            this.view.scene.addChild(ball);
        }
    }
}

new Sample_ShootTheBox().run();

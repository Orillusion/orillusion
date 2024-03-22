import Ammo from "@orillusion/ammo/ammo";
import { Scene3D, Object3D, Engine3D, View3D, Camera3D, HoverCameraController, AtmosphericComponent, Vector3, webGPUContext, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, ColorGradient, Color, PointerEvent3D, CameraUtil, SphereGeometry, InputSystem, Time } from "@orillusion/core";
import { RigidBody3D } from "./helps/components/RigidBody3D";
import { PhysicTransformUtils } from "./helps/PhysicTransformUtils";
import { PhysicsWorld } from "./helps/components/PhysicsWorld";

export class Sample_Physic_Magnet {
    private scene: Scene3D;
    view: View3D;
    camera: Camera3D;
    hov: HoverCameraController;
    ma: RigidBody3D;
    ma2: RigidBody3D;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 150;

        await Ammo.bind(window)(Ammo);
        await Engine3D.init({ renderLoop: () => this.loop() });

        let cameraObj = new Object3D();
        this.camera = cameraObj.addComponent(Camera3D);
        let hov = cameraObj.addComponent(HoverCameraController);
        hov.setCamera(30, -10, 25, Vector3.ZERO);

        this.view = new View3D();
        this.scene = new Scene3D();
        this.view.scene = this.scene;
        this.view.camera = this.camera;
        this.scene.addComponent(AtmosphericComponent);
        this.scene.addChild(cameraObj);

        Engine3D.startRenderView(this.view);
        await this.initScene(this.scene);
    }

    async initScene(scene: Scene3D) {
        let lightObj3D = new Object3D();
        let directLight = lightObj3D.addComponent(DirectLight);
        directLight.intensity = 5;
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = true;
        lightObj3D.rotationX = 53.2;
        lightObj3D.rotationY = 220;
        lightObj3D.rotationZ = 5.58;
        scene.addChild(lightObj3D);

        let physicWorld = scene.addComponent(PhysicsWorld);
        physicWorld.createWorld();

        this.createPhysicBox(new Vector3(0, 0, 0), new Vector3(100, 1, 100), 0);
        this.createPhysicBox(new Vector3(-50, 0, 0), new Vector3(1, 25, 100), 0);
        this.createPhysicBox(new Vector3(50, 0, 0), new Vector3(1, 25, 100), 0);
        this.createPhysicBox(new Vector3(0, 0, -50), new Vector3(100, 25, 1), 0);
        this.createPhysicBox(new Vector3(0, 0, 50), new Vector3(100, 25, 1), 0);

        let colorGradient = new ColorGradient([
            new Color(255 / 255, 0, 0),
            new Color(255 / 255, 165 / 255, 0),
            new Color(255 / 255, 255 / 255, 0),
            new Color(0, 255 / 255, 0),
            new Color(0, 127 / 255, 255 / 255),
            new Color(0, 0, 255 / 255),
            new Color(139 / 255, 0, 255 / 255),
        ]);
        let size = new Vector3(1, 1, 1);
        let box = new BoxGeometry(size.x, size.y, size.z);
        let countX = 10;
        let countY = 10;
        for (let i = 0; i < countX; i++) {
            for (let j = 0; j < countY; j++) {
                let boxItem = new Object3D();
                let mr = boxItem.addComponent(MeshRenderer);
                mr.geometry = box;
                let mat = new LitMaterial();
                mat.roughness = 0.85;
                mat.metallic = 0.05;
                mat.baseColor = colorGradient.getColor((i * countY + j) / (countX * countY));
                mr.material = mat;
                let boxRigibody3D = boxItem.addComponent(RigidBody3D);
                PhysicTransformUtils.applyBoxRigidBody(
                    boxRigibody3D,
                    new Vector3(i * size.x, j * (size.y + 0.000001) + 5, 0),
                    // new Vector3(i * size.x, j * size.y + size.y * countY + 100, 0),
                    new Vector3(size.x, size.y, size.z),
                    new Vector3(0, 0, 0),
                    10,
                    0.6,
                    0.1,
                    0.2
                );
                scene.addChild(boxItem);
            }
        }

        this.ma = this.createPhysicBall(new Vector3(0, 2, 5), 0.5, 0.1);
        this.ma2 = this.createPhysicBall(new Vector3(0, 2, 5), 0.5, 0.0);
        // Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onPickDown, this);
    }

    private loop() {
        this.ma.btBody.activate(true);

        let ray = this.view.camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let rayPos = ray.origin;
        let rayDirection = ray.direction;

        let magnetPos = rayDirection.clone().multiplyScalar(5).add(rayPos);
        this.ma2.setPosition(magnetPos);
        let oldPos = this.ma.transform.worldPosition;
        let magnetDir = magnetPos.subtract(oldPos);
        let len = magnetDir.length;

        magnetDir.normalize();
        magnetDir.multiplyScalar(len * 4.0);
        // let force = magnetDir.add(new Vector3(0, -9.8, 0.0));
        (this.ma.btBody as Ammo.btRigidBody).applyCentralForce(PhysicTransformUtils.getBtVector3(magnetDir));

        magnetDir.normalize();
        // magnetDir.multiplyScalar(len * 0.0001);
        magnetDir.add(new Vector3(0, -9.8 * 0.1, 0.0), magnetDir);
        (this.ma.btBody as Ammo.btRigidBody).setLinearVelocity(PhysicTransformUtils.getBtVector3(magnetDir));
        this.view.graphic3D.Clear("link");
        this.view.graphic3D.drawLines("link", [magnetPos, oldPos]);


    }

    private createPhysicBox(pos: Vector3, size: Vector3, mass: number): RigidBody3D {
        let cube = new Object3D();
        let mr = cube.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(size.x, size.y, size.z);
        mr.material = new LitMaterial();
        let floorRigibody3D = cube.addComponent(RigidBody3D);
        PhysicTransformUtils.applyBoxRigidBody(
            floorRigibody3D,
            pos,
            size,
            new Vector3(0, 0, 0),
            mass,
        );
        this.scene.addChild(cube);
        return floorRigibody3D;
    }

    private createPhysicBall(pos: Vector3, radius: number, mass: number): RigidBody3D {
        let cube = new Object3D();
        let mr = cube.addComponent(MeshRenderer);
        mr.geometry = new SphereGeometry(radius, 25, 25);
        mr.material = new LitMaterial();
        let floorRigibody3D = cube.addComponent(RigidBody3D);
        PhysicTransformUtils.applySphereRigidBody(
            floorRigibody3D,
            pos,
            radius,
            new Vector3(0, 0, 0),
            mass,
        );
        this.scene.addChild(cube);
        return floorRigibody3D;
    }
}

import Ammo from "@orillusion/ammo/ammo";
import { Scene3D, Object3D, Engine3D, View3D, Camera3D, HoverCameraController, AtmosphericComponent, Vector3, webGPUContext, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, ColorGradient, Color, PointerEvent3D, CameraUtil, SphereGeometry, InputSystem, Time, lerp, lerpVector3 } from "@orillusion/core";
import { RigidBody3D } from "./helps/components/RigidBody3D";
import { PhysicTransformUtils, BtVector3 } from "./helps/PhysicTransformUtils";
import { PhysicsWorld } from "./helps/components/PhysicsWorld";

export class Sample_Physic_Rope {
    private scene: Scene3D;
    view: View3D;
    camera: Camera3D;
    hov: HoverCameraController;
    m_a: RigidBody3D;
    ball: RigidBody3D;
    m_tt: RigidBody3D;
    ropeSoftBody: Ammo.btSoftBody;
    ropeMeshs: RigidBody3D[];

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

        let physicsWorld = scene.addComponent(PhysicsWorld);
        physicsWorld.creatSoftWorld();
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

        var ballMass = 1.2;
        var ballRadius = 0.05;
        var ropeNumSegments = 5;
        var ropeLength = 2.5;
        var ropeMass = 10;
        var margin = 0.5;

        this.m_tt = this.createPhysicBox(new Vector3(0, 15, 5), new Vector3(1, 1, 15), 0, new Vector3(0, 0, 0));
        this.m_a = this.createPhysicBall(new Vector3(0, 5, 2), ballRadius, ballMass);

        this.ropeMeshs = [];
        for (let i = 0; i < ropeNumSegments + 1; i++) {
            let box = this.createPhysicBall(Vector3.ZERO, ballRadius, 0);
            this.ropeMeshs.push(box);
        }

        var softBodyHelpers = new Ammo.btSoftBodyHelpers();
        var ropeStart = new Vector3(0, 13.6, 12);
        var ropeEnd = new Vector3(0, 13.6 + ropeLength, 12);
        this.ropeSoftBody = softBodyHelpers.CreateRope(physicsWorld.getSoftWorldInfo(), BtVector3(ropeStart), BtVector3(ropeEnd), ropeNumSegments - 1, 0);
        var sbConfig = this.ropeSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);

        this.ropeSoftBody.setTotalMass(ropeMass, false)
        physicsWorld.addSoftBody(this.ropeSoftBody);

        this.ropeSoftBody.setActivationState(4);
        var influence = 1;

        this.ball = this.createPhysicBall(ropeEnd.add(new Vector3(0, 1 * 2, 0)), 1, 3000);

        this.ropeSoftBody.appendAnchor(0, this.m_tt.rigidBody, true, influence);
        this.ropeSoftBody.appendAnchor(ropeNumSegments, this.ball.rigidBody, false, influence);
    }

    private loop() {
        var softBody = this.ropeSoftBody;
        var nodes = softBody.get_m_nodes();
        let list = [];
        for (var i = 0; i < this.ropeMeshs.length; i++) {
            var node = nodes.at(i);
            var nodePos = node.get_m_x();
            this.ropeMeshs[i].setPosition(nodePos.x(), nodePos.y(), nodePos.z());
            list.push(this.ropeMeshs[i].transform.worldPosition);
        }
        list.push(this.ball.transform.worldPosition);

        this.view.graphic3D.Clear("link_rope");
        this.view.graphic3D.drawLines("link_rope", list);

        let ray = this.view.camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let rayPos = ray.origin;
        let rayDirection = ray.direction;

        let magnetPos = rayDirection.clone().multiplyScalar(15).add(rayPos);
        this.m_tt.setPosition(magnetPos);
        this.m_tt.setRotationByForward(rayDirection);
    }

    private createPhysicBox(pos: Vector3, size: Vector3, mass: number, rot?: Vector3): RigidBody3D {
        let cube = new Object3D();
        let mr = cube.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(size.x, size.y, size.z);
        mr.material = new LitMaterial();
        let floorRigibody3D = cube.addComponent(RigidBody3D);
        PhysicTransformUtils.applyBoxRigidBody(
            floorRigibody3D,
            pos,
            size,
            rot ? rot : new Vector3(0, 0, 0),
            mass,
        );
        cube.transform.localPosition = pos;
        // cube.transform.localRotation = rot;
        this.scene.addChild(cube);
        return floorRigibody3D;
    }

    private createPhysicBall(pos: Vector3, radius: number, mass: number, rot?: Vector3): RigidBody3D {
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
        cube.transform.localPosition = pos;
        // cube.transform.localRotation = rot;
        this.scene.addChild(cube);
        return floorRigibody3D;
    }
}

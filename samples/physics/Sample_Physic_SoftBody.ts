import Ammo from "@orillusion/ammo/ammo";
import { Scene3D, Object3D, Engine3D, View3D, Camera3D, HoverCameraController, AtmosphericComponent, Vector3, webGPUContext, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, ColorGradient, Color, PointerEvent3D, CameraUtil, SphereGeometry, InputSystem, Time, lerp, lerpVector3, PlaneGeometry, VertexAttributeName } from "@orillusion/core";
import { RigidBody3D } from "./helps/components/RigidBody3D";
import { PhysicTransformUtils, BtVector3 } from "./helps/PhysicTransformUtils";
import { PhysicsWorld } from "./helps/components/PhysicsWorld";
import { FirstCharacterController } from "./gameDemo/components/FirstCharacterController";

export class Sample_Physic_SoftBody {
    private scene: Scene3D;
    view: View3D;
    camera: Camera3D;
    hov: HoverCameraController;
    cloth_gan: RigidBody3D;
    gun: RigidBody3D;
    physicsWorld: PhysicsWorld;
    clothSoftBody: RigidBody3D;
    mianCharacterController: FirstCharacterController;
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 150;

        await Ammo.bind(window)(Ammo);
        await Engine3D.init({ renderLoop: () => this.loop() });

        let cameraObj = new Object3D();
        this.camera = cameraObj.addComponent(Camera3D);
        this.mianCharacterController = cameraObj.addComponent(FirstCharacterController);
        // let hov = cameraObj.addComponent(HoverCameraController);
        // hov.setCamera(30, -10, 25, Vector3.ZERO);

        this.view = new View3D();
        this.scene = new Scene3D();
        this.view.scene = this.scene;
        this.view.camera = this.camera;
        this.scene.addComponent(AtmosphericComponent);
        this.scene.addChild(cameraObj);

        Engine3D.startRenderView(this.view);
        await this.initScene(this.scene);
    }

    createShot() {
        this.mianCharacterController.onShot = () => this.onShot();
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

        this.physicsWorld = scene.addComponent(PhysicsWorld);
        this.physicsWorld.creatSoftWorld();

        this.createPhysicsScene();
        this.createWall();
        await this.createCloth();
        this.createShot();
    }

    private loop() {
        if (!this.clothSoftBody) return;
        var softBody = this.clothSoftBody.softBody;
        if (this.clothSoftBody.geometry) {
            let clothData = this.clothSoftBody.geometry.getAttribute(VertexAttributeName.position);
            let clothPositions = clothData.data;
            var numVerts = clothPositions.length / 3;
            var nodes = softBody.get_m_nodes();
            for (var i = 0; i < numVerts; i++) {
                var node = nodes.at(i);
                var nodePos = node.get_m_x();
                clothPositions[i * 3 + 0] = nodePos.x();
                clothPositions[i * 3 + 1] = nodePos.y();
                clothPositions[i * 3 + 2] = nodePos.z();
            }
            this.clothSoftBody.geometry.vertexBuffer.upload(VertexAttributeName.position, clothData);
            //update normals
            this.clothSoftBody.geometry.computeNormals();
        }

        let wPs = this.view.camera.screenPointToWorld(window.innerWidth * 0.5, webGPUContext.windowHeight, 0.1);
        let direction = this.view.camera.transform.forward;

        let magnetPos = direction.clone().multiplyScalar(2.5).add(wPs);
        this.gun.setPosition(magnetPos);
        this.gun.setRotationByForward(direction);
    }

    private async createCloth() {
        var margin = 0.05;

        // Cloth graphic object
        var clothWidth = 10;
        var clothHeight = 10;
        var clothNumSegmentsZ = clothWidth * 2;
        var clothNumSegmentsY = clothHeight * 2;
        var clothSegmentLengthZ = clothWidth / clothNumSegmentsZ;
        var clothSegmentLengthY = clothHeight / clothNumSegmentsY;
        var clothPos = new Vector3(0, 15, 5);

        // Cloth physic object
        var softBodyHelpers = new Ammo.btSoftBodyHelpers();
        var clothCorner00 = new Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z);
        var clothCorner01 = new Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z - clothWidth);
        var clothCorner10 = new Ammo.btVector3(clothPos.x, clothPos.y + clothHeight, clothPos.z);
        var clothCorner11 = new Ammo.btVector3(clothPos.x, clothPos.y + clothHeight, clothPos.z - clothWidth);
        var clothSoftBody = softBodyHelpers.CreatePatch(this.physicsWorld.getSoftWorldInfo(), clothCorner00, clothCorner01, clothCorner10, clothCorner11, clothNumSegmentsZ + 1, clothNumSegmentsY + 1, 0, true);
        var sbConfig = clothSoftBody.get_m_cfg();
        sbConfig.set_viterations(15);
        sbConfig.set_piterations(15);

        clothSoftBody.setTotalMass(0.1, false)
        Ammo.castObject(clothSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 1);
        this.physicsWorld.addSoftBody(clothSoftBody, 1, -1);
        // Disable deactivation
        clothSoftBody.setActivationState(4);

        let chair_fabric_albedo = await Engine3D.res.loadTexture("PBR/SheenChair/chair_fabric_albedo.png");
        let chair_fabric_normal = await Engine3D.res.loadTexture("PBR/SheenChair/chair_fabric_normal.png");
        let planeGeometry = new PlaneGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
        let mat = new LitMaterial();
        mat.baseMap = chair_fabric_albedo;
        mat.normalMap = chair_fabric_normal;
        mat.doubleSide = true;
        mat.baseColor = new Color(1.0, 0.0, 0.0);
        mat.roughness = 0.85;
        mat.metallic = 0.2;

        let clothObj = new Object3D();
        clothObj.y = 5;
        let mr = clothObj.addComponent(MeshRenderer);
        mr.geometry = planeGeometry;
        mr.material = mat;

        this.clothSoftBody = clothObj.addComponent(RigidBody3D);
        this.clothSoftBody.geometry = planeGeometry;
        this.clothSoftBody.btBody = clothSoftBody;

        this.cloth_gan = this.createPhysicBox(clothPos.add(new Vector3(0, 0, -clothWidth * 0.5)), new Vector3(0.25, 0.25, clothWidth), 0, new Vector3(0, 0, 0));

        var influence = 0.5;
        clothSoftBody.appendAnchor(0, this.cloth_gan.rigidBody, false, influence);
        clothSoftBody.appendAnchor(clothNumSegmentsZ, this.cloth_gan.rigidBody, false, influence);

        this.scene.addChild(clothObj);
    }

    private createPhysicBox(pos: Vector3, size: Vector3, mass: number, rot?: Vector3, color?: Color): RigidBody3D {
        let cube = new Object3D();
        let mr = cube.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(size.x, size.y, size.z);

        let mat = new LitMaterial();
        mat.baseColor = color ? color : new Color(1.0, 1.0, 1.0);
        mr.material = mat;
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

    private createPhysicsScene() {
        this.createPhysicBox(new Vector3(0, 0, 0), new Vector3(100, 1, 100), 0);
        this.createPhysicBox(new Vector3(-50, 0, 0), new Vector3(1, 25, 100), 0);
        this.createPhysicBox(new Vector3(50, 0, 0), new Vector3(1, 25, 100), 0);
        this.createPhysicBox(new Vector3(0, 0, -50), new Vector3(100, 25, 1), 0);
        this.createPhysicBox(new Vector3(0, 0, 50), new Vector3(100, 25, 1), 0);

        this.gun = this.createPhysicBox(
            new Vector3(0, 15, 5),
            new Vector3(0.1, 0.4, 5),
            0,
            new Vector3(0, 0, 0),
            new Color(1, 0.8, 0),
        );
    }


    private onShot() {
        let radius = 0.55;
        let box = new SphereGeometry(radius, 15, 15);
        let bullet = new Object3D();
        let mr = bullet.addComponent(MeshRenderer);
        mr.geometry = box;
        let mat = new LitMaterial();
        mat.roughness = 0.85;
        mat.metallic = 0.05;
        mat.baseColor = new Color(1, 0, 0);
        mr.material = mat;
        let boxRigibody3D = bullet.addComponent(RigidBody3D);

        let gunTransform = this.gun.transform;
        PhysicTransformUtils.applySphereRigidBody(
            boxRigibody3D,
            gunTransform.worldPosition.add(gunTransform.forward.clone().multiplyScalar(5)),
            radius,
            new Vector3(0, 0, 0),
            1,
            0.6,
            0.1,
            0.05
        );

        let localForce = this.gun.transform.forward.clone().multiplyScalar(2000);
        // let localForce = rayDirection.clone().multiplyScalar(1000);
        // (boxRigibody3D.btBody as Ammo.btRigidBody).applyForce(PhysicTransformUtils.getBtVector3(rayDirection), PhysicTransformUtils.getBtVector3(rayPos));
        (boxRigibody3D.btBody as Ammo.btRigidBody).applyCentralLocalForce(PhysicTransformUtils.getBtVector3(localForce));
        this.scene.addChild(bullet);
    }

    private createWall() {
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
                this.scene.addChild(boxItem);
            }
        }
    }
}

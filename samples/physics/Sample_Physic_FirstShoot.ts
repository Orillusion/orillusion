import Ammo from "@orillusion/ammo/ammo";
import { Scene3D, Object3D, Engine3D, View3D, Camera3D, HoverCameraController, AtmosphericComponent, Vector3, webGPUContext, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, ColorGradient, Color, PointerEvent3D, CameraUtil, SphereGeometry, InputSystem, Time, lerp, lerpVector3, PlaneGeometry, VertexAttributeName, Interpolator, MathUtil, PostProcessingComponent, GTAOPost, TAAPost, BloomPost, FXAAPost, Object3DUtil, Texture, UnLitMaterial, SSGIPost } from "@orillusion/core";
import { RigidBody3D } from "./helps/components/RigidBody3D";
import { PhysicTransformUtils, BtVector3, ToVector3 } from "./helps/PhysicTransformUtils";
import { PhysicsWorld } from "./helps/components/PhysicsWorld";
import { FirstCharacterController } from "./gameDemo/components/FirstCharacterController";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { BulletPool } from "./gameDemo/BulletPool";

export class Sample_Physic_FirstShoot {
    private scene: Scene3D;
    view: View3D;
    camera: Camera3D;
    gun: Object3D;
    physicsWorld: PhysicsWorld;
    mianCharacterController: FirstCharacterController;
    bulletDecTex: Texture;

    shootSetting = {
        shootPower: 3000,
        bulletRadius: 0.2,
    }

    shootInfo = {
        fps: 0,
        bulletCount: 0,
        decCount: 0,
    };
    bulletPool: BulletPool;

    async run() {
        // Engine3D.frameRate = 60;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBound = 150;

        await Ammo.bind(window)(Ammo);
        await Engine3D.init({ renderLoop: () => this.loop() });

        GUIHelp.init();
        this.debugShoot();

        let cameraObj = new Object3D();
        this.camera = cameraObj.addComponent(Camera3D);
        this.camera.enableCSM = true;
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

        let post = this.scene.addComponent(PostProcessingComponent);
        // post.addPost(GTAOPost);
        // post.addPost(BloomPost);
        // post.addPost(FXAAPost);
        // post.addPost(SSGIPost);
        post.addPost(SSGIPost);
        await this.initScene(this.scene);
    }

    async createShot() {
        let bulletGeo = new SphereGeometry(1, 16, 16);
        let bulletMat = new UnLitMaterial();

        this.bulletPool = new BulletPool();
        this.bulletPool.init();
        this.bulletPool.createBulletSkin("bullet_0", bulletGeo, bulletMat);
        // this.gun = await Engine3D.res.loadGltf("gltfs/gun/gun_1.glb");
        this.gun = await Engine3D.res.loadGltf("gltfs/gun/gun_2.glb");
        this.gun.transform.y = -0.5;
        this.gun.transform.x = -0.5;
        this.gun.transform.z = 2;
        this.gun.transform.scaleX = 0.035;
        this.gun.transform.scaleY = 0.035;
        this.gun.transform.scaleZ = 0.035;
        this.view.camera.object3D.addChild(this.gun);

        this.mianCharacterController.onShot = () => this.onShot();
    }

    async initScene(scene: Scene3D) {
        let shootScene = await Engine3D.res.loadGltf("gltfs/scene/shoot/shootScene.glb");
        scene.addChild(shootScene);

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

        await this.createPhysicsScene();
        await this.createWall();
        // await this.createCloth();
        await this.createShot();
    }

    private loop() {
        if (!this.gun) return;

        // let tr = this.gun.transform;
        // let end = tr.forward.clone().normalize().multiplyScalar(1000);

        // this.view.graphic3D.Clear("gun_ray");
        // this.view.graphic3D.drawLines("gun_ray", [tr.worldPosition, end], new Color(1, 0, 0));

        this.shootInfo.fps = 1000 / Time.delta;
        this._infoF.updateDisplay();
    }

    private createPhysicBox(pos: Vector3, size: Vector3, mass: number, rot?: Vector3, color?: Color): RigidBody3D {
        let cube = new Object3D();
        cube.name = 'cube';
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

    private async createPhysicsScene() {
        this.createPhysicBox(new Vector3(0, 0, 0), new Vector3(100, 1, 100), 0);
        this.createPhysicBox(new Vector3(-50, 0, 0), new Vector3(1, 25, 100), 0);
        this.createPhysicBox(new Vector3(50, 0, 0), new Vector3(1, 25, 100), 0);
        this.createPhysicBox(new Vector3(0, 0, -50), new Vector3(100, 25, 1), 0);
        this.createPhysicBox(new Vector3(0, 0, 50), new Vector3(100, 25, 1), 0);
        this.createPhysicBox(new Vector3(0, 0, 15), new Vector3(10, 10, 1), 0, Vector3.ZERO, new Color(0.5, 0.6, 0.1));
        this.createPhysicBox(new Vector3(0, 0, -15), new Vector3(10, 10, 1), 0, Vector3.ZERO, new Color(0.5, 0.6, 0.1));
        this.createPhysicBox(new Vector3(15, 0, -15), new Vector3(10, 10, 1), 0, Vector3.ZERO, new Color(0.5, 0.6, 0.1));
        this.createPhysicBox(new Vector3(15, 0, -5), new Vector3(10, 10, 10), 0, Vector3.ZERO, new Color(0.5, 0.6, 0.1));

        // this.bulletDecTex = await Engine3D.res.loadTexture(`textures/128/vein_0018.png`);
        this.bulletDecTex = await Engine3D.res.loadTexture(`particle/T_Fx_Object_229.png`);
    }

    private getGunInfo() {
        let gunTransform = this.gun.transform;
        let form = gunTransform.worldPosition.add(gunTransform.forward.clone().multiplyScalar(5));
        form.add(new Vector3(0, 0.2, 0), form);
        let to = gunTransform.forward.clone().normalize();
        let localForce = to.clone().multiplyScalar(this.shootSetting.shootPower);
        to.add(localForce, to);
        return { form, to, localForce };
    }

    private onShot() {
        // get a bullet form pool
        let bullet = this.bulletPool.getBullet("bullet_0");
        // reback gun state 
        this.gunBack();

        // cast bullet
        let { form, to, localForce } = this.getGunInfo();
        bullet.cast(this.shootSetting.bulletRadius, form, to, localForce);

        // need Rigibody3D component add
        this.scene.addChild(bullet.object3D);

        // ray cast to check if hit
        let userID = this.physicsWorld.rayCast(form, to, Vector3.HELP_0, Vector3.HELP_1);
        if (userID >= 0) {
            this.createDec(Vector3.HELP_1);
            let item = this.physicsWorld.getObject(userID);
            if (item) {
                console.log(item.name);
            }
            Interpolator.to(bullet.object3D, {}, to.subtract(form).length / 10).onComplete = () => {
                bullet.recovery();
                this.removeBulletCount();
            }
        } else {
            Interpolator.to(bullet.object3D, {}, 2000).onComplete = () => {
                bullet.recovery();
                this.removeBulletCount();
            }
        }

        this.addBulletCount();
        this.addDecCount();

        // play gun shot once anim 
        this.playGunBackAnim();
    }

    private createDec(v: Vector3) {
        let p = Object3DUtil.GetPlane(this.bulletDecTex);
        p.scaleY = 0.1
        this.scene.addChild(p);
        v.multiplyScalar(Math.random() * 0.005 + 0.0025).add(Vector3.HELP_0, Vector3.HELP_0);
        p.transform.localPosition = Vector3.HELP_0;
        p.transform.up = Vector3.HELP_1;
    }

    private playGunBackAnim() {
        let rdDir = Vector3.HELP_0;
        rdDir.set(0, 0, 0);
        rdDir.y = Math.random() * 1;
        let backPower = 10;
        Interpolator.to(this.gun.transform,
            {
                rotationX: -backPower + rdDir.x,
                rotationY: rdDir.y,
                z: 2 + -backPower * 0.02
            }
            , 120).onComplete = () => this.gunBack();
    }

    private gunBack() {
        let gunTransform = this.gun.transform;
        gunTransform.rotationX = 0;
        gunTransform.rotationY = 0;
        gunTransform.rotationZ = 0;
        gunTransform.y = -0.5;
        gunTransform.x = -0.5;
        gunTransform.z = 2;
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


    private addBulletCount() {
        this.shootInfo.bulletCount++;
        console.log(`addBulletCout`);
        this.updateGUI();
    }

    private removeBulletCount() {
        this.shootInfo.bulletCount--;
        this.updateGUI();
    }

    private addDecCount() {
        this.shootInfo.decCount++;
        this.updateGUI();
    }

    private removeDecCount() {
        this.shootInfo.decCount--;
        this.updateGUI();
    }

    private _infoB: any;
    private _infoD: any;
    private _infoF: any;
    private debugShoot() {
        let folder = GUIHelp.addFolder("shootSetting");
        folder.open();
        GUIHelp.add(this.shootSetting, "shootPower", 0, 100, 0.001);
        GUIHelp.endFolder();

        let infoFolder = GUIHelp.addFolder("shootInfo");
        infoFolder.open();
        this._infoF = GUIHelp.add(this.shootInfo, "fps", 0, 9999999, 0.0001);
        this._infoB = GUIHelp.add(this.shootInfo, "bulletCount", 0, 9999999, 0);
        this._infoD = GUIHelp.add(this.shootInfo, "decCount", 0, 9999999, 0);
        GUIHelp.endFolder();
    }

    public updateGUI() {


        this._infoB.updateDisplay();
        this._infoD.updateDisplay();
    }
}

import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { PointLight } from "../../src/components/lights/PointLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Camera3D } from "../../src/core/Camera3D";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { SphereGeometry } from "../../src/shape/SphereGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_Shadow {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;
    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.shadow.shadowBound = 1000;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.pointShadowBias = 0.002;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        // Engine3D.setting.shadow.type = `PCF`;
        // Engine3D.engineSetting.Shadow.type = `SOFT`;
        Engine3D.setting.shadow.type = `HARD`;

        Engine3D.setting.render.debug = true;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            debug: false,
            blurX: 4,
            blurY: 4,
            intensity: 0.5,
            brightness: 1.25,
        };


        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(-60, -25, 1000);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        let job = Engine3D.startRenderView(view);
        job.debug();
        await this.initScene();
    }

    async initScene() {
        // let iesTexture = await Engine3D.res.loadTexture("ies/ies_2.png") as BitmapTexture2D;
        // var iesPofiles = new IESProfiles();
        // iesPofiles.IESTexture = iesTexture;

        /******** light *******/
        {
            let lights = [];
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 15;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 20;
            lc.debug();
            this.scene.addChild(this.lightObj);
            lights.push(lc);

            // let lightObj2 = new Object3D();
            // lightObj2.rotationX = -96;
            // lightObj2.rotationY = 110;
            // lightObj2.rotationZ = 0;
            // let lc2 = lightObj2.addComponent(DirectLight);
            // lc2.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            // lc2.castShadow = true;
            // lc2.intensity = 2;
            // lc2.debug();
            // this.scene.addChild(lightObj2);
            // lights.push(lc2);

            for (let i = 0; i < 1; i++) {
                let po = new Object3D();
                let pl = po.addComponent(PointLight);
                // pl.lightColor = Color.random() ;
                pl.intensity = 10;
                pl.range = 600;
                pl.castShadow = true;
                pl.realTimeShadow = true;
                // pl.iesPofile = iesPofiles;
                po.x = 10;
                po.y = 45;
                po.z = 18;

                // po.x = Math.random() * 100 - 50;
                // po.y = Math.random() * 50;
                // po.z = Math.random() * 100 - 50;

                this.scene.addChild(po);
                pl.debug();
                pl.debugDraw(true);
            }

        }


        let ball: Object3D;
        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
            mat.emissiveMap = Engine3D.res.blackTexture;
            mat.roughness = 0.5;
            mat.metallic = 0.2;

            let floor = new Object3D();
            let floorMr = floor.addComponent(MeshRenderer);
            floorMr.geometry = new BoxGeometry(50000, 5, 50000);
            floorMr.material = mat;
            this.scene.addChild(floor);

            ball = new Object3D();
            let mr = ball.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(6, 20, 20);
            mr.material = mat;
            this.scene.addChild(ball);
            ball.transform.x = -17;
            ball.transform.y = 34;
            ball.transform.z = 23;

            //wall
            let back_wall = new Object3D();
            let mr2 = back_wall.addComponent(MeshRenderer);
            mr2.geometry = new BoxGeometry(500, 500, 10);
            mr2.material = mat;
            back_wall.z = - 200;
            this.scene.addChild(back_wall);

            let front_wall = new Object3D();
            let mr3 = front_wall.addComponent(MeshRenderer);
            mr3.geometry = new BoxGeometry(500, 500, 10);
            mr3.material = mat;
            front_wall.z = 200;
            this.scene.addChild(front_wall);

            let left_wall = new Object3D();
            let mr4 = left_wall.addComponent(MeshRenderer);
            mr4.geometry = new BoxGeometry(10, 500, 500);
            mr4.material = mat;
            left_wall.x = - 200;
            this.scene.addChild(left_wall);

            let right_wall = new Object3D();
            let mr5 = right_wall.addComponent(MeshRenderer);
            mr5.geometry = new BoxGeometry(10, 500, 500);
            mr5.material = mat;
            right_wall.x = 200;
            this.scene.addChild(right_wall);
        }

        let chair = (await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        chair.scaleX = chair.scaleY = chair.scaleZ = 60;
        chair.transform.y = 0;
        this.scene.addChild(chair);

        let Duck = (await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.15;
        Duck.transform.y = 0;
        Duck.transform.x = -16;
        Duck.transform.z = 36;
        this.scene.addChild(Duck);
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}

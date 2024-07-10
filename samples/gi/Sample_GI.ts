import { Object3D, Scene3D, Engine3D, GlobalIlluminationComponent, Object3DUtil, PostProcessingComponent, TAAPost, BloomPost, FXAAPost, CameraUtil, HoverCameraController, AtmosphericComponent, DirectLight, KelvinUtil, View3D, GTAOPost } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

class Sample_GI {
    lightObj3D: Object3D;
    scene: Scene3D;
    async run() {

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.gi.enable = true;
        Engine3D.setting.gi.debug = true;
        Engine3D.setting.render.debug = true;

        Engine3D.setting.gi.probeYCount = 3;
        Engine3D.setting.gi.probeXCount = 6;
        Engine3D.setting.gi.probeZCount = 6;
        Engine3D.setting.gi.probeSpace = 60;
        Engine3D.setting.gi.offsetX = 0;
        Engine3D.setting.gi.offsetY = 60;
        Engine3D.setting.gi.offsetZ = 0;
        Engine3D.setting.gi.indirectIntensity = 1;
        Engine3D.setting.gi.probeSize = 64;
        Engine3D.setting.gi.octRTSideSize = 64;
        Engine3D.setting.gi.octRTMaxSize = 2048;
        Engine3D.setting.gi.ddgiGamma = 1;
        Engine3D.setting.gi.autoRenderProbe = true;

        Engine3D.setting.shadow.shadowBound = 400;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBias = 0.05;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        await Engine3D.init({
            renderLoop: () => {
                if (this.giComponent?.isStart) {
                    GUIUtil.renderGIComponent(this.giComponent);
                    this.giComponent = null;
                }
            }
        });
        GUIHelp.init();
        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        let ctrl = camera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(0, -45, 200);
        ctrl.maxDistance = 1000;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        await this.initScene();

        this.addGIProbes(view);

        Engine3D.startRenderView(view);

        let postCom = this.scene.addComponent(PostProcessingComponent);
        postCom.addPost(FXAAPost);

        GUIUtil.renderDebug();

        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 35;
            this.lightObj3D.rotationY = 110;
            this.lightObj3D.rotationZ = 0;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 3;
            this.scene.addChild(this.lightObj3D);

            GUIUtil.renderDirLight(directLight);
        }
        sky.relativeTransform = this.lightObj3D.transform;

        GUIUtil.renderAtmosphericSky(sky);
    }

    private giComponent: GlobalIlluminationComponent;

    private addGIProbes(view: View3D) {
        let probeObj = new Object3D();
        this.giComponent = probeObj.addComponent(GlobalIlluminationComponent, view.scene);
        this.scene.addChild(probeObj);
    }

    async initScene() {

        {
            let floorHeight = 20;
            let floor = Object3DUtil.GetSingleCube(1000, floorHeight, 1000, 0.5, 0.5, 0.5);
            floor.y = -floorHeight;
            this.scene.addChild(floor);
        }

        let obj3dList: Object3D[] = [];
        {
            let greenBall = Object3DUtil.GetSingleSphere(30, 0.1, 0.8, 0.2);
            greenBall.x = -70;
            greenBall.y = 40;
            obj3dList.push(greenBall);
        }

        {
            let chair = await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf') as Object3D;
            chair.scaleX = chair.scaleY = chair.scaleZ = 100;
            chair.rotationZ = chair.rotationX = 130;
            chair.z = -120;
            obj3dList.push(chair);
        }

        {
            let Duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
            Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.3;
            Duck.transform.y = 0;
            Duck.transform.x = 0;
            Duck.transform.z = 80;
            obj3dList.push(Duck);
        }

        {
            let car = await Engine3D.res.loadGltf('gltfs/pbrCar/pbrCar.gltf');
            car.scaleX = car.scaleY = car.scaleZ = 1.5;
            car.x = 20;
            obj3dList.push(car);
        }

        for (let obj3D of obj3dList) {
            this.scene.addChild(obj3D);
        }
    }
}

new Sample_GI().run();
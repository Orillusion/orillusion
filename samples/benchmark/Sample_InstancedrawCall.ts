import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats'
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, Vector3, Vector3Ex, UnLitMaterial, InstanceDrawComponent, LambertMaterial, Time, BoundingBox, Color, OcclusionSystem, PostProcessingComponent, GlobalFog, SphereGeometry } from '@orillusion/core';

// simple base demo
class Sample_drawCallInstance {
    scene: Scene3D;
    public anim: boolean = false;
    lightObj3D: Object3D;
    async run() {

        Engine3D.setting.pick.enable = false;
        // init engine
        await Engine3D.init({ renderLoop: () => this.renderLoop() });

        OcclusionSystem.enable = false;
        // create new Scene
        this.scene = new Scene3D();

        // add performance stats
        this.scene.addComponent(Stats);

        // add an Atmospheric sky enviroment
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // add a basic camera controller
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -15, 300);

        // add a basic direct light
        let lightObj = new Object3D();
        lightObj.rotationX = 45;
        lightObj.rotationY = 60;
        lightObj.rotationZ = 150;
        let dirLight = lightObj.addComponent(DirectLight);
        dirLight.lightColor = KelvinUtil.color_temperature_to_rgb(5500);
        dirLight.intensity = 3;
        dirLight.indirect = 1;
        this.scene.addChild(lightObj);

        sky.relativeTransform = dirLight.transform;

        // create a view with target this.scene and camera
        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);
        GUIHelp.init();
        GUIHelp.open();
        GUIHelp.add(this, "anim").onChange = () => this.anim != this.anim;
        this.initScene();
    }


    private _list: Object3D[] = [];
    initScene() {
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.x = 0;
            this.lightObj3D.y = 30;
            this.lightObj3D.z = -40;
            this.lightObj3D.rotationX = 144;
            this.lightObj3D.rotationY = 0;
            this.lightObj3D.rotationZ = 0;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 30;
            directLight.indirect = 1;
            this.scene.addChild(this.lightObj3D);
        }


        let shareGeometry = new BoxGeometry();
        let material = new LambertMaterial();
        material.baseColor = new Color(
            Math.random(),
            Math.random(),
            Math.random(),
        )

        let group = new Object3D();
        let count = 10 * 10000;

        GUIHelp.addLabel(`use instance draw box`);
        GUIHelp.addInfo(`count `, count);

        let ii = 0;
        // let count = 70000;
        for (let i = 0; i < count; i++) {
            // let pos = Vector3Ex.sphereXYZ(20, 30, 0, 0, 10);
            let pos = Vector3Ex.sphereXYZ(ii * 60 + 20, ii * 60 + 100, 100, i * 0.001 + 10, 100);
            // let pos = Vector3Ex.getRandomXYZ(-2, 2);
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = shareGeometry;
            mr.material = material;
            obj.localPosition = pos;
            group.addChild(obj);
            this._list.push(obj);

            obj.transform.scaleX = Math.random() * 2 + 1.2;
            obj.transform.scaleY = Math.random() * 2 + 1.2;
            obj.transform.scaleZ = Math.random() * 2 + 1.2;

            obj.transform.rotationX = Math.random() * 360;
            obj.transform.rotationY = Math.random() * 360;
            obj.transform.rotationZ = Math.random() * 360;
            
            // use localDetailRot to update rotation by time
            obj.transform.localDetailRot = new Vector3(
                (Math.random() * 1 - 1 * 0.5) * 2.0 * Math.random() * 50 * 0.001,
                (Math.random() * 1 - 1 * 0.5) * 2.0 * Math.random() * 50 * 0.001,
                (Math.random() * 1 - 1 * 0.5) * 2.0 * Math.random() * 50 * 0.001);
            if (i % 10000 == 0) {
                ii++;
            }
        }

        group.addComponent(InstanceDrawComponent);
        // use localDetailRot to update rotation by time
        group.transform.localDetailRot = new Vector3(0, 0.01, 0);
        group.bound = new BoundingBox(Vector3.SAFE_MIN, Vector3.SAFE_MAX);
        this._list.push(group);
        this.scene.addChild(group);
    }


    renderLoop() {
        if (this.anim) {
            for (let i = 0; i < this._list.length; i++) {
                let element = this._list[i];
                element.transform.localChange = true;
            }
        }
    }
}

new Sample_drawCallInstance().run()
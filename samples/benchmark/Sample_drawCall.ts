import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats'
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, KelvinUtil, View3D, Vector3, Vector3Ex, UnLitMaterial, InstanceDrawComponent, LambertMaterial, Time, BoundingBox, Color, OcclusionSystem } from '@orillusion/core';
import { GUIUtil } from '@samples/utils/GUIUtil';

// simple base demo
class Sample_drawCall {
    scene: Scene3D;
    public rotation: boolean = false;
    public revolution: boolean = false;
    async run() {
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
        hoverCameraController.setCamera(15, -15, 100);

        // add a basic direct light
        let lightObj = new Object3D();
        lightObj.rotationX = 45;
        lightObj.rotationY = 60;
        lightObj.rotationZ = 150;
        let dirLight = lightObj.addComponent(DirectLight);
        dirLight.lightColor = KelvinUtil.color_temperature_to_rgb(53355);
        dirLight.intensity = 60;
        this.scene.addChild(lightObj);

        sky.relativeTransform = dirLight.transform;

        // create a view with target this.scene and camera
        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);

        GUIHelp.init();

        GUIHelp.add(this, "rotation").onChange = () => {
            this.rotation != this.rotation;
        };

        GUIHelp.add(this, "revolution").onChange = () => {
            this.revolution != this.revolution;
        };

        this.initScene();
    }


    private _list: Object3D[] = [];
    private _rotList: number[] = [];
    initScene() {
        let shareGeometry = new BoxGeometry();
        // let material = new UnLitMaterial();
        let materials = [
            new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
            // new LambertMaterial(),
        ];

        for (let i = 0; i < materials.length; i++) {
            const element = materials[i];
            element.baseColor = Color.random();
        }

        // let material = new LitMaterial();

        let group = new Object3D();
        let count = 50000;
        // let count = 70000;
        for (let i = 0; i < count; i++) {
            let pos = Vector3Ex.sphereXYZ(50, 100, 100, 10, 100);
            // let pos = Vector3Ex.getRandomXYZ(-2, 2);
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = shareGeometry;
            mr.material = materials[Math.floor(Math.random() * materials.length)];
            obj.localPosition = pos;
            group.addChild(obj);
            this._list.push(obj);

            obj.transform.scaleX = Math.random() * 2 + 0.2;
            obj.transform.scaleY = Math.random() * 2 + 0.2;
            obj.transform.scaleZ = Math.random() * 2 + 0.2;

            obj.transform.rotationX = Math.random() * 360;
            obj.transform.rotationY = Math.random() * 360;
            obj.transform.rotationZ = Math.random() * 360;

            this._rotList.push((Math.random() * 1 - 1 * 0.5) * 2.0 * Math.random() * 100);
            obj.transform.rotatingY = 16 * 0.01 * this._rotList[i];
        }

        // group.addComponent(InstanceDrawComponent);
        this._rotList.push(1.0);
        group.transform.rotatingY = 16 * 0.01 * 1;

        group.bound = new BoundingBox(Vector3.SAFE_MIN, Vector3.SAFE_MAX);
        this._list.push(group);
        this.scene.addChild(group);
    }

    renderLoop() {
        if (this.rotation) {
            let i = 0;
            for (let i = 0; i < this._list.length - 1; i++) {
                const element = this._list[i];
                element.transform.rotationY += Time.delta * 0.01 * this._rotList[i];
                // element.transform._localRot.y += Time.delta * 0.01 * this._rotList[i];
                // element.transform.localChange = true;
            }
        }

        if (this.revolution) {
            const element = this._list[this._list.length - 1];
            element.transform.rotationY += Time.delta * 0.01 * this._rotList[this._list.length - 1];
        }
    }
}

new Sample_drawCall().run()
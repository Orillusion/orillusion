import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, PlaneGeometry, MeshRenderer, SphereGeometry } from "@orillusion/core";

export class Sample_Outline {
    lightObj: Object3D;
    scene: Scene3D;

    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.material.materialDebug = false;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.enable = false;
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.taa.debug = false;
        Engine3D.setting.render.postProcessing.gtao.debug = false;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });


        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(180, -45, 15);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);

        this.selectBall();
    }

    private selectBall(): void {
        // outlinePostManager.setOutlineList([[this.sphereList[0]], [this.nextSphere()], [this.nextSphere()]], [new Color(1, 0.2, 0, 1), new Color(0.2, 1, 0)]);
    }

    /**
     * @ch asdasda
     * @en asdasdas
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 45;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 5.7;
            scene.addChild(this.lightObj);
        }
        this.createPlane(scene);

        return true;
    }

    private sphereList: Object3D[] = [];
    private sphereIndex = 0;

    private nextSphere(): Object3D {
        this.sphereIndex++;
        if (this.sphereIndex >= this.sphereList.length) {
            this.sphereIndex = 1;
        }

        return this.sphereList[this.sphereIndex];
    }

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.whiteTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        // mat.maskMap = defaultTexture.createTexture(32, 32, 255.0, 10.0, 0.0, 1);
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 0.5;
        mat.roughness_max = 0.1;
        mat.metallic = 0.5;

        {
            let debugGeo = new PlaneGeometry(1000, 1000);
            let obj: Object3D = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = debugGeo;
            scene.addChild(obj);
        }

        let sphereGeometry = new SphereGeometry(1, 50, 50);
        for (let i = 0; i < 10; i++) {
            let obj: Object3D = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = sphereGeometry;
            obj.x = 2;
            obj.y = 2;

            let angle = (2 * Math.PI * i) / 10;
            obj.x = Math.sin(angle) * 2;
            obj.z = Math.cos(angle) * 2;
            scene.addChild(obj);
            this.sphereList.push(obj);
        }
    }

    private loop(): void { }
}

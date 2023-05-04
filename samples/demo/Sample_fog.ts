import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, PlaneGeometry, BoxGeometry } from "@orillusion/core";

export class Sample_fog {
    constructor() { }
    lightObj: Object3D;
    scene: Scene3D;

    async run() {
        Engine3D.setting.render.postProcessing.taa.debug = false;
        Engine3D.setting.render.postProcessing.gtao.debug = false;
        Engine3D.setting.shadow.shadowBound = 1;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.shadowBias = 0.002;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(0, -20, 150);

        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene() {
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 80;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 45;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 10;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
            mat.emissiveMap = Engine3D.res.blackTexture;
            mat.roughness = 1.0;
            mat.metallic = 0.0;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(2000, 2000);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        this.createPlane(this.scene);
    }

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 10.0, 0.0, 1);
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 0.1;
        mat.roughness_max = 0.1;
        mat.metallic = 0.0;

        const length = 10;
        let cubeGeometry = new BoxGeometry(1, 1, 1);
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length; j++) {
                let building: Object3D = new Object3D();
                let mr = building.addComponent(MeshRenderer);
                mr.material = mat;
                mr.geometry = cubeGeometry;
                building.localScale = building.localScale;
                building.x = (i - 5) * (Math.random() * 0.5 + 0.5) * 50;
                building.z = (j - 5) * (Math.random() * 0.5 + 0.5) * 50;
                building.scaleX = 10 * (Math.random() * 0.5 + 0.5);
                building.scaleZ = 10 * (Math.random() * 0.5 + 0.5);
                building.scaleY = 50 * (Math.random() * 0.5 + 0.5);
                scene.addChild(building);
            }
        }
    }
}

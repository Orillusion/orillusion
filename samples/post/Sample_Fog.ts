import { AtmosphericComponent, BoxGeometry, CameraUtil, CylinderGeometry, DirectLight, Engine3D, GlobalFog, HoverCameraController, KelvinUtil, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, PostProcessingComponent, Scene3D, View3D, webGPUContext } from '@orillusion/core';

class Sample_Fog {
    constructor() { }
    lightObj: Object3D;
    scene: Scene3D;

    async run() {
        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 500;
        Engine3D.setting.shadow.shadowBias = 0.0002;

        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(0, -20, 150);
        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);

        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        let fog = postProcessing.addPost(GlobalFog);
    }

    async initScene() {
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 30;
            this.scene.addChild(this.lightObj);
        }

        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
            mat.emissiveMap = Engine3D.res.blackTexture;
            mat.roughness = 1.0;
            mat.metallic = 0.0;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new CylinderGeometry(2000, 2000, 1, 20, 20, false);
            mr.materials = [mat, mat, mat];
            this.scene.addChild(floor);
        }

        this.createPlane(this.scene);
    }

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 1.0;
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

new Sample_Fog().run();

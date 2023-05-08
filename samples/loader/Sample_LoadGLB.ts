import { Object3D, Scene3D, HoverCameraController, Engine3D, CameraUtil, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, PlaneGeometry, AtmosphericComponent } from "@orillusion/core";

// Sample to load glb file
export class Sample_LoadGLB {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        await Engine3D.init();
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(-45, -30, 15);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 21;
            this.lightObj3D.rotationY = 108;
            this.lightObj3D.rotationZ = 10;
            let lc = this.lightObj3D.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 10;
            lc.debug();
            this.scene.addChild(this.lightObj3D);
        }

        /******** floor *******/
        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new PlaneGeometry(100, 100);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        /******** load glb file *******/
        let model = (await Engine3D.res.loadGltf('gltfs/UR3E/UR3E.glb', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        this.scene.addChild(model);
        model.scaleX = model.scaleY = model.scaleZ = 5;
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

}

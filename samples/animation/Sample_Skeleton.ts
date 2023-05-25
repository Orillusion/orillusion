import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, LitMaterial, MeshRenderer, BoxGeometry, DirectLight, KelvinUtil, Object3DUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_Skeleton {
    lightObj3D: Object3D;
    scene: Scene3D;
    async run() {

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        let ctrl = camera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(0, -45, 100);
        ctrl.maxDistance = 1000;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        this.initScene(this.scene);
    }


    async initScene(scene: Scene3D) {
        GUIHelp.init();
        {
            // load model with skeleton animation
            let man = await Engine3D.res.loadGltf('gltfs/CesiumMan/CesiumMan_compress.gltf');
            man.scaleX = 30;
            man.scaleY = 30;
            man.scaleZ = 30;
            scene.addChild(man);
        }

        /******** floor *******/
        this.scene.addChild(Object3DUtil.GetSingleCube(3000, 1, 3000, 0.5, 0.5, 0.5));

        /******** light *******/
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
            directLight.intensity = 25;
            GUIUtil.renderDirLight(directLight);
            scene.addChild(this.lightObj3D);
        }

        return true;
    }

}

new Sample_Skeleton().run();
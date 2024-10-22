import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, Vector3 } from "@orillusion/core";
import { TextGeometry, FontParser } from "@orillusion/geometry";
import { Graphic3D } from "@orillusion/graphic";

class Sample_TextGeometry {
    lightObj: Object3D;
    async run() {
        await Engine3D.init();
        let view = new View3D();
        view.scene = new Scene3D();
        let sky = view.scene.addComponent(AtmosphericComponent);

        view.camera = CameraUtil.createCamera3DObject(view.scene);
        view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        view.camera.object3D.z = -15;
        view.camera.object3D.addComponent(HoverCameraController).setCamera(35, -20, 150);

        Engine3D.startRenderView(view);

        await this.createScene(view.scene);
        sky.relativeTransform = this.lightObj.transform;
    }

    async createScene(scene: Scene3D) {
        {
            scene.addChild(new Graphic3D());

            let font = await Engine3D.res.load("/fonts/Roboto.ttf", FontParser);

            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new TextGeometry("Hello, Orillusion!", {
                font: font, // required
                fontSize: 16, // required
                depth: 5,
                steps: 1,
                bevelEnabled: false,
                anchorPoint: new Vector3(0.5, 0.5, 0.5),
            });

            let mats = [];
            let mat = new LitMaterial();
            for (let i = 0; i < mr.geometry.subGeometries.length; i++) {
                mats.push(mat);
            }
            mr.materials = mats;

            scene.addChild(obj);
        }

        let lightObj3D = this.lightObj = new Object3D();
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 3;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;
        lightObj3D.rotationX = 53.2;
        lightObj3D.rotationY = 220;
        lightObj3D.rotationZ = 5.58;
        scene.addChild(lightObj3D);
    }
}

new Sample_TextGeometry().run();

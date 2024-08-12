import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, VertexAttributeName, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, CylinderGeometry, TorusGeometry, Vector2, Color, GeometryBase, Vector3 } from "@orillusion/core";
import { Shape2D, ExtrudeGeometry } from "@orillusion/geometry";

class Sample_ExtrudeGeometry {
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
        let lightObj3D = this.lightObj = new Object3D();
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 3;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;
        lightObj3D.rotationX = 53.2;
        lightObj3D.rotationY = 220;
        lightObj3D.rotationZ = 5.58;
        scene.addChild(lightObj3D);

        {
            let shape = new Shape2D();
            shape.moveTo(0, 20);
            shape.bezierCurveTo(0, 10, -18, 0, -25, 0);
            shape.bezierCurveTo(-55, 0, -55, 35, -55, 35);
            shape.bezierCurveTo(-55, 55, -35, 77, 0, 95);
            shape.bezierCurveTo(35, 77, 55, 55, 55, 35);
            shape.bezierCurveTo(55, 35, 55, 0, 25, 0);
            shape.bezierCurveTo(18, 0, 0, 10, 0, 20);

            let mat = new LitMaterial();
            mat.baseColor = new Color(0.2, 0.5, 1.0);

            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.geometry = new ExtrudeGeometry([shape], {
                depth: 10,
                bevelEnabled: false,
                steps: 1
            });
            let mats = [];
            for (let i = 0; i < mr.geometry.subGeometries.length; i++) {
                mats.push(mat);
            }
            mr.materials = mats;
            scene.addChild(obj);
        }
    }
}

new Sample_ExtrudeGeometry().run();

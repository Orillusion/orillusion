import { View3D, PlaneGeometry, Engine3D, Scene3D, AtmosphericComponent, CameraUtil, HoverCameraController, Object3D, DirectLight, KelvinUtil, MeshRenderer, LitMaterial, VertexAttributeName, Time } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Stats } from "@orillusion/stats";
import { GUIUtil } from "@samples/utils/GUIUtil";

// An sample of dynamically updating a geometry vertex attribute
class Smaple_VertexAnimation {
    // This geometry will dynamically update its vertex data over time
    floorGeometry: PlaneGeometry;
    scene: Scene3D;
    async run() {

        await Engine3D.init({ beforeRender: () => this.update() });

        let view = new View3D();

        view.scene = new Scene3D();
        view.scene.addComponent(AtmosphericComponent);
        view.scene.addComponent(Stats);

        this.scene = view.scene;

        view.camera = CameraUtil.createCamera3DObject(view.scene, "camera");
        view.camera.perspective(60, Engine3D.aspect, 1, 2000);
        view.camera.object3D.addComponent(HoverCameraController).setCamera(35, -20, 150);

        Engine3D.startRenderView(view);

        this.createScene();
    }

    private createScene() {
        GUIHelp.init();
        // add light
        let lightObj3D = new Object3D();
        let directLight = lightObj3D.addComponent(DirectLight);
        directLight.intensity = 25;
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = true;
        lightObj3D.rotationX = 53.2;
        lightObj3D.rotationY = 220;
        lightObj3D.rotationZ = 5.58;
        GUIUtil.renderDirLight(directLight);

        this.scene.addChild(lightObj3D);

        // add floor
        this.floorGeometry = new PlaneGeometry(100, 100, 199, 199);

        let floor = new Object3D();
        let renderer = floor.addComponent(MeshRenderer);
        renderer.geometry = this.floorGeometry;
        renderer.material = new LitMaterial();
        renderer.castShadow = true;
        renderer.receiveShadow = true;
        this.scene.addChild(floor);
    }

    private update() {
        if (this.floorGeometry) {
            let posAttrData = this.floorGeometry.getAttribute(VertexAttributeName.position);

            // update its vertex data over time
            let timeOffset = Time.time;
            for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
                posAttrData.data[i * 3 + 1] = Math.sin(timeOffset * 0.01 + i * 0.25);
            }
            // position attr need to be upload
            this.floorGeometry.vertexBuffer.upload(VertexAttributeName.position, posAttrData);

            //update normals
            this.floorGeometry.computeNormals();
        }
    }
}

new Smaple_VertexAnimation().run();
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, VertexAttributeName, LitMaterial, MeshRenderer, Vector4 } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { SeaComponent, SeaMaterial } from "@orillusion/sea";

// An sample of custom vertex attribute of geometry
class Sample_Sea {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        await Engine3D.init();
        let view = new View3D();
        view.scene = new Scene3D();
        view.scene.addComponent(AtmosphericComponent);

        view.camera = CameraUtil.createCamera3DObject(view.scene);
        view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        view.camera.object3D.z = -15;
        view.camera.object3D.addComponent(HoverCameraController).setCamera(35, -20, 500);

        Engine3D.startRenderView(view);

        this.createScene(view.scene);
    }

    private async createScene(scene: Scene3D) {
        let sunObj = new Object3D();
        let sunLight = sunObj.addComponent(DirectLight);
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(65533);
        sunLight.castShadow = true;
        sunObj.transform.rotationX = 50;
        sunObj.transform.rotationY = 50;
        GUIUtil.renderDirLight(sunLight);
        scene.addChild(sunObj);

        let sea = new Object3D();
        let seaCom = sea.addComponent(SeaComponent);
        scene.addChild(sea);

        GUIHelp.addFolder("sea");
        // GUIHelp.add(seaCom.mat.iResolution, `x`);
        // GUIHelp.add(seaCom.mat.iResolution, `y`);
        // seaCom.mat.data
        // seaCom.mat.normalData

        GUIHelp.addColor(seaCom.mat, "sea_color");
        GUIHelp.addColor(seaCom.mat, "sea_base_color");
        GUIHelp.endFolder();
    }

}

new Sample_Sea().run();
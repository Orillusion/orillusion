import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { VertexAttributeName } from "../../src/core/geometry/VertexAttributeName";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_CustomGeometry {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.material.materialChannelDebug = true;

        await Engine3D.init();
        let view = new View3D();
        view.scene = new Scene3D();;
        view.camera = CameraUtil.createCamera3DObject(view.scene);

        view.scene.addComponent(AtmosphericComponent);

        view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        view.camera.object3D.z = -15;
        view.camera.object3D.addComponent(HoverCameraController);

        // 
        // 
        // Engine3D.startRenderView(view);
        Engine3D.startRenderViews([view]);
        this.createScene(view.scene);
    }

    private async createScene(scene: Scene3D) {
        let sunObj = new Object3D();
        let sunLight = sunObj.addComponent(DirectLight);
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(65533);
        sunLight.castShadow = true;
        sunObj.transform.rotationX = 50;
        sunObj.transform.rotationY = 50;
        sunLight.debug();
        scene.addChild(sunObj);

        let geo = new PlaneGeometry(100, 100, 100, 100);
        let att = geo.getAttribute(VertexAttributeName.position);
        let len = att.data.length / 3;

        let mat = new LitMaterial();
        // mat.shaderState.topology = GPUPrimitiveTopology.point_list

        let parent = new Object3D();
        let mr = parent.addComponent(MeshRenderer);
        mr.geometry = geo;
        mr.material = mat;

        for (let i = 0; i < len; i++) {
            att.data[i * 3 + 0];
            att.data[i * 3 + 1] += Math.random() * 100;
            att.data[i * 3 + 2];
        }
        scene.addChild(parent);
    }


}
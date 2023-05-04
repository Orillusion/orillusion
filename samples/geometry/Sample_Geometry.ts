import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { VertexAttributeName } from "../../src/core/geometry/VertexAttributeName";
import { PointerEvent3D } from "../../src/event/eventConst/PointerEvent3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_Geometry {
    view: View3D;
    floor: PlaneGeometry;
    async run() {
        Engine3D.setting.pick.mode = `pixel`
        await Engine3D.init({ beforeRender: () => this.update() });

        this.view = new View3D();
        this.view.scene = new Scene3D();
        this.view.scene.addComponent(AtmosphericComponent);

        this.view.camera = CameraUtil.createCamera3DObject(this.view.scene, "camera");
        this.view.camera.perspective(60, Engine3D.aspect, 1, 2000);
        let hov = this.view.camera.object3D.addComponent(HoverCameraController);
        hov.setCamera(5, -5, 150);

        Engine3D.startRenderView(this.view);

        this.createScene();
        this.initEvents();
    }

    private createScene() {
        let lightObj = new Object3D();
        let sunLight = lightObj.addComponent(DirectLight);
        sunLight.intensity = 25;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        sunLight.castShadow = true;
        sunLight.transform.rotationX = 50;
        sunLight.transform.rotationY = 50;
        this.view.scene.addChild(lightObj);

        this.floor = new PlaneGeometry(100, 100, 199, 199);
        let mat = new LitMaterial();

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = this.floor;
        mr.material = mat;
        this.view.scene.addChild(obj);
    }

    private initEvents() {
        Engine3D.inputSystem.addEventListener(PointerEvent3D.PICK_MOVE, (e) => this.onMove(e), this);
    }

    private onMove(e: PointerEvent3D) {
        let target = e.target;
        console.log(target);
    }

    private update() {
        if (this.floor) {
            let posVertexInfo = this.floor.getAttribute(VertexAttributeName.position);
            for (let i = 0; i < posVertexInfo.data.length / 3; i++) {
                posVertexInfo.data[i * 3 + 1] = Math.random() * 5;
            }
            this.floor.vertexBuffer.upload(VertexAttributeName.position, posVertexInfo);
        }
    }
}
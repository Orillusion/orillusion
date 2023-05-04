import { Engine3D } from "../@orillusion/core/Engine3D";
import { AtmosphericComponent } from "../@orillusion/core/components/AtmosphericComponent";
import { HoverCameraController } from "../@orillusion/core/components/controller/HoverCameraController";
import { DirectLight } from "../@orillusion/core/components/lights/DirectLight";
import { PostProcessingComponent } from "../@orillusion/core/components/post/PostProcessingComponent";
import { MeshRenderer } from "../@orillusion/core/components/renderer/MeshRenderer";
import { Scene3D } from "../@orillusion/core/core/Scene3D";
import { View3D } from "../@orillusion/core/core/View3D";
import { Object3D } from "../@orillusion/core/core/entities/Object3D";
import { LitMaterial } from "../@orillusion/core/materials/LitMaterial";
import { Color } from "../@orillusion/core/math/Color";
import { BoxGeometry } from "../@orillusion/core/shape/BoxGeometry";
import { CameraUtil } from "../@orillusion/core/util/CameraUtil";
import { KelvinUtil } from "../@orillusion/core/util/KelvinUtil";

export class Sample_Post {
    view: View3D;


    async run() {

        Engine3D.setting.shadow.shadowBound = 2048;
        Engine3D.setting.render.postProcessing.gtao.debug = true;
        Engine3D.setting.render.postProcessing.bloom.debug = true;
        Engine3D.setting.render.postProcessing.globalFog.debug = true;
        Engine3D.setting.render.postProcessing.ssr.debug = true;
        await Engine3D.init();


        this.view = new View3D();
        this.view.scene = new Scene3D();
        this.view.scene.addComponent(AtmosphericComponent);

        this.view.camera = CameraUtil.createCamera3DObject(this.view.scene, "camera");
        this.view.camera.perspective(60, Engine3D.aspect, 1, 2000.0);
        let hov = this.view.camera.object3D.addComponent(HoverCameraController);
        hov.setCamera(45, -45, 200)
        Engine3D.startRenderView(this.view);

        this.createScene();
    }

    createScene() {
        {
            let lightObj = new Object3D();
            lightObj.x = 0;
            lightObj.y = 0;
            lightObj.z = 0;
            lightObj.rotationX = 45;
            lightObj.rotationY = 0;
            lightObj.rotationZ = 0;
            let lc = lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 30;
            this.view.scene.addChild(lightObj);
        }

        let cube = new BoxGeometry(10, 15, 10);
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
                let box = new Object3D();
                let mr2 = box.addComponent(MeshRenderer);
                mr2.geometry = cube;

                if (Math.random() > 0.5) {
                    mr2.material = mat;
                } else {
                    let lightMat = new LitMaterial();
                    lightMat.emissiveMap = Engine3D.res.whiteTexture;
                    lightMat.emissiveColor = new Color(Math.random() * 3, Math.random() * 3, Math.random() * 3, 1);
                    lightMat.emissiveIntensity = 1;
                    mr2.material = lightMat;
                }
                mr2.castShadow = true;
                this.view.scene.addChild(box);

                box.transform.x = i * 40 - 200;
                box.transform.y = 5;
                box.transform.z = j * 40 - 200;
            }
        }

        let floor = new Object3D();
        let mr = floor.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(2000, 1, 2000);
        mr.material = mat;
        this.view.scene.addChild(floor);


        this.view.scene.addComponent(PostProcessingComponent);
    }
}
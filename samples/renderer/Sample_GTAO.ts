import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { SphereGeometry } from "../../src/shape/SphereGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";
import { Time } from "../../src/util/Time";

export class Sample_GTAO {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    constructor() { }

    async run() {
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        Engine3D.setting.material.materialChannelDebug = true;
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });



        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(100, -15, 40);
        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;


        Engine3D.startRenderView(view);

        //
        let data = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf');
        this.scene.addChild(data);
        data.scaleX = data.scaleY = data.scaleZ = 0.05;
    }

    /**
     * @ch asdasda
     * @en asdasdas
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 15;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 5;
            lc.needUpdateShadow = true;
            scene.addChild(this.lightObj);
        }
        this.createPlane(scene);
        return true;
    }

    private sphere: Object3D;

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.whiteTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 10.0, 0.0, 1);
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 0.1;
        mat.roughness_max = 0.1;
        mat.metallic = 0.0;

        {
            let debugGeo = new PlaneGeometry(1000, 1000);
            let obj: Object3D = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = debugGeo;
            scene.addChild(obj);
        }

        {
            let sphereGeometry = new SphereGeometry(5, 50, 50);
            let obj: Object3D = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = sphereGeometry;
            obj.x = 10;
            obj.y = 2;
            scene.addChild(obj);
            this.sphere = obj;
        }
    }

    private runBall: boolean = true;
    private loop(): void {
        if (this.sphere && this.runBall) {
            this.sphere.x = Math.sin(Time.time * 0.001) * 10;
            this.sphere.z = Math.cos(Time.time * 0.001) * 10;
        }
    }
}

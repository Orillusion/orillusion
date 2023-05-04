import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { PostProcessingComponent } from "../../src/components/post/PostProcessingComponent";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { SSRPost } from "../../src/gfx/renderJob/post/SSRPost";
import { LitMaterial } from "../../src/materials/LitMaterial";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { SphereGeometry } from "../../src/shape/SphereGeometry";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";
import { Time } from "../../src/util/Time";

export class Sample_SSR {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];

    constructor() {
    }

    async run() {
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.debug = false;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        Engine3D.setting.render.postProcessing.taa.debug = false;
        Engine3D.setting.render.postProcessing.gtao.debug = false;
        Engine3D.setting.render.postProcessing.bloom.debug = false;
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });



        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(180, -5, 60);
        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);

        let post = this.scene.addComponent(PostProcessingComponent);
        post.addPost(SSRPost);
    }

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
            lc.intensity = 27;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        // load external gltf
        let minimalObj = await Engine3D.res.loadGltf('PBR/ToyCar/ToyCar.gltf');
        minimalObj.scaleX = minimalObj.scaleY = minimalObj.scaleZ = 1000;
        scene.addChild(minimalObj);


        await this.createPlane(scene);
        return true;
    }


    private sphere: Object3D;

    private async createPlane(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 0.2;
        mat.roughness_max = 0.1;
        mat.metallic = 0.5;

        {
            let floorMaterial = new LitMaterial();
            floorMaterial.baseMap = Engine3D.res.grayTexture;
            floorMaterial.normalMap = Engine3D.res.normalTexture;
            floorMaterial.aoMap = Engine3D.res.whiteTexture;
            floorMaterial.emissiveMap = Engine3D.res.blackTexture;
            floorMaterial.roughness = 0.5;
            floorMaterial.roughness_max = 0.1;
            floorMaterial.metallic = 0.5;

            let planeGeometry = new PlaneGeometry(200, 200);
            let floor: Object3D = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.material = floorMaterial;
            mr.geometry = planeGeometry;
            scene.addChild(floor);
        }

        {
            let sphereGeometry = new SphereGeometry(10, 50, 50);
            let obj: Object3D = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = sphereGeometry;
            obj.x = 30;
            obj.y = 10;
            scene.addChild(obj);
            this.sphere = obj;
        }

        {
            let sphereGeometry = new SphereGeometry(2, 50, 50);
            for (let i = 0; i < 10; i += 2) {
                for (let j = 0; j < 10; j += 2) {

                    let rmMaterial = new LitMaterial();
                    rmMaterial.baseMap = Engine3D.res.grayTexture;
                    rmMaterial.normalMap = Engine3D.res.normalTexture;
                    rmMaterial.aoMap = Engine3D.res.whiteTexture;
                    rmMaterial.emissiveMap = Engine3D.res.blackTexture;
                    rmMaterial.roughness = j / 10;
                    rmMaterial.roughness_max = 1;
                    rmMaterial.metallic = i / 10;

                    let obj: Object3D = new Object3D();
                    let mr = obj.addComponent(MeshRenderer);
                    mr.material = rmMaterial;
                    mr.geometry = sphereGeometry;

                    obj.y = j * 5 + 10;
                    obj.x = 50;
                    obj.z = i * 5 - 25;
                    scene.addChild(obj);
                }
            }
        }
    }

    private loop(): void {
        if (this.sphere) {
            this.sphere.x = Math.sin(Time.time * 0.0001) * 30;
            this.sphere.z = Math.cos(Time.time * 0.0001) * 30;
        }
    }
}

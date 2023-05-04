import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { PointLight } from "../../src/components/lights/PointLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { Texture } from "../../src/gfx/graphics/webGpu/core/texture/Texture";
import { LambertMaterial } from "../../src/materials/LambertMaterial";
import { Color } from "../../src/math/Color";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { BitmapTexture2D } from "../../src/textures/BitmapTexture2D";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";
import { Object3DUtil } from "../../src/util/Object3DUtil";

export class Sample_LambertMaterial {
    lightObj: Object3D;
    scene: Scene3D;
    constructor() { }

    async run() {
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let hov = mainCamera.object3D.addComponent(HoverCameraController);
        hov.setCamera(45, -45, 50);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    /**
     * @ch initScene
     * @en initScene
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 46;
            this.lightObj.rotationY = 62;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 0.0;
            lc.debug();
            scene.addChild(this.lightObj);
        }
        let texture = new BitmapTexture2D();
        await texture.load('gltfs/Demonstration/T_Rollets_BC.jpg');
        this.createObject(scene, texture);

        {
            let po = new Object3D();
            let pl = po.addComponent(PointLight);
            this.scene.addChild(po);
            pl.range = 50;
            pl.transform.x = 0;
            pl.transform.y = 5;
            pl.transform.z = 0;
            pl.debug();
        }

        {
            let sphere = Object3DUtil.Sphere;
            sphere.scaleX = 1;
            sphere.scaleY = 1;
            sphere.scaleZ = 1;
            sphere.y = 2.5;
            this.scene.addChild(sphere);

        }
        return true;
    }

    private createObject(scene: Scene3D, texture: Texture): Object3D {
        let mat = new LambertMaterial();
        mat.baseMap = texture;
        mat.baseColor = new Color(1, 1, 1);
        // let sphereGeometry = OBJUtil.SphereMesh;
        let geometry = new PlaneGeometry(200, 200);
        let obj: Object3D = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.material = mat;
        mr.geometry = geometry;
        obj.y = 1;
        scene.addChild(obj);

        setTimeout(() => {
            // obj.removeFromParent();
        }, 4000);
        return obj;
    }

    private loop(): void { }
}

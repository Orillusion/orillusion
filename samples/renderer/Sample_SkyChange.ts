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
import { Color } from "../../src/math/Color";
import { BoxGeometry } from "../../src/shape/BoxGeometry";
import { HDRTextureCube } from "../../src/textures/HDRTextureCube";
import { SolidColorSky } from "../../src/textures/SolidColorSky";
import { CameraUtil } from "../../src/util/CameraUtil";
import { KelvinUtil } from "../../src/util/KelvinUtil";

export class Sample_SkyChange {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];

    constructor() { }

    async run() {

        Engine3D.setting.material.materialDebug = false;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 2;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.002;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });



        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 3000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, -45, 100);
        hoverCameraController.maxDistance = 1000;

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;


        Engine3D.startRenderView(view);
    }

    /**
     * @en Initialize the scene content
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            let sky_1 = await Engine3D.res.loadHDRTextureCube("hdri/1428_v5_low.hdr") as HDRTextureCube;
            let sky_2 = await Engine3D.res.loadHDRTextureCube("hdri/daytime.hdr") as HDRTextureCube;
            this.scene.envMap = sky_2;
            this.scene.exposure = 1.5;

            let colorSky = new SolidColorSky(new Color(1.0, 1.0, 1.0, 1.0));

            let skyList = [
                { tex: sky_1, exp: 0.28 },
                { tex: sky_2, exp: 1.0 },
                { tex: colorSky, exp: 1.0 },
            ];
        }
        {
            let root = await Engine3D.res.loadGltf('gltfs/CesiumMan/CesiumMan_compress.gltf');
            root.scaleX = 30;
            root.scaleY = 30;
            root.scaleZ = 30;

            let mrs = root.getComponentsInChild(MeshRenderer);
            mrs.forEach((v) => {
                v.material.debug();
            });
            // root.x -= 60;
            // root.z -= 10;
            // root.rotationX = -90;

            // scene.hideSky();
            scene.addChild(root);

            // for (let nLODLevel = 0; nLODLevel < 5; nLODLevel++) {
            //     let obj = root.getChildByName(`Minion_Lane_Super_Dawn_LOD${nLODLevel}`, true) as Object3D;
            //     obj.transform.x += 2 * nLODLevel;
            // }
        }

        {
            let mat = new LitMaterial();
            mat.roughness = 0.85;
            mat.metallic = 0.1;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            mr.material = mat;

            mat.debug();
            this.scene.addChild(floor);
        }

        this.scene.exposure = 1

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 2.1;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        return true;
    }

    loop() { }
}

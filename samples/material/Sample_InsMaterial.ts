import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, VirtualTexture, GPUTextureFormat, UnLitMaterial, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Graphic3DMesh } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

export class Sample_InsMaterial {
    lightObj3D: Object3D;
    scene: Scene3D;

    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 5;

        GUIHelp.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, 0, 120);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        GUIUtil.renderDebug();

        await this.initScene();
        sky.relativeTransform = this.lightObj3D.transform;
    }

    async initScene() {
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 21;
            this.lightObj3D.rotationY = 108;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = false;
            directLight.intensity = 10;
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }

        let texts = [];

        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_crow_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_crow_01_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_Diablo_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_Diablo_01_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_horse_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_horse_01_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_pentagram_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_pentagram_01_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_SCProtoss_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_SCTerran_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_SCZerg_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_shield_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_shield_01_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_skull_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_skull_01_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_skull_02.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_skull_02_alt_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_snake_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_WoWAlliance_01.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/ico/banner_basic_sigilMain_WoWHorde_01.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        let scale = 0.65;
        let geometry = new PlaneGeometry(3 * scale, 5 * scale, 1, 1, Vector3.Z_AXIS);
        {
            // let spaceX = 2.0;
            // let spaceY = 3.5;
            // let w = 100;
            // let h = 100;
            // for (let i = 0; i < w; i++) {
            //     for (let j = 0; j < h; j++) {
            //         //Create materials with different roughness and metallic
            //         //Create balls
            //         let ball = new Object3D();
            //         ball.transform.x = i * spaceX - w * spaceX * 0.5;
            //         ball.transform.y = h * spaceY * 0.5 - j * spaceY;
            //         let renderder = ball.addComponent(MeshRenderer);
            //         renderder.geometry = geometry;
            //         renderder.material = mat;

            //         //add ball into scene
            //         this.scene.addChild(ball);
            //     }
            // }
        }

        {
            Graphic3DMesh.draw(this.scene, geometry, bitmapTexture2DArray);
        }
    }
}

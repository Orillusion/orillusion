import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, BitmapTexture2D, IESProfiles, DirectLight, KelvinUtil, PointLight, Color, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, OutLinePass, RendererType } from "@orillusion/core";
import { CustomMaterialUnlit } from "@samples/renderer/materials/CustomMaterialUnlit";

export class Sample_OutLinePassMaterial {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;
    constructor() { }

    async run() {
        await Engine3D.init({});

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.shadow.shadowBound = 1000;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.pointShadowBias = 0.00002;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.render.postProcessing.gtao.debug = true;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        // Engine3D.engineSetting.Shadow.type = `PCF`;
        // Engine3D.engineSetting.Shadow.type = `SOFT`;
        Engine3D.setting.shadow.type = `HARD`;

        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            debug: false,
            blurX: 4,
            blurY: 4,
            intensity: 0.5,
            brightness: 1.25,
        };


        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 50000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(-60, -25, 1000);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        let iesTexture = await Engine3D.res.loadTexture("ies/ies_2.png") as BitmapTexture2D;
        var iesPofiles = new IESProfiles();
        iesPofiles.IESTexture = iesTexture;

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 96;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 12;
            lc.debug();
            this.scene.addChild(this.lightObj);

            let lightObj2 = new Object3D();
            lightObj2.rotationX = -96;
            lightObj2.rotationY = 110;
            lightObj2.rotationZ = 0;
            let lc2 = lightObj2.addComponent(DirectLight);
            lc2.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc2.castShadow = true;
            lc2.intensity = 2;
            lc2.debug();
            this.scene.addChild(lightObj2);

            for (let i = 0; i < 5; i++) {
                let po = new Object3D();
                let pl = po.addComponent(PointLight);
                pl.lightColor = Color.random();
                pl.intensity = 10;
                pl.range = 100;
                pl.castShadow = true;
                // pl.setIESPofileTexture(iesPofiles);
                po.x = Math.random() * 100 - 50;
                po.y = Math.random() * 50;
                po.z = Math.random() * 100 - 50;
                this.scene.addChild(po);
                pl.debug();
                pl.debugDraw(true);
            }
        }

        let ball: Object3D;
        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
            mat.emissiveMap = Engine3D.res.blackTexture;
            mat.roughness = 0.5;
            mat.metallic = 0.2;

            // let floor = OBJUtil.GetSingleCube(1000, 5, 1000, 1, 1, 1);
            // floor.getComponent(MeshRenderer).material = mat ;
            // this.scene.addChild(floor);
            let floor = new Object3D();
            let floorMr = floor.addComponent(MeshRenderer);
            floorMr.geometry = new BoxGeometry(1000, 5, 1000);
            floorMr.material = mat;
            this.scene.addChild(floor);

            ball = new Object3D();
            let mr = ball.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(6, 20, 20);
            mr.material = mat;
            mat.shaderState.acceptGI = true;
            this.scene.addChild(ball);
            ball.transform.x = -17;
            ball.transform.y = 34;
            ball.transform.z = 23;

            //wall
            let back_wall = new Object3D();
            let mr2 = back_wall.addComponent(MeshRenderer);
            mr2.geometry = new BoxGeometry(500, 500, 10);
            mr2.material = mat;
            back_wall.z = - 200;
            this.scene.addChild(back_wall);

            let front_wall = new Object3D();
            let mr3 = front_wall.addComponent(MeshRenderer);
            mr3.geometry = new BoxGeometry(500, 500, 10);
            mr3.material = mat;
            front_wall.z = 200;
            this.scene.addChild(front_wall);

            let left_wall = new Object3D();
            let mr4 = left_wall.addComponent(MeshRenderer);
            mr4.geometry = new BoxGeometry(10, 500, 500);
            mr4.material = mat;
            left_wall.x = - 200;
            this.scene.addChild(left_wall);

            {

                // let outlineMaterial = new LitMaterial();
                // outlineMaterial.baseMap = defaultTexture.whiteTexture ;
                // outlineMaterial.baseColor = new Color(0.3,0.3,0.3,1.0);

                //创建材质球
                let colorMat = new CustomMaterialUnlit();

                //创建一个outline pass
                let outLinePass = new OutLinePass(5);
                outLinePass.baseColor = new Color(1.0, 0.0, 0.0);
                colorMat.addPass(RendererType.COLOR, outLinePass, 0);

                let outLinePass2 = new OutLinePass(8);
                outLinePass2.baseColor = new Color(0.0, 1.0, 0.0);
                colorMat.addPass(RendererType.COLOR, outLinePass2, 0);

                let outLinePass3 = new OutLinePass(10);
                outLinePass3.baseColor = new Color(0.0, 0.0, 1.0);
                colorMat.addPass(RendererType.COLOR, outLinePass3, 0);

                let right_wall = new Object3D();
                let mr5 = right_wall.addComponent(MeshRenderer);
                mr5.geometry = new BoxGeometry(10, 500, 500);
                mr5.material = colorMat;
                right_wall.x = 200;
                this.scene.addChild(right_wall);
            }
        }

        let chair = (await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        chair.scaleX = chair.scaleY = chair.scaleZ = 60;
        chair.transform.y = 0;
        this.scene.addChild(chair);

        let Duck = (await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.15;
        Duck.transform.y = 0;
        Duck.transform.x = -16;
        Duck.transform.z = 36;
        this.scene.addChild(Duck);
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}

import { Object3D, Camera3D, Scene3D, HoverCameraController, AnimationCurve, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, BitmapTexture2D, IESProfiles, DirectLight, KelvinUtil, PointLight, Keyframe, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, Time } from "@orillusion/core";

export class Sample_AnimCurve {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;
    Duck: Object3D;
    animCurve1: AnimationCurve;
    animCurve2: AnimationCurve;
    animCurve3: AnimationCurve;
    animCurve4: AnimationCurve;
    constructor() { }

    async run() {
        await Engine3D.init({ beforeRender: () => this.renderUpdate() });

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.shadow.shadowBound = 1000;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.pointShadowBias = 0.6;
        Engine3D.setting.shadow.debug = true;

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
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(-60, -25, 500);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        let iesTexture = await Engine3D.res.loadTexture("ies/ies_2.png") as BitmapTexture2D;
        var iesProfiles = new IESProfiles();
        iesProfiles.IESTexture = iesTexture;

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 15;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 2;
            lc.debug();
            this.scene.addChild(this.lightObj);

            for (let i = 0; i < 1; i++) {
                let po = new Object3D();
                let pl = po.addComponent(PointLight);
                // pl.lightColor = Color.random() ;
                pl.intensity = 8;
                pl.range = 269;
                pl.castShadow = true;
                pl.realTimeShadow = true;
                po.x = -19;
                po.y = 67.72;
                po.z = 3;
                this.scene.addChild(po);
                pl.debug();
                pl.debugDraw(true);
            }

            this.animCurve1 = new AnimationCurve();
            this.animCurve1.addKeyFrame(new Keyframe(0, 1));
            this.animCurve1.addKeyFrame(new Keyframe(0.5, 2));
            this.animCurve1.addKeyFrame(new Keyframe(0.7, 2));
            this.animCurve1.addKeyFrame(new Keyframe(1.0, 1));

            this.animCurve2 = new AnimationCurve();
            this.animCurve2.addKeyFrame(new Keyframe(0, 0));
            this.animCurve2.addKeyFrame(new Keyframe(1, 360));


            this.animCurve3 = new AnimationCurve();
            this.animCurve3.addKeyFrame(new Keyframe(0, -5));
            this.animCurve3.addKeyFrame(new Keyframe(0.3, 3));
            this.animCurve3.addKeyFrame(new Keyframe(0.6, 8));
            this.animCurve3.addKeyFrame(new Keyframe(0.9, -2));
            this.animCurve3.addKeyFrame(new Keyframe(1.0, -5));

            this.animCurve4 = new AnimationCurve();
            this.animCurve4.addKeyFrame(new Keyframe(0, 1));
            this.animCurve4.addKeyFrame(new Keyframe(0.3, -9));
            this.animCurve4.addKeyFrame(new Keyframe(0.6, -2));
            this.animCurve4.addKeyFrame(new Keyframe(0.9, 2));
            this.animCurve4.addKeyFrame(new Keyframe(1.0, 1));

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

            let right_wall = new Object3D();
            let mr5 = right_wall.addComponent(MeshRenderer);
            mr5.geometry = new BoxGeometry(10, 500, 500);
            mr5.material = mat;
            right_wall.x = 200;
            this.scene.addChild(right_wall);
        }

        let chair = (await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        chair.scaleX = chair.scaleY = chair.scaleZ = 60;
        chair.transform.y = 0;
        this.scene.addChild(chair);

        this.Duck = (await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        this.Duck.scaleX = this.Duck.scaleY = this.Duck.scaleZ = 0.15;
        this.Duck.transform.y = 0;
        this.Duck.transform.x = -16;
        this.Duck.transform.z = 36;
        this.scene.addChild(this.Duck);
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() {
        // console.log("a");

        if (this.Duck) {
            this.Duck.y = this.animCurve1.getValue((Time.time % (1000) / 1000)) * 5;
            this.Duck.x = this.animCurve3.getValue((Time.time % (1000) / 1000)) * 5;
            this.Duck.z = this.animCurve4.getValue((Time.time % (1000) / 1000)) * 5;
            this.Duck.rotationY = this.animCurve2.getValue((Time.time % (1000) / 1000));
        }
    }
}
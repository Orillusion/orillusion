import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, KelvinUtil, MeshRenderer, LitMaterial, BlendMode, BoxGeometry, Color, PlaneGeometry } from "@orillusion/core";

export class Sample_RenderPassClean {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 0 } });

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.00197;
        Engine3D.setting.shadow.debug = true;
        this.scene = new Scene3D();

        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(25, -5, 100);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            this.scene.exposure = 1;
            this.scene.roughness = 0.56;
        }
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 57;
            this.lightObj.rotationY = 347;
            this.lightObj.rotationZ = 10;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 20;
            // lc.dirFix = -1 ; 
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        {
            let tex = await Engine3D.res.loadTexture("particle/T_Fx_Object_229.png");



            for (let i = 0; i < 25; i++) {
                let plane = new Object3D();
                let mr = plane.addComponent(MeshRenderer);
                let mat_1 = new LitMaterial();
                mat_1.doubleSide = true;
                mat_1.baseMap = tex;
                // if(Math.random() * 1.0 > 0.5){
                mat_1.blendMode = BlendMode.ALPHA;
                // }else{
                // mat_1.blendMode =BlendMode.NONE ;
                // }
                mr.material = mat_1;
                mr.geometry = new BoxGeometry(2, 2, 2);
                this.scene.addChild(plane);
                plane.x = Math.random() * 20 - 10;
                plane.y = 1;
                plane.z = Math.random() * 20 - 10;
            }

            // let mat_2 = new GlassMaterial();
            let mat_2 = new LitMaterial();
            mat_2.doubleSide = true;
            // mat_2.baseMap = tex; 
            // mat_2.blendMode = BlendMode.ALPHA ;
            mat_2.baseColor = new Color(1.0, 1.0, 1.0, 1);
            let plane2 = new Object3D();
            let mr2 = plane2.addComponent(MeshRenderer);
            mr2.material = mat_2;
            mr2.geometry = new PlaneGeometry(100, 100, 1, 1);
            // plane2.y = 250 * 0.1 + 10 ;
            this.scene.addChild(plane2);
        }
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}

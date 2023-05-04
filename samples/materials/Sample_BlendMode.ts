import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, CameraUtil, webGPUContext, View3D, AtmosphericComponent, DirectLight, KelvinUtil, UnLitMaterial, BlendMode, MeshRenderer, PlaneGeometry, LitMaterial, Color } from "@orillusion/core";
import { UVMoveComponents } from "./script/UVMoveComponents";

export class Sample_BlendMode {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 0 } });

        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 5,
            brightness: 0.629,
            debug: false
        };

        this.scene = new Scene3D();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(25, -5, 100);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        // 
        // 
        // 
        // let bloom =  as HDRBloomPost;
        // bloom.blurX = 4 ;
        // bloom.blurY = 4 ;
        // bloom.debug();


        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            this.scene.addComponent(AtmosphericComponent);
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
            lc.intensity = 6;
            // lc.dirFix = -1 ; 
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        // {
        let tex = await Engine3D.res.loadTexture("particle/T_Fx_Object_229.png");
        let mat = new UnLitMaterial();
        mat.baseMap = tex;
        mat.blendMode = BlendMode.ADD;

        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.material = mat;
        mr.geometry = new PlaneGeometry(100, 100, 1, 1);
        this.scene.addChild(plane);
        let mc = plane.addComponent(UVMoveComponents);

        let mat2 = new LitMaterial();
        mat2.doubleSide = true;
        mat2.baseColor = new Color(0.6, 0.3, 0.3, 1);
        let plane2 = new Object3D();
        let mr2 = plane2.addComponent(MeshRenderer);
        mr2.material = mat2;
        mr2.geometry = new PlaneGeometry(100, 100, 1, 1);
        plane2.y = -10;
        this.scene.addChild(plane2);
        // }
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}

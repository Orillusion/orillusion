import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, KelvinUtil, UnLitMaterial, MeshRenderer, PlaneGeometry } from "@orillusion/core";
import { UVMoveComponents } from "./script/UVMoveComponents";

export class Sample_UVMove {
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
            debug: true
        };

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(25, -5, 100);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        // 

        // 




        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            this.scene.exposure = 1;
            this.scene.roughness = 0.0;
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

        {
            let tex = await Engine3D.res.loadTexture("particle/T_Fx_Object_229.png");
            let mat = new UnLitMaterial();
            mat.baseMap = tex;

            let plane = new Object3D();
            let mr = plane.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = new PlaneGeometry(100, 100, 1, 1);
            this.scene.addChild(plane);

            let mc = plane.addComponent(UVMoveComponents);
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

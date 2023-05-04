import { Object3D, Camera3D, Scene3D, HoverCameraController, Engine3D, CameraUtil, webGPUContext, View3D, AtmosphericComponent, DirectLight, KelvinUtil, MeshRenderer, LitMaterial, BoxGeometry } from "@orillusion/core";

export class Sample_PBRMaterial {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    constructor() { }

    async run() {
        // await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 0 } });
        await Engine3D.init({ canvasConfig: { alpha: true, zIndex: 11, backgroundImage: '/logo/bg.webp' } });

        // Engine3D.engineSetting.Render.zPrePass = false; 
        Engine3D.setting.material.materialDebug = true;
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.00004;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            intensity: 1.6,
            brightness: 0.8,
            debug: true

        };

        this.scene = new Scene3D();
        this.scene.hideSky();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(-25, -5, 30);

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
            this.scene.addComponent(AtmosphericComponent);
        }
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 157.02;
            this.lightObj.rotationY = 287;
            this.lightObj.rotationZ = 10;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 50;
            // lc.dirFix = -1 ;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        {
            //SM_bench_wood_a
            let obj = (await Engine3D.res.loadGltf('gltfs/wukong/wukong.gltf', {})) as Object3D;
            let mrs = obj.getComponentsInChild(MeshRenderer);
            for (const mr of mrs) {
                let mat = mr.material;
                if (mat instanceof LitMaterial) {
                    mat.metallic = 1;
                    mat.roughness = 0.48;
                }
            }
            obj.transform.scaleX = 10;
            obj.transform.scaleY = 10;
            obj.transform.scaleZ = 10;
            obj.transform.y = -5;

            // let mrs = obj.getComponentsInChild(MeshRenderer);
            // for (let i = 0; i < mrs.length; i++) {
            //     const mr = mrs[i];
            //     mr.material.blendMode = BlendMode.NONE ;
            // }
            this.scene.addChild(obj);

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.material = new LitMaterial();
            mr.geometry = new BoxGeometry(100, 2, 100);
            floor.y = -6
            this.scene.addChild(floor);
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

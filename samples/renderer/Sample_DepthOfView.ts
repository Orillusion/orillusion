import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, PlaneGeometry, MeshRenderer, SphereGeometry, SSR_IS_Kernel, Time } from "@orillusion/core";

export class Sample_DepthOfView {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.debug = false;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        Engine3D.setting.render.postProcessing.depthOfView.near = 30
        Engine3D.setting.render.postProcessing.depthOfView.far = 200

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
    }

    /**
     * @ch asdasda
     * @en asdasdas
     * @param scene
     * @returns
     */
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

        let minimalObj = await Engine3D.res.loadGltf('PBR/ToyCar/ToyCar.gltf');
        minimalObj.scaleX = minimalObj.scaleY = minimalObj.scaleZ = 800;
        scene.addChild(minimalObj);


        this.createPlane(scene);
        return true;
    }


    private sphere: Object3D;

    private createPlane(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 0.2;
        mat.roughness_max = 0.5;
        mat.metallic = 0.5;

        {
            let debugGeo = new PlaneGeometry(200, 200);
            let obj: Object3D = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = debugGeo;
            scene.addChild(obj);
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
            let seeds = SSR_IS_Kernel.createSeeds();
            let sphereGeometry = new SphereGeometry(2, 50, 50);
            for (let i = 0; i < seeds.length; i++) {
                let pt = seeds[i];
                let obj: Object3D = new Object3D();
                let mr = obj.addComponent(MeshRenderer);
                mr.material = mat;
                mr.geometry = sphereGeometry;

                obj.y = pt.z;
                obj.x = pt.x;
                obj.z = pt.y;
                scene.addChild(obj);
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

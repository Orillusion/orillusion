import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, SSRPost, View3D, MeshRenderer, LitMaterial, DirectLight, KelvinUtil } from "@orillusion/core";
import { PointLightsScript } from "@samples/renderer/script/PointLightsScript";

/**
 * @root
 *
 */
export class Sample_BistroExterior {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;

    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.normalYFlip = true;
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.type = `HARD`;
        // Engine3D.engineSetting.Shadow.type = `PCF`;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.shadowBound = 150;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.render.postProcessing.ssr.pixelRatio = 1;
        Engine3D.setting.render.postProcessing.ssr.roughnessThreshold = 0.3;


        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        //offset
        let cameraParent = new Object3D();
        cameraParent.name = 'cameraParent';
        cameraParent.x = 1.4;
        cameraParent.y = 3.5;
        cameraParent.z = -7.6;
        this.scene.addChild(cameraParent);


        let cameraObj = new Object3D();
        cameraObj.name = `cameraObj`;
        let mainCamera = cameraObj.addComponent(Camera3D);
        cameraParent.addChild(cameraObj);


        mainCamera.perspective(60, webGPUContext.aspect, 1, 3500.0);
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(-45, -35, 50);

        await this.initScene(this.scene);

        let ssrPost = new SSRPost();
        ssrPost.fadeEdgeRatio = 1;
        ssrPost.rayMarchRatio = 0.27;
        ssrPost.fadeDistanceMin = 1333;
        ssrPost.fadeDistanceMax = 13361033;
        ssrPost.roughnessThreshold = 1;
        ssrPost.powDotRN = 0.2;
        // let ssaoPost = new SSAOPost();
        Engine3D.setting.render.postProcessing.ssao.radius = 0.018;
        Engine3D.setting.render.postProcessing.ssao.aoPower = 1;
        // let globalFog = new GlobalFog();
        // let hdrBloomPost = new HDRBloomPost();
        // renderJob.addPost(ssrPost);
        // 
        // renderJob.addPost(globalFog);
        // 
        // renderJob.addPost(hdrBloomPost);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    /**
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            //public\dt_scene\bistroInterior\BistroExterior.glb
            //gltf
            // let data = await Engine3D.res.loadGltf('dt_scene/bistroInterior/BistroExterior.glb');
            let liveScene = await Engine3D.res.loadGltf('dt_scene/bistroInterior/gltf/BistroExterior.gltf');
            scene.addChild(liveScene);

            liveScene.forChild((v) => {
                let mrs = (v as Object3D).getComponents(MeshRenderer);
                mrs.forEach((mr) => {
                    let mat = mr.material;
                    if (mat && mat instanceof LitMaterial) {
                        // mat.emissiveIntensity = 0;
                    }
                })
            });
        }

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
            lc.intensity = 8;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        /******** load hdr sky *******/

        //T_Panorama05_HDRI.HDR

        // let atom = scene.addComponent(AtmosphericComponent);
        // atom.exposure = 1.0;
        // atom.debug();
        /******** load hdr sky *******/

        // this.initProbe();
        return true;
    }

    applyLightAnim() {
        {
            for (let index = 0; index < 100; index++) {
                let light = this.scene.getChildByName('PointLight' + index);
            }
        }
    }

    applyRandomLight() {
        let obj = new Object3D();
        obj.addComponent(PointLightsScript);
        this.scene.addChild(obj);
    }

    loop() { }
}

import { PointLightsScript } from "samples/renderer/script/PointLightsScript";
import { Object3D, Scene3D, HoverCameraController, Engine3D, Camera3D, webGPUContext, SSRPost, GlobalFog, HDRBloomPost, View3D, DirectLight, AtmosphericComponent } from "@orillusion/core";

/**
 * @root
 *
 */
export class Sample_RenderList_Full {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    hoverCameraController: HoverCameraController;

    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = true;
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
        let globalFog = new GlobalFog();
        let hdrBloomPost = new HDRBloomPost();
        // renderJob.addPost(ssrPost);

        // renderJob.addPost(globalFog);

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
        {
            let data = await Engine3D.res.loadGltf('gltfs/Demonstration/Demonstration.gltf');
            scene.addChild(data);

            let lights = data.getComponentsInChild(DirectLight);
            if (lights.length > 0) {
                lights[0].transform.rotationX = 152;
                lights[0].transform.rotationY = 223;
                lights[0].transform.rotationY = 223;
                lights[0].intensity = 32;
            }
        }

        /******** load hdr sky *******/

        //T_Panorama05_HDRI.HDR
        // let envMap = await Engine3D.res.loadHDRTextureCube('hdri/1428_v5_low.hdr');
        // let envMap = await Engine3D.res.loadHDRTextureCube('hdri/T_Panorama05_HDRI.HDR');
        // scene.envMap = envMap;
        let atom = scene.addComponent(AtmosphericComponent);
        atom.exposure = 1.0;
        atom.debug();
        /******** load hdr sky *******/

        return true;
    }

    applyLightAnim() {
        {
            for (let index = 0; index < 100; index++) {
                let light = this.scene.getChildByName('PointLight' + index);
                if (light) {
                    let pointLight = light as Object3D;
                    // let shakeLightScript = pointLight.addComponent(ShakeLightScript);
                }
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

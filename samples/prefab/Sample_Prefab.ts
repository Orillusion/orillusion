import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Engine3D, Object3D, Scene3D, CameraUtil, HoverCameraController, View3D, AtmosphericComponent, DirectLight, KelvinUtil, PrefabMeshParser, LitMaterial, MeshRenderer, PostProcessingComponent, GTAOPost, HDRBloomPost, SSRPost, PrefabParser, AnimatorComponent } from "../../src";


export class Sample_Prefab {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        //config settings
        Engine3D.setting.render.debug = false;
        Engine3D.setting.shadow.shadowBound = 20;
        Engine3D.setting.shadow.shadowSize = 4096;
        Engine3D.setting.shadow.type = "SOFT";
        Engine3D.setting.render.postProcessing.bloom = {
            enable: true,
            blurX: 4,
            blurY: 4,
            luminosityThreshold: 0.8,
            strength: 0.86,
            exposure: 1,
            radius: 4,
            debug: false
        };

        await Engine3D.init({ canvasConfig: { alpha: true, zIndex: 11 } });

        GUIHelp.init(999);

        this.scene = new Scene3D();
        let camera = CameraUtil.createCamera3DObject(this.scene);
        // camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 0.1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(-25, -5, 30);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
        await this.initScene();

        let post = this.scene.addComponent(PostProcessingComponent);
        post.addPost(GTAOPost);
        // let bloom = post.addPost(HDRBloomPost);
        // GUIUtil.renderBloom(bloom);
        // post.addPost(SSRPost);
        // GUIUtil.renderDebug();
    }

    async initScene() {
        /******** sky *******/
        let sky: AtmosphericComponent;
        {
            sky = this.scene.addComponent(AtmosphericComponent);
            sky.enable = false;
        }
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 124;
            this.lightObj3D.rotationY = 327;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 65;
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
            sky.relativeTransform = this.lightObj3D.transform;
        }

        {
            let node = await Engine3D.res.load("prefab/room.o3d", PrefabParser) as Object3D;
            this.scene.addChild(node);
        }

        {
            let node = await Engine3D.res.load("prefab/nvhai.o3d", PrefabParser) as Object3D;
            let anim = node.getComponents(AnimatorComponent);
            GUIUtil.renderAnimator(anim[0]);
            this.scene.addChild(node);
        }


    }
}

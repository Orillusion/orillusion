import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Engine3D, Object3D, Scene3D, CameraUtil, HoverCameraController, View3D, AtmosphericComponent, DirectLight, KelvinUtil, PrefabMeshParser, LitMaterial, MeshRenderer, PostProcessingComponent, GTAOPost, SSRPost, PrefabParser, AnimatorComponent, BloomPost, FXAAPost, SphereGeometry, Material, LitSSSShader } from "../../src";
import { Stats } from "@orillusion/stats";


export class Sample_SSS {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        //config settings
        Engine3D.setting.render.debug = false;
        Engine3D.setting.shadow.shadowBound = 10;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.type = "SOFT";

        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 11 } });

        GUIHelp.init(999);

        this.scene = new Scene3D();
        this.scene.addComponent(Stats)
        let camera = CameraUtil.createCamera3DObject(this.scene);
        // camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 0.01, 200.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(-25, -5, 30);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();

        GUIUtil.renderDebug();
    }

    async initScene() {
        /******** sky *******/
        let sky: AtmosphericComponent;
        {
            sky = this.scene.addComponent(AtmosphericComponent);
            // sky.enable = false;
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

        // {
        //     let obj = new Object3D();
        //     let mr = obj.addComponent(MeshRenderer);

        //     let sp = new SphereGeometry(15, 25, 25);
        //     // let sp = new PlaneGeometry(10, 10, 1, 1);
        //     mr.geometry = sp;

        //     let mat = new Material();
        //     mat.shader = new LitSSSShader();
        //     mr.material = mat;

        //     this.scene.addChild(obj);
        // }

        {
            PrefabParser.useWebp = false;
            let node = await Engine3D.res.load("prefab/new/SK_MINA_JACK.o3d", PrefabParser) as Object3D;
            let anim = node.getComponents(AnimatorComponent);
            GUIUtil.renderAnimator(anim[0]);
            this.scene.addChild(node);
            GUIUtil.renderTransform(node.transform, true, "nvhai");
        }
    }
}
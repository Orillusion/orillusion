import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";
import { AtmosphericComponent, BoxGeometry, CameraUtil, DirectLight, Engine3D, GTAOPost, HoverCameraController, KelvinUtil, LitShader, Material, MeshRenderer, Object3D, PostProcessingComponent, PrefabParser, Scene3D, TAAPost, View3D } from "@orillusion/core";


export class Sample_Hair {
    lightObj3D: Object3D;
    scene: Scene3D;

    public async run() {
        //config settings
        Engine3D.setting.render.debug = false;
        Engine3D.setting.shadow.shadowBound = 20;
        Engine3D.setting.shadow.shadowSize = 4096;
        Engine3D.setting.shadow.type = "PCF";

        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 11 } });

        GUIHelp.init(999);

        this.scene = new Scene3D();
        this.scene.addComponent(Stats)
        let camera = CameraUtil.createCamera3DObject(this.scene);
        // camera.enableCSM = true;
        camera.perspective(60, Engine3D.aspect, 0.01, 200.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(-25, -5, 10);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
        let post = this.scene.addComponent(PostProcessingComponent);
        let gtAOPost = post.addPost(GTAOPost);
        // GUIUtil.renderGTAO(gtAOPost);
        let taa = post.addPost(TAAPost);

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
        {
            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            let mat = new Material();
            mat.shader = new LitShader();
            mr.material = mat;
            mr.geometry = new BoxGeometry(20, 1, 20);
            this.scene.addChild(obj);

            // let obj2 = new Object3D();
            // let mr2 = obj2.addComponent(MeshRenderer);
            // let mat2 = new Material();
            // mat2.shader = new LitShader();
            // mr2.material = mat2;
            // mr2.geometry = new BoxGeometry(5, 10, 5);
            // this.scene.addChild(obj2);
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

        // {
        //     PrefabParser.useWebp = false;
        //     let node = await Engine3D.res.load("prefab/new/hair.o3d", PrefabParser) as Object3D;
        //     this.scene.addChild(node);
        //     GUIUtil.renderTransform(node.transform, true, "hair");
        // }

        // {
        //     PrefabParser.useWebp = false;
        //     let node = await Engine3D.res.load("prefab/new/SK_MINA_HEAD.o3d", PrefabParser) as Object3D;
        //     this.scene.addChild(node);
        // }


        {
            PrefabParser.useWebp = false;
            // let node = await Engine3D.res.load("prefab/new/SK_MINA_body.o3d", PrefabParser) as Object3D;
            let node = await Engine3D.res.load("prefab/new/nvhai.o3d", PrefabParser) as Object3D;
            this.scene.addChild(node);
        }


    }
}

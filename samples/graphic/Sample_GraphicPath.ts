import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, VirtualTexture, GPUTextureFormat, UnLitMaterial, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Graphic3DMesh, Matrix4, Time, BlendMode, Color, PostProcessingComponent, BloomPost, TrailGeometry, AnimationCurve, Keyframe, AnimationCurveT, KeyframeT, DepthOfFieldPost, Quaternion, PingPong, Object3DUtil, GPUPrimitiveTopology } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";

export class Sample_GraphicPath {
    lightObj3D: Object3D;
    scene: Scene3D;
    parts: Object3D[];
    width: number;
    height: number;
    cafe: number = 47;
    frame: number = 16;
    view: View3D;

    colors: Color[];
    trail3ds: Object3D[][];

    constructor() { }

    async run() {

        Matrix4.maxCount = 300000;
        Matrix4.allocCount = 300000;

        await Engine3D.init({ beforeRender: () => this.update() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 5;

        this.colors = [];

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.enable = false;
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, 0, 120);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        GUIUtil.renderDebug();

        // let post = this.scene.addComponent(PostProcessingComponent);
        // let bloom = post.addPost(BloomPost);
        // bloom.bloomIntensity = 1.0
        // GUIUtil.renderBloom(bloom);

        await this.initScene();

        sky.relativeTransform = this.lightObj3D.transform;
    }

    async initScene() {
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 21;
            this.lightObj3D.rotationY = 108;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = false;
            directLight.intensity = 10;
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }


        let texts = [];
        // texts.push(await Engine3D.res.loadTexture("particle/fx_a_fragment_003.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/grid.jpg") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/frame.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/128/line_0001.PNG") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/128/line_0010.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/128/line_0013.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/128/line_0017.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        GUIHelp.add(this, "cafe", 0.0, 100.0);
        GUIHelp.add(this, "frame", 0.0, 100.0);
        {
            this.width = 1;
            this.height = 1;
            let mr = Graphic3DMesh.drawRibbon("trail", this.scene, bitmapTexture2DArray, 255, this.width * this.height);
            this.parts = mr.object3Ds;
            this.trail3ds = mr.ribbon3Ds;

            mr.material.blendMode = BlendMode.SOFT_ADD;
            mr.material.transparent = true;
            // mr.material.doubleSide = true;
            mr.material.depthWriteEnabled = false;
            // mr.material.useBillboard = true;

            for (let i = 0; i < this.width * this.height; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
                // mr.setTextureID(i, 0);
            }

            let c1 = new Color(0.65, 0.1, 0.2, 0.15);
            let c2 = new Color(1.0, 1.1, 0.2, 0.65);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
        }

        this.updateOnce(1000);
    }

    private tmpArray: any[] = [];
    update() {
    }

    updateOnce(engineFrame: number) {
        if (this.trail3ds && this.trail3ds.length > 0) {
            for (let i = 0; i < this.trail3ds.length; i++) {
                const trail3d = this.trail3ds[i];
                Vector3.HELP_0.x = Math.random() * 10 - 5;
                Vector3.HELP_0.y = Math.random() * 2 - 1;
                Vector3.HELP_0.z = Math.random() * 10 - 5;
                let offsetAngle = Math.random() * 360;
                for (let j = 0; j < trail3d.length; j++) {
                    let p = j / (trail3d.length - 1);
                    // trail3d[j].x = j * 0.1 + Math.cos(p * (trail3d.length / 10)) * 5;
                    // trail3d[j].y = Math.sin(p * (trail3d.length / 10)) * 5 + 10;
                    // trail3d[j].z = i * 10;

                    trail3d[j].x = Math.sin(p * (trail3d.length / 15) + offsetAngle) * p * 35 + Vector3.HELP_0.x;
                    trail3d[j].y = j * 0.2 + Vector3.HELP_0.y;
                    trail3d[j].z = Math.cos(p * (trail3d.length / 10) + offsetAngle) * p * 35 + Vector3.HELP_0.z;

                    // let obj = Object3DUtil.GetSingleSphere(0.1, 1, 0, 0);
                    // this.scene.addChild(obj);
                    // obj.transform.x = trail3d[j].x;
                    // obj.transform.y = trail3d[j].y;
                    // obj.transform.z = trail3d[j].z;
                }
            }
        }
    }

}

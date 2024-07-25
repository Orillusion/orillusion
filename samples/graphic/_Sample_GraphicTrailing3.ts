import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Vector3, Matrix4, BlendMode, Color, PostProcessingComponent, BloomPost } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";
import { Graphic3D } from "@orillusion/graphic";

export class Sample_GraphicTrailing3 {
    lightObj3D: Object3D;
    scene: Scene3D;
    parts: Object3D[];
    width: number;
    height: number;
    cafe: number = 47;
    frame: number = 16;
    view: View3D;
    graphic3D: Graphic3D;

    colors: Color[];
    trail3ds: Object3D[];

    constructor() { }

    async run() {

        Matrix4.maxCount = 500000;
        Matrix4.allocCount = 500000;

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

        this.graphic3D = new Graphic3D();
        this.scene.addChild(this.graphic3D);

        Engine3D.startRenderView(this.view);

        GUIUtil.renderDebug();

        let post = this.scene.addComponent(PostProcessingComponent);
        let bloom = post.addPost(BloomPost);
        bloom.bloomIntensity = 10.0
        GUIUtil.renderBloom(bloom);

        await this.initScene();
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
        // texts.push(await Engine3D.res.loadTexture("textures/frame.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/128/line_0010.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/128/line_0001.PNG") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/128/line_0013.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/128/line_0017.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        GUIHelp.add(this, "cafe", 0.0, 100.0);
        GUIHelp.add(this, "frame", 0.0, 100.0);
        {
            this.width = 10;
            this.height = 10;
            let mr = Graphic3DMesh.drawRibbon("trail", this.scene, bitmapTexture2DArray, 127, this.width * this.height);
            this.parts = mr.object3Ds;
            this.trail3ds = mr.object3Ds;

            mr.material.blendMode = BlendMode.ADD;
            // mr.material.transparent = true;
            mr.material.doubleSide = true;
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
                let dir = new Vector3(0, 1, 0);
                let lx = 10 * Math.random() + 10;
                let ly = 0.1 * Math.random() + 0.1;
                let lz = 10 * Math.random() + 10;
                let oy = 1 * Math.random() + 1;
                // for (let j = 0; j < trail3d.length; j++) {
                //     let p = j / (trail3d.length - 1);

                //     let q = Quaternion.HELP_0;
                //     q.fromEulerAngles(0, p * 360 * 4, 0);
                //     q.transformVector(Vector3.RIGHT, dir);

                //     trail3d[j].x = dir.x * lx * p;
                //     trail3d[j].y = j * ly + oy;
                //     trail3d[j].z = dir.z * lz * p;
                // }
            }
        }
    }

}

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, BlendMode, Color, Vector4, GeoJsonStruct, GeoJsonUtil, ShapeInfo, DynamicDrawStruct, Object3DUtil, PostProcessingComponent, GTAOPost } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { GrassNodeStruct, GrassRenderer } from "@orillusion/graphic";



export class Sample_GraphicGrass {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;
    colors: Color[];
    constructor() { }

    async run() {

        Matrix4.maxCount = 10000;
        Matrix4.allocCount = 10000;

        await Engine3D.init({ beforeRender: () => this.update() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 5;

        this.colors = [];

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);
        // sky.enable = false;
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, -60, 25);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        // GUIUtil.renderDebug();

        // let post = this.scene.addComponent(PostProcessingComponent);
        // let bloom = post.addPost(GTAOPost);
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
            directLight.intensity = 3;
            // GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }

        // let floor = Object3DUtil.GetSingleCube(3000, 1, 3000, 0.5, 0.5, 0.5);
        // floor.y = -1;
        // this.scene.addChild(floor);

        // let c1 = Object3DUtil.GetSingleCube(20, 20, 20, 0.85, 0.85, 0.85);
        // this.scene.addChild(c1);

        await this.addGrass(0);
        // await this.addGrass(1);
        // await this.addGrass(2);
        // await this.addGrass(3);
        // await this.addGrass(4);
    }

    private async addGrass(grassGroup: number) {
        let texts = [];
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/GrassRealistic.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture('terrain/test01/bitmap.png') as BitmapTexture2D);

        texts.push(await Engine3D.res.loadTexture("textures/line3.png") as BitmapTexture2D);

        // texts.push(await Engine3D.res.loadTexture("terrain/grass/single.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/single2.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/single3.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/GrassThick.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/GrassRealistic.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line4.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/grid.jpg") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/frame64.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line_001064.png") as BitmapTexture2D);
        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        {
            // Unable to fix error related to missing GrassRenderer
            // Leaving code as-is

            let mr = Graphic3DMesh.drawNode<GrassRenderer>(
                `path_geojson` + grassGroup,
                GrassRenderer,
                GrassNodeStruct,
                this.scene,
                bitmapTexture2DArray,
                10000,
                10000 * 2
            );
            let mat = mr.material as UnLitTexArrayMaterial;
            // mat.baseColor = new Color(0.2, 10.7, 0.56, 1.0);
            for (let i = 0; i < 1; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
            }

            let space = 50;
            for (const nodeInfo of mr.nodes) {
                let node = nodeInfo as GrassNodeStruct;
                node.grassWight = Math.random() * 1.0 + 1.0;
                node.grassHeigh = Math.random() * 15.0 + 2.5;
                node.grassRotation = Math.random() * 360;

                let radiu = Math.random() * space + Math.random() * space + Math.random() * space;
                let angle = Math.random() * 360;
                node.grassX = Math.sin(angle) * radiu;
                node.grassZ = Math.cos(angle) * radiu;
            }
            mr.updateShape();
            // Engine3D.views[0].graphic3D.drawFillCircle(`zero`, Vector3.ZERO, 0.5);
        }
    }

    update() {
        Engine3D.views[0].graphic3D.drawCameraFrustum(Engine3D.views[0].camera);
    }
}

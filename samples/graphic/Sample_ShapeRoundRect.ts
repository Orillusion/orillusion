import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, Color, Time, sin, MeshRenderer } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { EllipseShape3D, Shape3DPathComponent } from "@orillusion/graphic";
import { GUIShape3D } from "@samples/utils/GUIShape3D";

export class Sample_ShapeRoundRect {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;
    colors: Color[];

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
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(0, -80, 25);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

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
            this.scene.addChild(this.lightObj3D);
        }
        await this.addNode(0);
    }

    private async addNode(grassGroup: number) {
        let texts = [];
        // texts.push(await Engine3D.res.loadTexture("textures/line.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line2.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line3.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/single.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/single2.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/single3.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/GrassThick.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("terrain/grass/GrassRealistic.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line4.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/grid.jpg", null, true) as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/frame64.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line_001064.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/diffuse.jpg") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        {
            let path = Shape3DPathComponent.create(`path_` + grassGroup, bitmapTexture2DArray, this.scene);
            let mr = path.renderer;
            for (let i = 0; i < 1; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
            }

            let roundRect = path.roundRect(20, 15, 4);
            roundRect.lineWidth = 1;
            roundRect.radius = 3;
            roundRect.fill = true;
            roundRect.line = true;

            GUIShape3D.renderRoundRect(roundRect, 50, true);

        }
    }

    update() {
    }

}



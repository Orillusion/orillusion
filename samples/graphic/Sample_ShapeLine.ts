import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, Color, Time, sin, MeshRenderer, Vector2, LineJoin } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { EllipseShape3D, Shape3DPathComponent } from "@orillusion/graphic";
import { GUIShape3D } from "@samples/utils/GUIShape3D";
import { Shape3D } from "@orillusion/graphic/renderer/shape3d/Shape3D";

export class Sample_ShapeLine {
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

    private path: Shape3DPathComponent;
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

        this.path = Shape3DPathComponent.create(`path_` + grassGroup, bitmapTexture2DArray, this.scene);
        let mr = this.path.renderer;
        for (let i = 0; i < 1; i++) {
            mr.setTextureID(i, Math.floor(Math.random() * texts.length));
        }

        let line = this.createLine();
        let circle = this.createCircle();
        // let ellipse = this.createEllipse();

        this.setShapePos(circle, 0, 0, 0);
        this.setShapePos(line, 0, 0, 1);
        // this.setShapePos(ellipse, -10, -10, 2);
    }

    private setShapePos(shape: Shape3D, x: number, y: number, order: number) {
        let object3D = this.path.renderer.getShapeObject3D(shape);
        object3D.x = x;
        object3D.z = y;
        shape.shapeOrder = order;
    }

    private createLine(): Shape3D {
        let points: Vector2[] = [];
        points.push(new Vector2(-6, -2));
        points.push(new Vector2(-5, -5));
        points.push(new Vector2(6, -4));
        points.push(new Vector2(1, 9));
        points.push(new Vector2(-1, 4));
        points.push(new Vector2(-4, 3.5));

        let line = this.path.line(points);
        line.lineWidth = 1;
        line.lineJoin = LineJoin.bevel;
        line.corner = 3;
        line.fill = false;
        line.line = true;
        line.isClosed = false;

        GUIShape3D.renderLine(line, 5, false);
        return line;
    }

    private createCircle(): Shape3D {
        let circle = this.path.circle(4, 0, 0);
        circle.lineWidth = 0.5;
        circle.segment = 30;
        circle.fill = true;
        circle.line = true;

        GUIShape3D.renderCircle(circle, 50, false);
        return circle;
    }


    private createEllipse(): Shape3D {
        let ellipse = this.path.ellipse(10, 6, 0, 0, 0);
        ellipse.lineWidth = 1;
        ellipse.segment = 40;
        ellipse.fill = true;
        ellipse.line = true;

        GUIShape3D.renderEllipse(ellipse, 50);
        return ellipse;
    }

    update() {
    }

}



import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, Color, Time, sin, MeshRenderer, Vector2, LineJoin, Vector4 } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Shape3DPathComponent } from "@orillusion/graphic";
import { GUIShape3D } from "@samples/utils/GUIShape3D";
import { Shape3D } from "@orillusion/graphic/renderer/shape3d/Shape3D";

export class Sample_Shape3D {
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
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_0.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_1.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_2.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_3.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_4.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_5.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_6.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_7.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_8.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/digit/digit_9.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        this.path = Shape3DPathComponent.create(`path_` + grassGroup, bitmapTexture2DArray, this.scene);

        let line = this.createLine();
        let circle = this.createCircle();
        let line2 = this.createLine();
        let ellipse = this.createEllipse();
        let roundRect = this.createRoundRect();
        let rect = this.createRect();
        let curve = this.createCurve();
        let quadraticCurve = this.createQuadraticCurve();

        line.lineTextureID = 2;
        circle.lineTextureID = 2;
        ellipse.lineTextureID = 2;
        circle.lineTextureID = 2;

        rect.fillTextureID = 4;
        roundRect.fillTextureID = 4;
        curve.fillTextureID = 4;
        quadraticCurve.fillTextureID = 4;
        line2.fillTextureID = 4;

        let index: number = 0;

        this.setShapePos(index++, circle, 0, 0);
        this.setShapePos(index++, line, 10, 0);
        this.setShapePos(index++, ellipse, -10, -10);
        this.setShapePos(index++, roundRect, 10, 10);
        this.setShapePos(index++, rect, -25, -10);
        this.setShapePos(index++, line2, -10, 20);
        this.setShapePos(index++, curve, -10, 10);
        this.setShapePos(index++, quadraticCurve, -20, 0);
    }

    private setShapePos(order: number, shape: Shape3D, x: number, y: number) {
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
        line.lineJoin = LineJoin.round;
        line.corner = 6;
        line.fill = Math.random() > 0.5;
        line.line = !line.fill || Math.random() > 0.5;
        line.isClosed = true;

        line.lineColor = Color.randomRGB();
        line.uvSpeed = new Vector4(0, 0, 0, Math.random() - 0.5).multiplyScalar(0.05);
        GUIShape3D.renderLine(line, 5, false);
        return line;
    }

    private createCircle(): Shape3D {
        let circle = this.path.circle(5, 0, 0);
        circle.lineWidth = 1;
        circle.segment = 16;
        circle.fill = true;
        circle.line = true;
        circle.uvSpeed = new Vector4(0, 0, 0, Math.random() - 0.5).multiplyScalar(0.05);
        circle.fillColor = Color.randomRGB();

        GUIShape3D.renderCircle(circle, 50, false);
        return circle;
    }


    private createEllipse(): Shape3D {
        let ellipse = this.path.ellipse(10, 6, 0, 0, 0);
        ellipse.lineWidth = 0.4;
        ellipse.segment = 40;
        ellipse.fill = true;
        ellipse.line = true;
        ellipse.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05);
        ellipse.fillColor = Color.randomRGB();

        GUIShape3D.renderEllipse(ellipse, 50, false);
        return ellipse;
    }

    private createRoundRect(): Shape3D {
        let roundRect = this.path.roundRect(10, 6, 2);
        roundRect.lineWidth = 0.5;
        roundRect.cornerSegment = 8;
        roundRect.fill = true;
        roundRect.line = true;
        roundRect.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, 0).multiplyScalar(0.05);
        roundRect.fillColor = Color.randomRGB();

        GUIShape3D.renderRoundRect(roundRect, 50, false);
        return roundRect;
    }

    private createRect(): Shape3D {
        let rect = this.path.rect(5, 4);
        rect.lineWidth = 0.5;
        rect.fill = true;
        rect.line = true;
        rect.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, 0).multiplyScalar(0.05);
        rect.fillColor = Color.randomRGB();

        GUIShape3D.renderRoundRect(rect, 50, false);
        return rect;
    }


    private createCurve() {
        let curve = this.path.curve(0, 0, 5, 0, 3, 8, 10, 10);
        curve.lineWidth = 1;
        curve.fill = false;
        curve.line = true;
        curve.isClosed = false;
        curve.segment = 12;
        curve.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05);

        GUIShape3D.renderCurve(curve, 5, false);
        return curve;
    }

    createQuadraticCurve() {
        let curve = this.path.quadraticCurve(0, 0, 25, 0, 10, 10);
        curve.lineWidth = 1;
        curve.fill = true;
        curve.line = true;
        curve.isClosed = true;
        curve.segment = 16;
        curve.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.05);
        GUIShape3D.renderQuadraticCurve(curve, 5, false);
        return curve;
    }

    update() {
    }

}



import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, BitmapTexture2DArray, BitmapTexture2D, Matrix4, Color, Time, Vector2, Vector4, Object3DUtil, AxisObject } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Graphic3D, CircleShape3D, EllipseShape3D, Shape3DMaker, Shape3D, LineJoin } from "@orillusion/graphic";
import { GUIShape3D } from "@samples/utils/GUIShape3D";
import { GUIUtil } from "@samples/utils/GUIUtil";


/**
 * Sample of create various types of Shapes
 *
 * @export
 * @class Sample_Shape3D
 */
export class Sample_Shape3D {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;
    graphic3D: Graphic3D;

    async run() {

        Matrix4.maxCount = 10000;
        Matrix4.allocCount = 10000;

        await Engine3D.init({ beforeRender: () => this.update() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 5;

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(0, -40, 40);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        this.graphic3D = new Graphic3D();
        this.scene.addChild(this.graphic3D);

        Engine3D.startRenderView(this.view);

        await this.initScene();

        this.scene.addChild(new AxisObject(10))

        sky.relativeTransform = this.lightObj3D.transform;
    }

    async initScene() {
        {
            /******** light *******/
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 21;
            this.lightObj3D.rotationY = 108;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = false;
            directLight.intensity = 10;
            this.scene.addChild(this.lightObj3D);
            await this.addNode();
        }
        {
            let floor = Object3DUtil.GetSingleCube(100, 0.1, 100, 0.2, 0.2, 0.2);
            floor.y = -0.2;
            this.scene.addChild(floor)
        }

        {
            let sphere = Object3DUtil.GetSingleSphere(2, 0.4, 0.4, 0.4);
            this.scene.addChild(sphere);
            this.sphere = sphere;
        }
    }

    private maker: Shape3DMaker;
    private transformObj: Object3D;
    private sphere: Object3D;
    private async addNode() {
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

        this.maker = Shape3DMaker.makeRenderer(`path`, bitmapTexture2DArray, this.scene);
        this.maker.renderer.material.doubleSide = true;

        let line = this.createLine();
        let circle = this.createCircle();
        let line2 = this.createLine();
        let ellipse = this.createEllipse();
        let roundRect = this.createRoundRect();
        let rect = this.createRect();
        let curve = this.createCurve();
        let quadraticCurve = this.createQuadraticCurve();

        line.lineTextureID = 1;
        circle.lineTextureID = 2;
        ellipse.lineTextureID = 3;
        line.lineTextureID = 4;

        rect.fillTextureID = 6;
        roundRect.fillTextureID = 7;
        curve.fillTextureID = 8;
        quadraticCurve.fillTextureID = 9;
        line2.fillTextureID = 0;

        let index: number = 0;

        this.setShapePos(index++, circle, 0, 0);
        this.setShapePos(index++, line, 10, -5);
        this.setShapePos(index++, ellipse, -20, -20);
        this.setShapePos(index++, roundRect, 10, 10);
        this.setShapePos(index++, rect, -25, -10);
        this.setShapePos(index++, line2, 25, 0);
        this.setShapePos(index++, curve, -10, 10);
        this.setShapePos(index++, quadraticCurve, -20, 0);

        this.transformObj = this.maker.renderer.getShapeObject3D(ellipse);
        this.transformObj.rotationX = this.transformObj.rotationY = 30;
        GUIUtil.renderTransform(this.transformObj.transform);
    }

    private setShapePos(order: number, shape: Shape3D, x: number, y: number) {
        let object3D = this.maker.renderer.getShapeObject3D(shape);
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

        let line = this.maker.line(points);
        line.lineWidth = 1;
        line.lineJoin = LineJoin.miter;
        line.corner = 6;
        line.fill = Math.random() > 0.5;
        line.line = !line.fill || Math.random() > 0.5;
        line.isClosed = true;

        line.lineColor = Color.randomRGB();
        line.uvSpeed = new Vector4(0, 0, 0, Math.random() - 0.5).multiplyScalar(0.005);
        GUIShape3D.renderLine(line, 5, false);
        return line;
    }

    private createCircle(): CircleShape3D {
        let circle = this.maker.arc(5, 0, 0);
        circle.lineWidth = 1;
        circle.segment = 16;
        circle.fill = true;
        circle.line = true;
        circle.uvSpeed = new Vector4(0, 0, 0, Math.random() - 0.5).multiplyScalar(0.005);
        circle.fillColor = Color.randomRGB();

        circle.startAngle = 30;
        circle.endAngle = 240;

        GUIShape3D.renderCircle(circle, 50, false);
        return circle;
    }


    private createEllipse(): EllipseShape3D {
        let ellipse = this.maker.ellipse(10, 6, 0, 0, 0);
        ellipse.lineWidth = 2;
        ellipse.segment = 40;
        ellipse.fill = true;
        ellipse.line = true;
        ellipse.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, 0).multiplyScalar(0.05);
        ellipse.fillColor = Color.randomRGB();

        ellipse.startAngle = 60;
        ellipse.endAngle = 280;

        ellipse.lineUVRect = new Vector4(1, 1, 3, -0.3);
        GUIShape3D.renderEllipse(ellipse, 50, false);
        return ellipse;
    }

    private createRoundRect(): Shape3D {
        let roundRect = this.maker.roundRect(10, 6, 2);
        roundRect.lineWidth = 0.5;
        roundRect.cornerSegment = 8;
        roundRect.fill = true;
        roundRect.line = true;
        roundRect.uvSpeed = new Vector4(0, Math.random() - 0.5, Math.random() - 0.5, 0).multiplyScalar(0.05);
        roundRect.fillColor = Color.randomRGB();

        GUIShape3D.renderRoundRect(roundRect, 50, false);
        return roundRect;
    }

    private createRect(): Shape3D {
        let rect = this.maker.rect(5, 4);
        rect.lineWidth = 0.5;
        rect.fill = true;
        rect.line = true;
        rect.uvSpeed = new Vector4(0, 0, Math.random() - 0.5, 0).multiplyScalar(0.05);
        rect.fillColor = Color.randomRGB();

        GUIShape3D.renderRoundRect(rect, 50, false);
        return rect;
    }


    private createCurve() {
        let curve = this.maker.curve(10, 0, -15, 0, 3, 18, 10, 10);
        curve.lineWidth = 1;
        curve.fill = true;
        curve.line = true;
        curve.isClosed = false;
        curve.segment = 24;
        curve.uvSpeed = new Vector4(Math.random() - 0.5, 0, 0, Math.random() - 0.5).multiplyScalar(0.05);

        GUIShape3D.renderCurve(curve, 5, false);
        return curve;
    }

    createQuadraticCurve() {
        let curve = this.maker.quadraticCurve(0, 0, 25, 0, 10, 10);
        curve.lineWidth = 1;
        curve.fill = true;
        curve.line = true;
        curve.isClosed = true;
        curve.segment = 16;
        curve.uvSpeed = new Vector4(0, 0, 0, Math.random() - 0.5).multiplyScalar(0.05);
        GUIShape3D.renderQuadraticCurve(curve, 5, false);
        return curve;
    }

    update() {
        if (this.transformObj) {
            this.transformObj.rotationY += Time.delta * 0.05;
            this.transformObj.rotationZ += Time.delta * 0.01;
            this.transformObj.x = this.sphere.x = Math.sin(Time.time * 0.0001) * 20;
            this.transformObj.z = this.sphere.z = Math.cos(Time.time * 0.0001) * 20;
        }
    }

}



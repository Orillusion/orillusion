import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, Color, Time, sin, MeshRenderer, Vector2, OrderMap, Vector3 } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Shape3DMaker, Shape3D } from "@orillusion/graphic";
import { GUIShape3D } from "@samples/utils/GUIShape3D";

/**
 * Show adding and deleting individual Shapes, as well as changing render the order of individual Shapes
 *
 * @export
 * @class Sample_ShapeManyNode
 */
export class Sample_ShapeManyNode {
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

        camera.object3D.addComponent(HoverCameraController).setCamera(0, -80, 40);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        await this.initScene();

        sky.relativeTransform = this.lightObj3D.transform;
    }

    async initScene() {
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
        await this.addNode(0);
    }

    private async addNode(grassGroup: number) {
        let texts = [];

        texts.push(await Engine3D.res.loadTexture("textures/diffuse.jpg") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        this.maker = Shape3DMaker.makeRenderer(`path_` + grassGroup, bitmapTexture2DArray, this.scene);
        let mr = this.maker.renderer;
        for (let i = 0; i < 1; i++) {
            mr.setTextureID(i, Math.floor(Math.random() * texts.length));
        }

        let tileX: number = 10;
        let tileZ: number = 10;

        for (let i = 0; i < tileX; i++) {
            for (let j = 0; j < tileZ; j++) {
                let x = (i - tileX * 0.5) * 5;
                let y = (j - tileZ * 0.5) * 5;
                let circle = this.createShapeAt(x, y, i * tileX + j);
            }
        }

        this.bigShape = this.createBigShape(0, 0, 50);
        GUIShape3D.renderRoundRect(this.bigShape as any, 100, false);

        GUIHelp.addButton('removeShape', () => { this.removeShape(); })
        GUIHelp.addButton('createShape', () => { this.createShape(); })

        GUIHelp.addButton('decrease order', () => { this.decreaseShapeOrder(); })
        GUIHelp.addButton('increase order', () => { this.increaseShapeOrder(); })
        GUIHelp.open();
    }

    private removeShape() {
        if (this.usingShapes.size == 0)
            return;
        let randomIndex = Math.floor(this.usingShapes.keyList.length * Math.random());
        let shape = this.usingShapes.keyList[randomIndex];
        let obj = this.maker.renderer.getShapeObject3D(shape);
        this.usingShapes.delete(shape);
        this.removedShapePosition.push(new Vector3(obj.x, obj.z, shape.shapeIndex));
        this.maker.renderer.removeShape(shape.shapeIndex);
    }

    private decreaseShapeOrder() {
        this.bigShape.shapeOrder++;
    }

    private increaseShapeOrder() {
        this.bigShape.shapeOrder--;
    }

    private createShape() {
        if (this.removedShapePosition.length == 0)
            return;
        let pos = this.removedShapePosition.shift();
        this.createShapeAt(pos.x, pos.y, pos.z);
    }

    private createShapeAt(x: number, y: number, index: number): Shape3D {
        let circle = this.maker.arc(10, 0, 0);
        circle.lineWidth = 0.15;
        circle.segment = 30;
        circle.radius = 3;
        circle.fill = true;
        circle.line = true;
        circle.fillColor = Color.randomRGB();
        circle.fillUVRect.set(0, 0, 0.1, 0.1);
        circle.shapeOrder = index;
        let object3D = this.maker.renderer.getShapeObject3D(circle);
        object3D.x = x
        object3D.z = y;
        this.usingShapes.set(circle, Math.random() - 0.5);
        return circle;
    }

    usingShapes: OrderMap<Shape3D, number> = new OrderMap<Shape3D, number>(null, true, true);
    removedShapePosition: Vector3[] = [];
    maker: Shape3DMaker;
    bigShape: Shape3D;

    private createBigShape(x: number, y: number, index: number): Shape3D {
        let rect = this.maker.roundRect(10, 0, 0);
        rect.fillUVRect.set(0, 0, 0.1, 0.1);
        rect.lineWidth = 0.15;
        rect.cornerSegment = 10;
        rect.radius = 1;
        rect.width = 40;
        rect.height = 20;
        rect.fill = true;
        rect.line = true;
        rect.shapeOrder = index;
        return rect;
    }

    update() {
        for (let shape of this.usingShapes.keys()) {
            let speed = this.usingShapes.get(shape);
            let obj = this.maker.renderer.getShapeObject3D(shape);
            obj.rotationY = Time.time * speed * 0.1;
        }

    }

}

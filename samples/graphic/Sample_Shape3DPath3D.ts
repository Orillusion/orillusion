import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, BitmapTexture2DArray, BitmapTexture2D, Matrix4, Color, Vector4, Object3DUtil, AxisObject } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { Shape3DMaker, Shape3D, LineJoin } from "@orillusion/graphic";
import { GUIShape3D } from "@samples/utils/GUIShape3D";

/**
 * This example shows how to use Shape3D to draw various different paths in 3D space.
 *
 * @export
 * @class Sample_Shape3DPath3D
 */
export class Sample_Shape3DPath3D {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;

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

        camera.object3D.addComponent(HoverCameraController).setCamera(0, -60, 60);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        await this.initScene();

        this.scene.addChild(new AxisObject(10, 0.1))

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
    }

    private maker: Shape3DMaker;
    private async addNode() {
        let texts = [];
        texts.push(await Engine3D.res.loadTexture("textures/grid.jpg") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        this.maker = Shape3DMaker.makeRenderer(`path`, bitmapTexture2DArray, this.scene);
        this.maker.renderer.material.doubleSide = true;

        this.createPath();
    }


    private createPath(): Shape3D {

        let path = this.maker.path3D();
        path.lineWidth = 0.5;
        path.lineJoin = LineJoin.bevel;
        path.corner = 6;
        path.fill = false;
        path.line = true;
        path.isClosed = false;
        path.lineUVRect.z = 0.1;
        path.lineUVRect.w = 0.1;

        path.lineColor = Color.randomRGB();
        path.uvSpeed = new Vector4(0, 0, 0, Math.random() - 0.5).multiplyScalar(0.005);

        path.moveTo(0, 0);
        path.moveTo(5, 2);
        path.lineTo(5, 10, 5);
        path.lineTo(10, 15);
        path.moveTo(20, 0);
        path.lineTo(20, 20);
        path.closePath();

        path.quadraticCurveTo(-10, 25, 20, 15, 28, 0, 18);

        path.ellipse(30, 16, 5, 10, 45, 0, 360);

        path.roundRect(30, 40, 20, 10, 6, 4);

        let sphereF = Object3DUtil.GetSingleSphere(0.2, 1, 0, 0);
        sphereF.x = 10;
        sphereF.z = 4;
        this.scene.addChild(sphereF);

        let sphereCtrl = Object3DUtil.GetSingleSphere(0.2, 0, 1, 0);
        sphereCtrl.x = 2;
        sphereCtrl.z = 10;
        this.scene.addChild(sphereCtrl);

        let sphereT = Object3DUtil.GetSingleSphere(0.2, 0, 0, 1);
        sphereT.x = 15;
        sphereT.z = 10;
        this.scene.addChild(sphereT);

        path.moveTo(sphereF.x, sphereF.z);
        path.arcTo(sphereCtrl.x, sphereCtrl.z, sphereT.x, sphereT.z, 4, 12);

        GUIShape3D.renderLine(path, 5, false);
        return path;
    }

    update() {
    }

}



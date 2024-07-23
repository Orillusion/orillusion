import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Matrix4, Time, BlendMode, Color } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";
import { Graphic3D, Graphic3DMesh } from "@orillusion/graphic";

export class Sample_GraphicMesh_5 {
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

        await this.initScene();
    }

    async initScene() {
        let texts = [];
        texts.push(await Engine3D.res.loadTexture("textures/128/star_0035.png") as BitmapTexture2D);
        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        GUIHelp.add(this, "cafe", 0.0, 100.0);
        GUIHelp.add(this, "frame", 0.0, 100.0);
        {
            this.width = 100;
            this.height = 100;
            let geometry = new PlaneGeometry(1, 1, 1, 1, Vector3.Z_AXIS);
            let mr = Graphic3DMesh.draw(this.scene, geometry, bitmapTexture2DArray, this.width * this.height);
            this.parts = mr.object3Ds;

            mr.material.blendMode = BlendMode.ADD;
            mr.material.transparent = true;
            mr.material.depthWriteEnabled = false;
            mr.material.useBillboard = true;

            for (let i = 0; i < this.width * this.height; i++) {
                const element = this.parts[i];
                mr.setTextureID(i, 39);
                element.transform.scaleX = 2;
                element.transform.scaleY = 2;
                element.transform.scaleZ = 2;
            }

            let c1 = new Color(0.65, 0.1, 0.2, 0.15);
            let c2 = new Color(1.0, 1.1, 0.2, 0.65);
            this.colors.push(c1);
            this.colors.push(c2);
        }
    }

    private tmpArray: any[] = [];
    update() {
        if (this.parts) {
            let pos = new Vector3();
            this.tmpArray.length = 0;
            for (let i = 0; i < this.parts.length; i++) {
                const element = this.parts[i];

                let tmp = this.sphericalFibonacci(i, this.parts.length);
                let sc = Math.sin((i + Time.frame * 0.01 * this.frame * 0.01)) * this.cafe
                tmp.scaleBy(sc);

                element.transform.localPosition = tmp;

                if (sc > this.cafe * 0.85) {
                    this.tmpArray.push(element);
                }
            }

            for (let i = 0; i < this.tmpArray.length - 1; i++) {
                this.graphic3D.Clear(i.toString());
                this.graphic3D.drawLines(i.toString(), [
                    this.tmpArray[i].transform.worldPosition,
                    this.tmpArray[i + 1].transform.worldPosition,
                ],
                    this.colors);
            }
        }
    }

    private wave(i: number, pos: Vector3) {
        let x = Math.floor(i / this.width);
        let z = i % this.height;
        pos.set(x, 0, z);
        pos.y = Math.sin((x + Time.frame * 0.01) / 8) * 15 * Math.cos((z + Time.frame * 0.01) / 15);
    }

    public madfrac(A: number, B: number): number {
        return A * B - Math.floor(A * B);
    }

    public sphericalFibonacci(i: number, n: number): Vector3 {
        const PHI = Math.sqrt(5.0) * 0.5 + 0.5;
        let phi = 2.0 * Math.PI * this.madfrac(i, PHI - 1);
        let cosTheta = 1.0 - (2.0 * i + 1.0) * (1.0 / n);
        let sinTheta = Math.sqrt(Math.max(Math.min(1.0 - cosTheta * cosTheta, 1.0), 0.0));

        return new Vector3(
            Math.cos(phi) * sinTheta,
            Math.sin(phi) * sinTheta,
            cosTheta);

    }

}

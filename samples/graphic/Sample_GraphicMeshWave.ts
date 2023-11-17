import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Graphic3DMesh, Matrix4, Time, BlendMode, PrefabParser } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";

export class Sample_GraphicMeshWave {
    lightObj3D: Object3D;
    scene: Scene3D;
    parts: Object3D[];
    width: number;
    height: number;
    cafe: number = 47;
    frame: number = 16;

    constructor() { }

    async run() {

        Matrix4.maxCount = 500000;
        Matrix4.allocCount = 500000;

        await Engine3D.init({ beforeRender: () => this.update() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 5;



        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);
        sky.enable = false;
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, 0, 120);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        GUIUtil.renderDebug();

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

        texts.push(await Engine3D.res.loadTexture("textures/128/star_0031.png") as BitmapTexture2D);

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
            // let geometry = new BoxGeometry(1, 1, 1);
            let geometry = new PlaneGeometry(1, 1, 1, 1, Vector3.Z_AXIS);
            let mr = Graphic3DMesh.draw(this.scene, geometry, bitmapTexture2DArray, this.width * this.height);
            this.parts = mr.object3Ds;

            mr.material.blendMode = BlendMode.ADD;
            mr.material.transparent = true;
            mr.material.depthWriteEnabled = false;
            mr.material.useBillboard = true;

            for (let i = 0; i < this.width * this.height; i++) {
                const element = this.parts[i];
                // mr.setTextureID(i, i % texts.length);
                // mr.setTextureID(i, 52);
                // mr.setTextureID(i, 35);
                mr.setTextureID(i, 0);
                // mr.setTextureID(i, 18);

                let size = 1.0;
                element.transform.scaleX = size;
                element.transform.scaleY = size;
                element.transform.scaleZ = size;
            }
        }
    }

    update() {
        if (this.parts) {
            let pos = new Vector3();
            for (let i = 0; i < this.parts.length; i++) {
                const element = this.parts[i];

                this.wave(i, pos);

                element.transform.localPosition = pos;
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

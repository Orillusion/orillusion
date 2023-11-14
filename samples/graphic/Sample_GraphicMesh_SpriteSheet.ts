import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, VirtualTexture, GPUTextureFormat, UnLitMaterial, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Graphic3DMesh, Matrix4, Time, BlendMode, Color, PostProcessingComponent, BloomPost, ColorUtil, Graphic3DMeshRenderer, UV } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";

export class Sample_GraphicMesh_SpriteSheet {
    private lightObj3D: Object3D;
    private scene: Scene3D;
    private parts: Object3D[];
    private width: number;
    private height: number;
    private cafe: number = 47;
    private frame: number = 16;
    private view: View3D;
    private colors: Color[];
    private tmpArray: any[] = [];

    private color1: Color;
    private color2: Color;
    graphicMeshRenderer: Graphic3DMeshRenderer;

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

        Engine3D.startRenderView(this.view);

        GUIUtil.renderDebug();

        let post = this.scene.addComponent(PostProcessingComponent);
        let bloom = post.addPost(BloomPost);
        bloom.bloomIntensity = 10.0
        GUIUtil.renderBloom(bloom);

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

        // texts.push(await Engine3D.res.loadTexture("textures/spriteSheet/sequence_0031.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/spriteSheet/sequence_0050.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/spriteSheet/sequence_0036.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/spriteSheet/sequence_0053.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/spriteSheet/sequence_0041.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/spriteSheet/sequence_0040.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        GUIHelp.add(this, "cafe", 0.0, 100.0);
        GUIHelp.add(this, "frame", 0.0, 100.0);
        {
            this.width = 15;
            this.height = 15;
            let geometry = new PlaneGeometry(1, 1, 1, 1, Vector3.Z_AXIS);
            this.graphicMeshRenderer = Graphic3DMesh.draw(this.scene, geometry, bitmapTexture2DArray, this.width * this.height);
            this.parts = this.graphicMeshRenderer.object3Ds;

            this.graphicMeshRenderer.material.blendMode = BlendMode.ADD;
            this.graphicMeshRenderer.material.transparent = true;
            this.graphicMeshRenderer.material.depthWriteEnabled = false;
            this.graphicMeshRenderer.material.useBillboard = true;

            for (let i = 0; i < this.width * this.height; i++) {
                const element = this.parts[i];
                this.graphicMeshRenderer.setTextureID(i, 0);
                element.transform.scaleX = 5.5;
                element.transform.scaleY = 5.5;
                element.transform.scaleZ = 5.5;
            }

            this.color1 = new Color(1.5, 0.1, 0.2, 1.0);
            this.color2 = new Color(0.1, 0.1, 4.5, 1.0);
            let c2 = new Color(1.0, 1.1, 0.2, 0.45);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
            this.colors.push(c2);
        }

        this.updateOnce(1000);
    }

    update() {
        this.updateOnce(Time.frame);
    }

    updateOnce(engineFrame: number) {
        if (this.parts) {
            this.tmpArray.length = 0;
            let len = this.parts.length;
            for (let i = 0; i < len; i++) {
                const element = this.parts[i];
                let tmp = this.sphericalFibonacci(i, len);
                tmp.scaleBy(this.cafe);
                element.transform.localPosition = tmp;
                this.tmpArray.push(element);

                // let c = Color.lerp(Math.sin(engineFrame * 0.001 + (i / len)), this.color1, this.color2, Color.COLOR_0);
                // this.graphicMeshRenderer.setBaseColor(i, c);
                this.graphicMeshRenderer.setUVRect(i, UV.getUVSheet((i / len) * 100 + engineFrame * 0.08, 3, 3));
            }

            for (let i = 0; i < this.tmpArray.length - 1; i++) {
                this.view.graphic3D.Clear(i.toString());
                this.view.graphic3D.drawLines(i.toString(), [
                    Vector3.ZERO,
                    this.tmpArray[i + 1].transform.worldPosition,
                ],
                    this.colors);
            }
        }
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

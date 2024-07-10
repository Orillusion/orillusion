import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, BlendMode, Color, Vector4, LineJoin, GeoJsonStruct, GeoJsonUtil, ShapeInfo } from "@orillusion/core";
import { Stats } from "@orillusion/stats";

export class _Sample_GraphicShape {
    lightObj3D: Object3D;
    scene: Scene3D;
    parts: Object3D[];
    width: number;
    height: number;
    cafe: number = 47;
    frame: number = 16;
    view: View3D;

    colors: Color[];
    trail3ds: Object3D[][];

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
        sky.enable = false;
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, -60, 25);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        // GUIUtil.renderDebug();

        // let post = this.scene.addComponent(PostProcessingComponent);
        // let bloom = post.addPost(BloomPost);
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
            directLight.intensity = 10;
            // GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }

        // let geoJsonData = await Engine3D.res.loadJSON("gis/geojson/pudong.geoJson") as GeoJsonStruct;
        let geoJsonData = await Engine3D.res.loadJSON("gis/geojson/100000.geoJson") as GeoJsonStruct;

        let texts = [];
        // texts.push(await Engine3D.res.loadTexture("textures/line.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line2.png") as BitmapTexture2D);
        texts.push(await Engine3D.res.loadTexture("textures/line3.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line4.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/grid.jpg") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/frame64.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line_001064.png") as BitmapTexture2D);



        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";
        mat.blendMode = BlendMode.SOFT_ADD;

        let mat4 = new Matrix4();
        mat4.rawData.set([]);

        GUIHelp.add(this, "cafe", 0.0, 100.0);
        GUIHelp.add(this, "frame", 0.0, 100.0);
        {
            this.width = 1;
            this.height = 1;

            let neg = true;

            let lineArray = GeoJsonUtil.getPath(geoJsonData);
            let mr = Graphic3DMesh.drawShape(`path_geojson`, this.scene, bitmapTexture2DArray);
            for (let i = 0; i < this.width * this.height; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
            }

            // for (let ii = 0; ii < 1; ii++) {
            for (let ii = 0; ii < lineArray.length; ii++) {
                this.parts = mr.object3Ds;

                let shapeInfo = new ShapeInfo();
                shapeInfo.shapeType = 3;
                shapeInfo.lineJoin = LineJoin.bevel;
                shapeInfo.width = 0.25;
                shapeInfo.uScale = 1;
                shapeInfo.vScale = 10;
                shapeInfo.uSpeed = 0;
                shapeInfo.vSpeed = 6;
                mr.setShape(ii, shapeInfo);
                let tmp = [];
                for (let i = 0; i < lineArray[ii].length; i++) {
                    let p = lineArray[ii][i];
                    let newPos = new Vector4();
                    newPos.set(p.x - 121, p.y, p.z - 31, 0.0);
                    tmp.push(newPos);
                    newPos.multiplyScalar(25);
                    mr.shapes[ii].paths.push(newPos);
                }

                // mr.shapes[ii].paths.push(new Vector4(0.0, 0.0, 0.0));
                // mr.shapes[ii].paths.push(new Vector4(1.0, 0.0, 0.0));
                // mr.shapes[ii].paths.push(new Vector4(2.0, 0.0, 5.0));
                // mr.shapes[ii].paths.push(new Vector4(4.0, 0.0, 2.0));
                // mr.shapes[ii].paths.push(new Vector4(8.0, 0.0, 2.0));
                // mr.shapes[ii].paths.push(new Vector4(10.0, 0.0, 5.0));
                console.log(`path${ii}`, tmp.length);
                // Engine3D.views[0].graphic3D.drawLines(`path${ii}`, tmp);
            }
            mr.updateShape();
            // Engine3D.views[0].graphic3D.drawFillCircle(`zero`, Vector3.ZERO, 0.5);

        }
    }

    update() {
    }
}

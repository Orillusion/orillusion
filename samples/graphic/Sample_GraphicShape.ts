import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, VirtualTexture, GPUTextureFormat, UnLitMaterial, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Graphic3DMesh, Matrix4, Time, BlendMode, Color, PostProcessingComponent, BloomPost, TrailGeometry, AnimationCurve, Keyframe, AnimationCurveT, KeyframeT, DepthOfFieldPost, Quaternion, PingPong, Object3DUtil, GPUPrimitiveTopology, Float32ArrayUtil, Vector4 } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";

export class Sample_GraphicShape {
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

        Matrix4.maxCount = 300000;
        Matrix4.allocCount = 300000;

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


        let texts = [];
        texts.push(await Engine3D.res.loadTexture("textures/frame64.png") as BitmapTexture2D);
        // texts.push(await Engine3D.res.loadTexture("textures/line_001064.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        GUIHelp.add(this, "cafe", 0.0, 100.0);
        GUIHelp.add(this, "frame", 0.0, 100.0);
        {
            this.width = 1;
            this.height = 1;
            let mr = Graphic3DMesh.drawShape("s1", this.scene, bitmapTexture2DArray);
            this.parts = mr.object3Ds;
            mr.material.blendMode = BlendMode.SOFT_ADD;
            for (let i = 0; i < this.width * this.height; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
            }

            mr.shapes[0].shapeType = 3;
            mr.shapes[0].pathCount = 4;
            mr.shapes[0].width = 0.5;
            mr.shapes[0].vSpeed = 10;

            let neg = false;
            if (neg) {
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 0, new Vector4(0, 0, -10, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 1, new Vector4(0, 0, 0, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 2, new Vector4(10, 0, -10, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 3, new Vector4(10, 0, 10, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 4, new Vector4(10, 0, -20, 0));
            } else {
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 0, new Vector4(10, 0, -10, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 1, new Vector4(0, 0, 0, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 2, new Vector4(0, 0, -10, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 3, new Vector4(10, 0, 10, 0));
                Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, 4, new Vector4(-10, 0, 20, 0));
            }

            // let pos = Vector4.ZERO;
            // let space = 15;
            // for (let i = 0; i < mr.shapes[0].pathCount + 1; i++) {
            //     let newPos = new Vector4();
            //     newPos.x = pos.x + Math.random() * space + Math.random() * space - space * 0.5;
            //     newPos.y = pos.y + 0;
            //     newPos.z = pos.z + Math.random() * space + Math.random() * space - space * 0.5;
            //     pos.copyFrom(newPos);
            //     Float32ArrayUtil.wirteVec4(mr.shapes[0].paths, i, newPos);
            // }
            mr.updateShape(0, mr.shapes[0]);
        }
    }

    update() {
    }
}

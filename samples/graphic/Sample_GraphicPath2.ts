import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, SphereGeometry, VirtualTexture, GPUTextureFormat, UnLitMaterial, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, PlaneGeometry, Vector3, Graphic3DMesh, Matrix4, Time, BlendMode, Color, PostProcessingComponent, BloomPost, TrailGeometry, AnimationCurve, Keyframe, AnimationCurveT, KeyframeT, DepthOfFieldPost, Quaternion, PingPong, Object3DUtil, GPUPrimitiveTopology, RibbonStruct } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { Stats } from "@orillusion/stats";

export class Sample_GraphicPath2 {
    lightObj3D: Object3D;
    scene: Scene3D;
    parts: Object3D[];
    width: number;
    height: number;
    cafe: number = 47;
    frame: number = 16;
    view: View3D;

    colors: Color[];
    cubeArray: Object3D[];
    ribbons: RibbonStruct[];

    constructor() { }

    async run() {

        Matrix4.maxCount = 300000;
        Matrix4.allocCount = 300000;

        await Engine3D.init({ beforeRender: () => this.update() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 80;

        this.colors = [];

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);
        // sky.enable = false;
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 1000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(30, 0, 35);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        GUIUtil.renderDebug();

        let post = this.scene.addComponent(PostProcessingComponent);
        let bloom = post.addPost(BloomPost);
        bloom.bloomIntensity = 1.0
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
            directLight.castShadow = true;
            directLight.intensity = 10;
            GUIUtil.renderDirLight(directLight);
            this.scene.addChild(this.lightObj3D);
        }
        {
            let floorObj = Object3DUtil.GetCube();
            floorObj.scaleX = 500;
            floorObj.scaleY = 0.1;
            floorObj.scaleZ = 500;
            this.scene.addChild(floorObj);

            let o1 = Object3DUtil.GetCube();
            o1.x = 10;
            o1.y = 0.5;
            o1.z = 0;
            this.scene.addChild(o1);

            let o2 = Object3DUtil.GetCube();
            o2.x = 10;
            o2.y = 0.5;
            o2.z = 5;
            this.scene.addChild(o2);

            let o3 = Object3DUtil.GetCube();
            o3.x = 20;
            o3.y = 0.5;
            o3.z = 5;
            this.scene.addChild(o3);

            let o4 = Object3DUtil.GetCube();
            o4.x = 20;
            o4.y = 0.5;
            o4.z = 25;
            this.scene.addChild(o4);

            let o5 = Object3DUtil.GetCube();
            o5.x = 5;
            o5.y = 0.5;
            o5.z = 25;
            this.scene.addChild(o5);

            let o6 = Object3DUtil.GetCube();
            o6.x = 5;
            o6.y = 0.5;
            o6.z = 5;
            this.scene.addChild(o6);

            this.cubeArray = [];
            this.cubeArray.push(o1);
            this.cubeArray.push(o2);
            this.cubeArray.push(o3);
            this.cubeArray.push(o4);
            this.cubeArray.push(o5);
            this.cubeArray.push(o6);
        }


        let texts = [];
        texts.push(await Engine3D.res.loadTexture("textures/line_001064.png") as BitmapTexture2D);

        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = bitmapTexture2DArray;
        mat.name = "LitMaterial";

        {
            this.width = 1;
            this.height = 1;
            let mr = Graphic3DMesh.drawRibbon("trail", this.scene, bitmapTexture2DArray, 5, this.width * this.height);
            this.parts = mr.object3Ds;
            this.ribbons = mr.ribbons;

            mr.material.blendMode = BlendMode.SOFT_ADD;
            mr.material.transparent = true;
            mr.material.depthWriteEnabled = false;
            mr.material.doubleSide = true;

            for (let i = 0; i < this.width * this.height; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
            }

            let c2 = new Color(1.0, 1.1, 0.2, 0.65);
            this.colors.push(c2);
        }

        for (let i = 0; i < this.cubeArray.length; i++) {
            const element = this.cubeArray[i];
            this.ribbons[0].ribbonPoint[i].localPosition = element.transform.worldPosition;
        }
    }

    update() {
    }

    updateOnce(engineFrame: number) {

    }

}

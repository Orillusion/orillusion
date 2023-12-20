import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Graphic3DMesh, Matrix4, BlendMode, Color, Vector4, LineJoin, GeoJsonStruct, GeoJsonUtil, ShapeInfo, DynamicDrawStruct, Object3DUtil } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { GrassNodeStruct, GrassRenderer } from "@orillusion/graphic";



export class Sample_GPUPhysic {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;
    colors: Color[];
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
        // sky.enable = false;
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

        let floor = Object3DUtil.GetSingleCube(3000, 1, 3000, 0.5, 0.5, 0.5);
        floor.y = -1;
        this.scene.addChild(floor);
    }


    update() {
    }
}

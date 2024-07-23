import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitTexArrayMaterial, BitmapTexture2DArray, BitmapTexture2D, Matrix4, Color } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { GrassNodeStruct, GrassRenderer, Graphic3DMesh, Graphic3D } from "@orillusion/graphic";



export class Sample_GraphicGrass {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;
    colors: Color[];
    graphic3D: Graphic3D
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

        // add graphic3D to scene
        this.graphic3D = new Graphic3D();
        this.scene.addChild(this.graphic3D);

        Engine3D.startRenderView(this.view);

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
            directLight.intensity = 3;
            this.scene.addChild(this.lightObj3D);
        }

        await this.addGrass(0);
    }

    private async addGrass(grassGroup: number) {
        let texts = [];
        texts.push(await Engine3D.res.loadTexture("textures/line3.png") as BitmapTexture2D);
        let bitmapTexture2DArray = new BitmapTexture2DArray(texts[0].width, texts[0].height, texts.length);
        bitmapTexture2DArray.setTextures(texts);

        {
            let mr = Graphic3DMesh.drawNode<GrassRenderer>(
                `path_geojson` + grassGroup,
                GrassRenderer,
                GrassNodeStruct,
                this.scene,
                bitmapTexture2DArray,
                10000,
                10000 * 2
            );
            let mat = mr.material as UnLitTexArrayMaterial;
            // mat.baseColor = new Color(0.2, 10.7, 0.56, 1.0);
            for (let i = 0; i < 1; i++) {
                mr.setTextureID(i, Math.floor(Math.random() * texts.length));
            }

            let space = 50;
            for (const nodeInfo of mr.nodes) {
                let node = nodeInfo as GrassNodeStruct;
                node.grassWight = Math.random() * 1.0 + 1.0;
                node.grassHeigh = Math.random() * 15.0 + 2.5;
                node.grassRotation = Math.random() * 360;

                let radiu = Math.random() * space + Math.random() * space + Math.random() * space;
                let angle = Math.random() * 360;
                node.grassX = Math.sin(angle) * radiu;
                node.grassZ = Math.cos(angle) * radiu;
            }
            mr.updateShape();
        }
    }

    update() {
        this.graphic3D.drawCameraFrustum(Engine3D.views[0].camera);
    }
}

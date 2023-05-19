import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, UIImage, ImageType, Camera3D, Color, WorldPanel } from "@orillusion/core";

export class Sample_UIImageColor {

    camera: Camera3D;
    img: UIImage;
    counter: number = 0;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        await Engine3D.init({ renderLoop: () => { this.renderUpdate(); } });

        let exampleScene = createExampleScene();
        Engine3D.startRenderView(exampleScene.view);

        // create floor
        let floor = Object3DUtil.GetSingleCube(100, 2, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);
        floor.y = -40;

        // enable ui canvas 0
        let canvas = exampleScene.view.enableUICanvas();

        //create UI root
        let panelRoot: Object3D = new Object3D();
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.1;

        this.camera = exampleScene.camera;

        await Engine3D.res.loadAtlas('atlas/UI_atlas.json');

        let panel = panelRoot.addComponent(WorldPanel);
        canvas.addChild(panel.object3D);

        // create image
        let imageQuad = new Object3D();
        panelRoot.addChild(imageQuad);
        this.img = imageQuad.addComponent(UIImage);
        this.img.sprite = Engine3D.res.getGUISprite('button-over');
        this.img.imageType = ImageType.Sliced;
        this.img.uiTransform.resize(400, 300);
        this.img.color = new Color(1.0, 0.5, 1.0, 0.6);
    }

    renderUpdate() {
        if (this.img) {
            this.counter += 0.01;
            let color = this.img.color;
            color.g = 0.5 * (Math.sin(this.counter) + 1);
            this.img.color = color;
        }

    }
}

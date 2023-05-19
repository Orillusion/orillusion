import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, UIImage, ImageType, Camera3D, WorldPanel } from "@orillusion/core";

export class Sample_UIVisible {

    camera: Camera3D;
    imgList: UIImage[];
    counter: number = 0;
    imageCount = 10;
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
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.2;

        this.camera = exampleScene.camera;

        await Engine3D.res.loadAtlas('atlas/Sheet_atlas.json');


        let panel = panelRoot.addComponent(WorldPanel);
        canvas.addChild(panel.object3D);


        this.imgList = [];
        let frameStart = 65;

        for (let i = 0; i < this.imageCount; i++) {
            // create image
            let imageQuad = new Object3D();
            panelRoot.addChild(imageQuad);
            let img = imageQuad.addComponent(UIImage);
            let frameKey = (i + frameStart).toString().padStart(5, '0');
            img.sprite = Engine3D.res.getGUISprite(frameKey);
            img.imageType = ImageType.Sliced;
            img.uiTransform.resize(200, 200);
            img.uiTransform.x = (i - (this.imageCount - 1) * 0.5) * 50;
            this.imgList.push(img);
        }
    }

    renderUpdate() {
        if (this.imgList) {
            this.counter += 0.02;
            let mathSin = (Math.sin(this.counter) + 1) * 0.5;
            let index = Math.floor(mathSin * this.imgList.length);

            for (let i = 0; i < this.imgList.length; i++) {
                this.imgList[i].uiTransform.visible = i != index;
            }
        }

    }
}

import { Engine3D, GUIConfig, Object3D, Object3DUtil, Vector2, ViewPanel, WorldPanel } from "@orillusion/core";
import { UIImage } from "../../src/components/gui/uiComponents/UIImage";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";

class SpriteSheet {
    img: UIImage;
    private lastIndex: number = -1;
    private frameStart = 65;//65~77
    private frame: number = 100 * Math.random();
    private frameCount = 13;
    constructor(img: UIImage) {
        this.img = img;
    }

    updateFrame(): void {
        this.frame++;
        let newIndex = Math.floor(this.frame * 0.05) % this.frameCount;
        if (newIndex != this.lastIndex) {
            this.lastIndex = newIndex;
            let frameKey = (this.lastIndex + this.frameStart).toString().padStart(5, '0');
            this.img.sprite = Engine3D.res.getGUISprite(frameKey);
        }
    }
}

export class Sample_UISpriteSheet {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIConfig.quadMaxCountForView = 10000;
        GUIHelp.init();
        this.spriteSheets = [];

        await Engine3D.init({ renderLoop: () => { this.renderUpdate(); } });
        let exampleScene = createExampleScene();
        Engine3D.startRenderView(exampleScene.view);
        await Engine3D.res.loadAtlas('atlas/Sheet_atlas.json');

        // enable ui canvas 0
        let canvas = exampleScene.view.enableUICanvas();

        //create UI root
        let panelRoot: Object3D = new Object3D();
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.4;
        //create panel
        let panel = panelRoot.addComponent(ViewPanel, { billboard: true });
        canvas.addChild(panel.object3D);

        //create sprite sheet list
        this.createSpriteSheets(panelRoot);
        // create floor
        let floor = Object3DUtil.GetSingleCube(50, 5, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);
        floor.y = -20;

        let box = Object3DUtil.GetSingleCube(2, 80, 2, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(box);
    }

    spriteSheets: SpriteSheet[];

    private createSpriteSheets(root: Object3D) {
        let width = Engine3D.width;
        let height = Engine3D.height;
        for (let i = 0; i < 8000; i++) {
            let quad = new Object3D();
            root.addChild(quad);

            let img = quad.addComponent(UIImage);
            img.sprite = Engine3D.res.getGUISprite('00065');
            img.uiTransform.resize(128, 128);
            img.uiTransform.x = (Math.random() - 0.5) * width * 0.8;
            img.uiTransform.y = (Math.random() - 0.5) * height * 0.8;
            let sheet: SpriteSheet = new SpriteSheet(img);
            this.spriteSheets.push(sheet);
        }

    }

    renderUpdate() {
        for (const item of this.spriteSheets) {
            item.updateFrame();
        }
    }

}

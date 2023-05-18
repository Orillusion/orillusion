import { Engine3D, Object3D, Object3DUtil, WorldPanel } from "@orillusion/core";
import { UIImage } from "../../src/components/gui/uiComponents/UIImage";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";

export class Sample_UISpriteSheet {

    img: UIImage;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

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
        let panel = panelRoot.addComponent(WorldPanel, { billboard: true });
        canvas.addChild(panel.object3D);

        //
        let quad = new Object3D();
        panelRoot.addChild(quad);

        this.img = quad.addComponent(UIImage);
        this.img.sprite = Engine3D.res.getGUISprite('00065');
        this.img.uiTransform.resize(256, 256);

        // create floor
        let floor = Object3DUtil.GetSingleCube(50, 5, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);
        floor.y = -20;

        let box = Object3DUtil.GetSingleCube(2, 80, 2, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(box);
    }

    private frame: number = 10;
    renderUpdate() {
        if (this.img) {
            this.frame++;
            this.loopTextureSheet();
        }
    }

    private lastIndex: number = -1;
    private frameStart = 65;//65~77
    private frameCount = 13;
    loopTextureSheet(): void {
        let newIndex = Math.floor(this.frame * 0.05) % this.frameCount;
        if (newIndex != this.lastIndex) {
            this.lastIndex = newIndex;
            let frameKey = (this.lastIndex + this.frameStart).toString().padStart(5, '0');
            this.img.sprite = Engine3D.res.getGUISprite(frameKey);
        }
    }
}

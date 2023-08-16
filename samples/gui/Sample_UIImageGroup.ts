import { BitmapTexture2D, Engine3D, Object3D, Scene3D, Texture, UIImageGroup, UIShadow, ViewPanel, makeAloneSprite } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Stats } from "@orillusion/stats";
import { GUIUtil } from "@samples/utils/GUIUtil";

export class Sample_UIImageGroup {
    scene: Scene3D;
    imageGroup: UIImageGroup;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;

        GUIHelp.init();

        await Engine3D.init();
        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;
        this.scene.addComponent(Stats);
        Engine3D.startRenderView(exampleScene.view);


        GUIHelp.open();
        GUIHelp.endFolder();

        await this.createImageGroup();
    }

    async createImageGroup() {
        // enable ui canvas
        let canvas = this.scene.view.enableUICanvas();
        //create UI root
        let panelRoot: Object3D = new Object3D();
        //create panel
        let panel = panelRoot.addComponent(ViewPanel);
        canvas.addChild(panel.object3D);

        let bitmapTexture2D = new BitmapTexture2D();
        bitmapTexture2D.flipY = true;
        await bitmapTexture2D.load('png/logo.png');

        let uiNode = new Object3D();
        panelRoot.addChild(uiNode);
        //create sprite sheet list
        this.imageGroup = this.createSpriteSheets(uiNode, bitmapTexture2D);
        let shadow = this.imageGroup.object3D.addComponent(UIShadow);

        GUIUtil.renderUIShadow(shadow, false);

        this.createGUI();
    }

    private halfSize = 0;
    createGUI() {
        GUIHelp.addFolder('Position');
        let xy = this.imageGroup.getXY(1);
        let pos = { x: 0, y: xy.y };
        let action = () => this.imageGroup.setXY(1, pos.x, pos.y);
        GUIHelp.add(pos, 'x', - Engine3D.width * 0.5, Engine3D.width * 0.5, 1).onChange(action);
        GUIHelp.add(pos, 'y', - Engine3D.height * 0.5, Engine3D.height * 0.5, 1).onChange(action);
        GUIHelp.open();
        GUIHelp.endFolder();
    }

    private createSpriteSheets(root: Object3D, texture: Texture): UIImageGroup {
        let sprite = makeAloneSprite('KB3D_NTT_Ads_basecolor', texture);
        let imgGroup = root.addComponent(UIImageGroup, { count: 2 });
        let size = 256;
        this.halfSize = size * 0.5;
        for (let i = 0; i < 2; i++) {
            imgGroup.setSprite(i, sprite);
            imgGroup.setSize(i, size, size);
            if (i == 1) {
                imgGroup.setXY(1, - this.halfSize, 128 - this.halfSize)
            } else {
                imgGroup.setXY(0, - this.halfSize, - this.halfSize)
            }
        }
        return imgGroup;

    }
}

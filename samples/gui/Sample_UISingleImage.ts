import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, BitmapTexture2D, UIImage, makeAloneSprite, WorldPanel, GPUCullMode } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

export class Sample_UISingleImage {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;

        GUIHelp.init();

        await Engine3D.init();
        let exampleScene = createExampleScene();
        Engine3D.startRenderView(exampleScene.view);

        // create floor
        let floor = Object3DUtil.GetSingleCube(100, 2, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);

        //create UI root
        let panelRoot: Object3D = new Object3D();
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.1;

        let bitmapTexture2D = new BitmapTexture2D();
        bitmapTexture2D.flipY = true;

        // enable ui canvas 0
        let canvas = exampleScene.view.enableUICanvas();

        await bitmapTexture2D.load('textures/KB3D_NTT_Ads_basecolor.png');

        let panel = panelRoot.addComponent(WorldPanel);
        panel.cullMode = GPUCullMode.none;

        GUIUtil.renderUIPanel(panel, true);

        canvas.addChild(panel.object3D);

        panel.sprite = makeAloneSprite('KB3D_NTT_Ads_basecolor', bitmapTexture2D);
        panel.uiTransform.resize(600, 400);
        panel.visible = true;
    }

}

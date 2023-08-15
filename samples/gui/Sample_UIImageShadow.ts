import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, BitmapTexture2D, UIImage, makeAloneSprite, WorldPanel, UIShadow } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_UIImageShadow {
    private img: UIImage;

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

        // enable ui canvas
        let canvas = exampleScene.view.enableUICanvas();

        let panel = panelRoot.addComponent(WorldPanel);
        canvas.addChild(panel.object3D);

        let imageQuad = new Object3D();
        panelRoot.addChild(imageQuad);
        this.img = imageQuad.addComponent(UIImage);
        let bitmapTexture2D = new BitmapTexture2D();
        bitmapTexture2D.flipY = true;
        await bitmapTexture2D.load('png/logo.png');

        this.img.sprite = makeAloneSprite('KB3D_NTT_Ads_basecolor', bitmapTexture2D);
        this.img.uiTransform.resize(600, 600);
        this.img.uiTransform.y = 200;

        let shadow = imageQuad.addComponent(UIShadow);
        shadow.shadowQuality = 4;
        shadow.shadowRadius = 4;
        shadow.shadowOffset = shadow.shadowOffset.set(6, -6);
        GUIUtil.renderUIShadow(shadow, true);
    }

}

new Sample_UIImageShadow().run();
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { VideoTexture } from "@orillusion/media-extention";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, ViewPanel, UIImage, ImageType, makeAloneSprite } from "@orillusion/core";

export class Sample_UIVideo {

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        await Engine3D.init();

        let exampleScene = createExampleScene();
        Engine3D.startRenderView(exampleScene.view);

        // create floor
        let floor = Object3DUtil.GetSingleCube(100, 10, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);

        let canvas = exampleScene.view.enableUICanvas();

        let videoTexture = new VideoTexture();
        await videoTexture.load('/video/dt.mp4');

        //create UI root
        let panelRoot: Object3D = new Object3D();
        panelRoot.addComponent(ViewPanel);
        canvas.addChild(panelRoot);
        {
            let imageQuad = new Object3D();
            panelRoot.addChild(imageQuad);
            let image = imageQuad.addComponent(UIImage);
            image.sprite = makeAloneSprite('dt.mp4', videoTexture);
            image.imageType = ImageType.Simple;
            image.uiTransform.resize(600, 400);
        }
    }

}

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, Color, WorldPanel, GUICanvas, UIImage, makeAloneSprite, BitmapTexture2D, UITextField, UIShadow, Time, ImageType } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { VideoTexture } from "@orillusion/media-extention";

class Sample_UIPanelScissor {

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;

        GUIHelp.init();

        await Engine3D.init({ renderLoop: () => { this.loop(); } });

        let param = createSceneParam();
        param.camera.distance = 50;
        let exampleScene = createExampleScene(param);
        Engine3D.startRenderView(exampleScene.view);

        // create floor
        let floor = Object3DUtil.GetSingleCube(100, 2, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);
        floor.y = -20;

        // enable ui canvas at index 0
        let canvas = exampleScene.view.enableUICanvas();
        //create UI root
        let panelRoot: Object3D = new Object3D();
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.1;
        await Engine3D.res.loadFont('fnt/0.fnt');

        this.createPanel(panelRoot, canvas, new Color(1, 1, 1, 1));
    }

    private async createPanel(panelRoot: Object3D, canvas: GUICanvas, color: Color) {
        let panel = panelRoot.addComponent(WorldPanel);
        panel.cullMode = "none";
        canvas.addChild(panel.object3D);
        panel.scissorEnable = true;
        panel.scissorCornerRadius = 40;
        panel.scissorFadeOutSize = 10;
        panel.uiTransform.resize(400, 300);
        panel.visible = true;
        panel.color = color;

        let obj = new Object3D();
        panelRoot.addChild(obj);

        //image
        let image = obj.addComponent(UIImage);
        image.uiTransform.resize(300, 200);

        {
            //make sprite
            // let texture = new BitmapTexture2D();
            // texture.flipY = true;
            // await texture.load('textures/KB3D_NTT_Ads_basecolor.png');
            // image.sprite = makeAloneSprite('sprite', texture);
        }

        {
            // make video
            let videoTexture = new VideoTexture();
            await videoTexture.load('/video/dt.mp4');
            image.sprite = makeAloneSprite('dt.mp4', videoTexture);
            image.uiTransform.resize(350, 250);
        }

        {
            //textfield
            let child = new Object3D();
            obj.addChild(child);
            let textfield = this.textField = child.addComponent(UITextField);
            textfield.uiTransform.resize(200, 100);
            textfield.fontSize = 32;
            textfield.color = new Color(0, 0.5, 1, 1.0);
            textfield.text = 'Scissor Panel';
            //shadow
            child.addComponent(UIShadow);
        }

        GUIUtil.renderUIPanel(panel, true);
    }

    private textField: UITextField;
    private loop(): void {
        if (this.textField) {
            let angle = Time.time * 0.001;
            this.textField.uiTransform.setXY(Math.sin(angle) * 100, Math.cos(angle) * 20);
        }
    }
}


new Sample_UIPanelScissor().run();
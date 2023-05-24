import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, ViewPanel, UIImage, ImageType, UIPanel, makeAloneSprite, Color, Time, UITransform } from "@orillusion/core";

export class Sample_UIChangeParent {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        await Engine3D.init({ renderLoop: () => { this.loop(); } });
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

        let panel: UIPanel = panelRoot.addComponent(ViewPanel);

        //add panel
        canvas.addChild(panel.object3D);

        //create logo
        let logoObject = new Object3D();
        {
            panelRoot.addChild(logoObject);

            let image1: UIImage = logoObject.addComponent(UIImage);
            let logoTexture = await Engine3D.res.loadTexture('png/logo.png');
            image1.sprite = makeAloneSprite('logo', logoTexture);
            image1.uiTransform.resize(100, 100);
        }

        //create image0
        let holder0 = new Object3D();
        {
            panelRoot.addChild(holder0);

            let image1: UIImage = holder0.addComponent(UIImage);
            image1.color = new Color(0.8, 0.8, 0.8, 0.5);
            image1.uiTransform.resize(600, 400);
        }

        //create image1
        let holder1 = new Object3D();
        {
            panelRoot.addChild(holder1);

            let image1: UIImage = holder1.addComponent(UIImage);
            image1.color = new Color(0.2, 0.4, 0.2, 0.8);
            image1.uiTransform.resize(200, 160);
            image1.uiTransform.x = 160;
        }
        this.holder1 = holder1.getComponent(UITransform);

        //create image2
        let image2: UIImage;
        let holder2 = new Object3D();
        {
            panelRoot.addChild(holder2);

            image2 = holder2.addComponent(UIImage);
            image2.color = new Color(0.4, 0.2, 0.2, 0.8);
            image2.uiTransform.resize(200, 160);
            image2.uiTransform.x = -160;
        }

        setInterval(() => {
            let lastParent = logoObject?.parent?.object3D;
            if (lastParent == holder2) {
                holder1.addChild(logoObject);
            } else {
                holder2.addChild(logoObject);
            }
        }, 1000);

        GUIHelp.addButton('Remove Background', () => {
            holder0.removeComponent(UIImage);
        })
        GUIHelp.open();
    }

    private holder1: UITransform;
    private loop(): void {
        if (this.holder1) {
            this.holder1.y = Math.sin(Time.time * 0.005) * 50;
        }
    }
}

import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Object3D, Engine3D, GUISpace, WorldPanel, ViewPanel, UITextField, TextAnchor, Object3DUtil, UIPanel, UIImage, UIShadow, BillboardType, GPUCullMode } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

export class Sample_UITextField {

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;

        GUIHelp.init();

        await Engine3D.init();
        let exampleScene = createExampleScene();
        Engine3D.startRenderView(exampleScene.view);

        // create floor
        let floor = Object3DUtil.GetSingleCube(100, 20, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);

        // enable ui canvas at index 0
        let canvas = exampleScene.view.enableUICanvas();

        //create UI root
        let panelRoot: Object3D = new Object3D();

        await Engine3D.res.loadFont('fnt/0.fnt');

        let space: GUISpace = GUISpace.World; // View
        let panel: UIPanel;

        if (space == GUISpace.World) {
            panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.2;
            panel = panelRoot.addComponent(WorldPanel);
            panel.billboard = BillboardType.BillboardY;
        } else {
            panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 1;
            panel = panelRoot.addComponent(ViewPanel);
        }
        canvas.addChild(panel.object3D);

        {
            let textQuad = new Object3D();
            panelRoot.addChild(textQuad);
            let backGround = textQuad.addComponent(UIImage);
            backGround.color.a = 0.2;
            backGround.isShadowless = true;
            this.text = textQuad.addComponent(UITextField);
            this.text.uiTransform.resize(400, 60);
            this.text.uiTransform.y = 100;

            this.text.text = 'Hello，Orillusion！';
            this.text.fontSize = 32;
            this.text.alignment = TextAnchor.MiddleCenter;
            let size = { width: this.text.uiTransform.width, height: this.text.uiTransform.height };
            let changeSize = () => {
                this.text.uiTransform.resize(size.width, size.height);
            }
            let shadow = textQuad.addComponent(UIShadow);
            GUIUtil.renderUIShadow(shadow, true);
            GUIHelp.add(size, 'width', 100, 200, 1).onChange(() => {
                changeSize();
            });
            GUIHelp.open();
            GUIHelp.endFolder();

        }


    }

    private text: UITextField;

}

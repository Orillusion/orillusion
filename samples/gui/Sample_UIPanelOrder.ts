import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, UIImage, ImageType, Color, WorldPanel, UIPanel, GUICanvas } from "@orillusion/core";

export class Sample_UIPanelOrder {

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        await Engine3D.init();

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
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.1;

        let panelRoot2: Object3D = new Object3D();
        panelRoot2.z = 20;
        panelRoot2.x = -20;
        panelRoot2.scaleX = panelRoot2.scaleY = panelRoot2.scaleZ = 0.1;

        let panel1 = this.createPanel(panelRoot, canvas, new Color(1.0, 0, 0.0, 0.8));
        let panel2 = this.createPanel(panelRoot2, canvas, new Color(0, 0, 1, 0.8));

        panel1.needSortOnCameraZ = true;
        panel2.needSortOnCameraZ = true;

        GUIHelp.addLabel('Red Panel');
        GUIHelp.add(panel1, 'panelOrder', 0, 10, 1);
        GUIHelp.add(panel1, 'needSortOnCameraZ');
        GUIHelp.addLabel('Blue Panel');
        GUIHelp.add(panel2, 'panelOrder', 0, 10, 1);
        GUIHelp.add(panel2, 'needSortOnCameraZ');
        GUIHelp.open();
        GUIHelp.endFolder();
    }

    private createPanel(panelRoot: Object3D, canvas: GUICanvas, color: Color): UIPanel {
        let panel = panelRoot.addComponent(WorldPanel, { billboard: true });
        canvas.addChild(panel.object3D);
        // create image
        let obj3D = new Object3D();
        panelRoot.addChild(obj3D);
        let image = obj3D.addComponent(UIImage);
        image.imageType = ImageType.Sliced;
        image.uiTransform.resize(400, 300);
        image.color = color;
        return panel;
    }

}

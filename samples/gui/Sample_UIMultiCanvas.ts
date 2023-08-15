import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, UIImage, ImageType, Color, UIPanel, ViewPanel, Scene3D, Vector2, UITextField, UIShadow } from "@orillusion/core";

class Sample_UIMultiCanvas {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;

        await Engine3D.init();
        await Engine3D.res.loadFont('fnt/0.fnt');

        let exampleScene = createExampleScene();
        Engine3D.startRenderView(exampleScene.view);

        // create floor
        let floor = Object3DUtil.GetSingleCube(100, 2, 50, 0.5, 0.5, 0.5);
        exampleScene.scene.addChild(floor);
        floor.y = -40;

        let total: number = 4;
        for (let i = 0; i < total; i++) {
            let size: Vector2 = new Vector2();
            size.x = 500 - i * 100;
            size.y = 400 - i * 100;
            this.createPanel(exampleScene.scene, i, size);
        }

    }

    private createPanel(scene: Scene3D, index: number, size: Vector2): UIPanel {
        let panelRoot: Object3D = new Object3D();
        // enable ui canvas at index
        let canvas = scene.view.enableUICanvas(index);
        let panel = panelRoot.addComponent(ViewPanel);
        canvas.addChild(panel.object3D);
        // create image
        let obj3D = new Object3D();
        panelRoot.addChild(obj3D);
        let image = obj3D.addComponent(UIImage);
        image.isShadowless = true;
        image.imageType = ImageType.Sliced;
        image.uiTransform.resize(size.x, size.y);
        image.color = Color.random();

        //text
        let text = obj3D.addComponent(UITextField);
        text.text = 'Canvas index: ' + index;
        text.fontSize = 24;

        //shadow
        let shadow = obj3D.addComponent(UIShadow);
        shadow.shadowOffset.multiplyScaler(0.4);
        return panel;
    }

}

new Sample_UIMultiCanvas().run();

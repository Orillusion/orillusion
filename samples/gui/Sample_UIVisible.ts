import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, UIImage, ImageType, Camera3D, WorldPanel, UITransform } from "@orillusion/core";

export class Sample_UIVisible {
    imageComponentList: UIImage[];
    uiTransform: UITransform;
    counter: number = 0;
    spriteCount = 10;
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;

        GUIHelp.init();

        await Engine3D.init({ renderLoop: () => { this.renderUpdate(); } });

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
        panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.2;

        await Engine3D.res.loadAtlas('atlas/Sheet_atlas.json');

        let panel = panelRoot.addComponent(WorldPanel);
        canvas.addChild(panel.object3D);


        this.imageComponentList = [];
        let frameStart = 65;
        // create sprite list

        for (let i = 0; i < this.spriteCount; i++) {
            let imageQuad = new Object3D();
            panelRoot.addChild(imageQuad);
            let img = imageQuad.addComponent(UIImage);
            let frameKey = (i + frameStart).toString().padStart(5, '0');
            img.sprite = Engine3D.res.getGUISprite(frameKey);
            img.imageType = ImageType.Sliced;
            img.uiTransform.resize(200, 200);
            img.uiTransform.x = (i - (this.spriteCount - 1) * 0.5) * 50;
            this.imageComponentList.push(img);
        }

        //create panel
        let quadGroup: Object3D = new Object3D();
        panelRoot.addChild(quadGroup);
        this.uiTransform = quadGroup.addComponent(UITransform);
        let pi_2 = Math.PI * 2;
        let rectCount = 50;
        for (let i = 0; i < rectCount; i++) {
            let rect = new Object3D();
            quadGroup.addChild(rect);
            let img = rect.addComponent(UIImage);
            img.uiTransform.resize(10, 10);
            let angle = i / rectCount * pi_2;
            img.uiTransform.x = Math.sin(angle) * 160;
            img.uiTransform.y = Math.cos(angle) * 160;
        }
    }

    renderUpdate() {
        if (this.imageComponentList) {
            this.counter += 0.02;
            let mathSin = (Math.sin(this.counter) + 1) * 0.5;
            let index = Math.floor(mathSin * this.imageComponentList.length);

            //component visible
            for (let i = 0; i < this.imageComponentList.length; i++) {
                this.imageComponentList[i].visible = i != index;
            }

            // transform visible
            this.uiTransform.visible = index % 2 == 0;
        }

    }
}

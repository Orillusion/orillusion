import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Engine3D, Object3DUtil, Object3D, GUISpace, WorldPanel, ViewPanel, UIButton, UITextField, Color, TextAnchor, PointerEvent3D, UIImage, ImageType, ComponentBase, View3D, UITransform, UIPanel } from "@orillusion/core";

export class Sample_UIButton {
    button: UIButton;
    scaler: ScalerComponent;

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

        await Engine3D.res.loadFont('fnt/0.fnt');
        await Engine3D.res.loadAtlas('atlas/UI_atlas.json');

        let space: GUISpace = GUISpace.World; // View
        let panel: UIPanel;
        if (space == GUISpace.World) {
            panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 0.2;
            panel = panelRoot.addComponent(WorldPanel);
        } else {
            panelRoot.scaleX = panelRoot.scaleY = panelRoot.scaleZ = 1;
            panel = panelRoot.addComponent(ViewPanel);
        }
        //add panel
        canvas.addChild(panel.object3D);

        {
            let quad = new Object3D();
            panelRoot.addChild(quad);
            let button: UIButton = quad.addComponent(UIButton);
            button.normalSprite = Engine3D.res.getGUISprite('button-up');
            button.downSprite = Engine3D.res.getGUISprite('button-down');
            button.overSprite = Engine3D.res.getGUISprite('button-over');
            button.disableSprite = Engine3D.res.getGUISprite('button-disable');


            button.uiTransform.resize(200, 60);
            button.uiTransform.y = -100;
            this.button = button;

            let buttonLabel = quad.addComponent(UITextField);
            buttonLabel.text = 'Click me';
            buttonLabel.fontSize = 24;
            buttonLabel.color = new Color(1, 0.8, 0.4);
            buttonLabel.alignment = TextAnchor.MiddleCenter;

            quad.addEventListener(PointerEvent3D.PICK_CLICK_GUI, this.onUIClick, this);
            quad.addEventListener(PointerEvent3D.PICK_OUT_GUI, this.onOut, this);
            quad.addEventListener(PointerEvent3D.PICK_OVER_GUI, this.onOver, this);
            quad.addEventListener(PointerEvent3D.PICK_DOWN_GUI, this.onDown, this);
        }

        {
            let imageQuad = new Object3D();
            panelRoot.addChild(imageQuad);
            let img = imageQuad.addComponent(UIImage);
            img.imageType = ImageType.Sliced;
            img.sprite = Engine3D.res.getGUISprite('button-up');
            img.uiTransform.resize(400, 60);
            img.uiTransform.y = 32;
            this.scaler = imageQuad.addComponent(ScalerComponent);
            this.scaler.enable = false;
        }

    }

    private onOut() {
        console.log('onOut');
    }

    private onOver() {
        console.log('onOver');
    }

    private onDown() {
        console.log('onDown');
    }


    private onUIClick(e) {
        this.button.enable = false;
        this.scaler.enable = true;
        setTimeout(() => {
            this.button.enable = true;
            this.scaler.enable = false;

        }, 3000);
    }



}

class ScalerComponent extends ComponentBase {
    private _image: UIImage;
    private counter: number = 0;

    public init(param?: any): void {
        this._image = this.object3D.getComponent(UIImage);
    }

    public onUpdate(view?: View3D) {
        this.counter++;
        this._image.uiTransform.resize((3 + Math.sin(this.counter * 0.01)) * 150, this._image.uiTransform.height);
    }

}
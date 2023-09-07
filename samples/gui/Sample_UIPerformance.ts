import { BoundingBox, Color, Engine3D, GUIConfig, Object3D, Scene3D, UIImage, TextAnchor, UITextField, Vector2, Vector3, ViewPanel, clamp } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Stats } from "@orillusion/stats";

class SpriteSheet {
    public static toggleMove: boolean = false;
    public static toggleAnim: boolean = true;

    private img: UIImage;
    private lastIndex: number = -1;
    private frame: number = 100 * Math.random();
    private frameSpeed: number = 0.5 + Math.random();
    private frameCount = 13;
    private keyFrames: string[];
    private moveSpeed: Vector2;
    private bound: BoundingBox;
    constructor(img: UIImage, keyFrames: string[], bound: BoundingBox) {
        this.img = img;
        this.bound = bound;
        this.keyFrames = keyFrames;
        this.moveSpeed = new Vector2(Math.random() - 0.5, Math.random() - 0.5);
    }

    updateFrame(): void {
        if (SpriteSheet.toggleAnim) {
            this.frame += this.frameSpeed;
            let newIndex = Math.floor(this.frame * 0.1) % this.frameCount;
            if (newIndex != this.lastIndex) {
                this.lastIndex = newIndex;
                this.img.sprite = Engine3D.res.getGUISprite(this.keyFrames[newIndex]);
            }
        }

        if (SpriteSheet.toggleMove) {
            let x = this.img.uiTransform.x;
            let y = this.img.uiTransform.y;
            x += this.moveSpeed.x;
            y += this.moveSpeed.y;
            if (x < this.bound.min.x || x > this.bound.max.x) {
                this.moveSpeed.x *= -1;
            }
            if (y < this.bound.min.y || y > this.bound.max.y) {
                this.moveSpeed.y *= -1;
            }

            this.img.uiTransform.setXY(x, y);
        }

    }
}

export class Sample_UISpriteSheet {
    text: UITextField;
    scene: Scene3D;
    keyFrames: string[];

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;

        GUIConfig.quadMaxCountForView = 5001;

        GUIHelp.init();
        this.spriteSheets = [];
        this.keyFrames = [];
        let frameStart = 65;//65~77

        for (let i = 0; i < 13; i++) {
            this.keyFrames.push((frameStart + i).toString().padStart(5, '0'));
        }

        await Engine3D.init({ renderLoop: () => { this.renderUpdate(); } });
        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;
        this.scene.addComponent(Stats);
        Engine3D.startRenderView(exampleScene.view);
        await Engine3D.res.loadAtlas('atlas/Sheet_atlas.json');
        await Engine3D.res.loadFont('fnt/0.fnt');

        this.text = this.createText();


        GUIHelp.add(SpriteSheet, 'toggleMove');
        GUIHelp.add(SpriteSheet, 'toggleAnim');

        GUIHelp.addButton('Add Sprites', () => {
            if (this.spriteSheets.length < 99999) {
                this.addLotOfSprite();
            }
        });

        GUIHelp.open();
        GUIHelp.endFolder();

        this.addLotOfSprite();
    }

    addLotOfSprite() {
        // enable ui canvas at index 0
        let canvas = this.scene.view.enableUICanvas(0);
        //create UI root
        let panelRoot: Object3D = new Object3D();
        //create panel
        let panel = panelRoot.addComponent(ViewPanel);
        canvas.addChild(panel.object3D);
        //create sprite sheet list
        this.createSpriteSheets(panelRoot);
    }

    createText(): UITextField {
        let canvas = this.scene.view.enableUICanvas(0);
        //create UI root
        let panelRoot: Object3D = new Object3D();
        //create panel
        let panel = panelRoot.addComponent(ViewPanel);
        panel.panelOrder = 10000;
        canvas.addChild(panel.object3D);
        let textQuad = new Object3D();
        panelRoot.addChild(textQuad);
        let text = textQuad.addComponent(UITextField);
        text.uiTransform.resize(400, 60);

        text.fontSize = 24;
        text.alignment = TextAnchor.MiddleCenter;

        return text;

    }

    spriteSheets: SpriteSheet[];

    private createSpriteSheets(root: Object3D) {
        let width = Engine3D.width;
        let height = Engine3D.height;
        let bound = new BoundingBox(new Vector3(0, 0, 0), new Vector3(width, height));
        //color
        let color: Color = Color.random();
        color.a = 1;

        color.r = clamp(color.r * 1.5, 0.5, 1);
        color.g = clamp(color.g * 1.5, 0.5, 1);
        color.b = clamp(color.b * 1.5, 0.5, 1);

        for (let i = 0; i < 5000; i++) {
            let quad = new Object3D();
            root.addChild(quad);
            //
            let img = quad.addComponent(UIImage);
            img.color = color;
            img.sprite = Engine3D.res.getGUISprite('00065');
            img.uiTransform.resize(64, 64);
            img.uiTransform.x = (Math.random() - 0.5) * width * 0.7;
            img.uiTransform.y = (Math.random() - 0.5) * height * 0.7;
            let sheet: SpriteSheet = new SpriteSheet(img, this.keyFrames, bound);
            this.spriteSheets.push(sheet);
        }

        this.text.text = this.spriteSheets.length.toString() + ' Sprites';
    }

    renderUpdate() {
        for (const item of this.spriteSheets) {
            item.updateFrame();
        }
    }

}

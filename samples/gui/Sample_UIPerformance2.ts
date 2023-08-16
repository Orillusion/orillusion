import { BoundingBox, Color, Engine3D, GUIConfig, GUIQuad, Object3D, Scene3D, TextAnchor, UIImageGroup, UITextField, Vector2, Vector3, ViewPanel, clamp } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Stats } from "@orillusion/stats";

class SpriteSheet {
    public static toggleMove: boolean = false;
    public static toggleAnim: boolean = true;

    private imgGroup: UIImageGroup;
    private lastIndex: number = -1;
    private frame: number = 100 * Math.random();
    private frameSpeed: number = 0.5 + Math.random();
    private frameCount = 13;
    private keyFrames: string[];
    private moveSpeed: Vector2;
    private bound: BoundingBox;
    private index: number;

    private quad: GUIQuad;
    constructor(img: UIImageGroup, index: number, keyFrames: string[], bound: BoundingBox) {
        this.imgGroup = img;
        this.index = index;
        this.bound = bound;
        this.keyFrames = keyFrames;
        this.moveSpeed = new Vector2(Math.random() - 0.5, Math.random() - 0.5);
        this.quad = img.getQuad(index);
    }

    updateFrame(): void {
        if (SpriteSheet.toggleAnim) {
            this.frame += this.frameSpeed;
            let newIndex = Math.floor(this.frame * 0.1) % this.frameCount;
            if (newIndex != this.lastIndex) {
                this.lastIndex = newIndex;
                this.imgGroup.setSprite(this.index, Engine3D.res.getGUISprite(this.keyFrames[newIndex]));
            }
        }

        if (SpriteSheet.toggleMove) {
            let x = this.quad.x;
            let y = this.quad.y;
            x += this.moveSpeed.x;
            y += this.moveSpeed.y;
            if (x < this.bound.min.x || x > this.bound.max.x) {
                this.moveSpeed.x *= -1;
            }
            if (y < this.bound.min.y || y > this.bound.max.y) {
                this.moveSpeed.y *= -1;
            }
            this.imgGroup.setXY(this.index, x, y);
        }

    }
}

export class Sample_UIPerformance2 {
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
        let panel = panelRoot.addComponent(ViewPanel, { billboard: true });
        canvas.addChild(panel.object3D);
        //create sprite sheet list
        this.createSpriteSheets(panelRoot);
    }

    createText(): UITextField {
        let canvas = this.scene.view.enableUICanvas(0);
        //create UI root
        let panelRoot: Object3D = new Object3D();
        //create panel
        let panel = panelRoot.addComponent(ViewPanel, { billboard: true });
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

        let sprite = Engine3D.res.getGUISprite('00065');

        let size = 64;
        let halfSize = size * 0.5;
        let imgGroup = root.addComponent(UIImageGroup, { count: 5000 });
        for (let i = 0; i < 5000; i++) {
            imgGroup.setColor(i, color);
            imgGroup.setSprite(i, sprite);
            imgGroup.setSize(i, size, size);
            imgGroup.setXY(i,
                (Math.random() - 0.5) * width * 0.7 - halfSize,
                (Math.random() - 0.5) * height * 0.7 - halfSize);
            let sheet: SpriteSheet = new SpriteSheet(imgGroup, i, this.keyFrames, bound);
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

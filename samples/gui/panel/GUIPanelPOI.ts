import { Color, Engine3D, ImageType, Object3D, PointerEvent3D, TextAnchor, UIImage, UIInteractive, UITextField, clamp } from "@orillusion/core";
import { sampleUIPanelClick, sampleUIPanelDispatcher } from "./GUIBinder";

export class GUIPanelPOI {
    private readonly alpha = 0.8;
    private objUI: Object3D;
    private index: number;
    private _originColor: Color = new Color();
    private _remainTime: number = -1;
    private _backImage: UIImage;
    private _outColor = new Color(0, 0.5, 0.75, this.alpha);

    constructor(obj, index: number) {
        this.objUI = obj;
        this.index = index;
        this.displayUIDetail();
    }

    update(delta: number): void {
        if (this._remainTime > 0) {
            this._remainTime -= delta;
            let progress = clamp(this._remainTime, 0, 500);
            progress = 1 - progress / 500;
            let color = this._backImage.color;
            color.r = this._originColor.r * progress + (1.0 - progress) * 0.2;
            color.g = this._originColor.g * progress + (1.0 - progress) * 0.2;
            color.b = this._originColor.b * progress + (1.0 - progress) * 0.2;
            this._backImage.color = color;
        }
        this.updateFrame();
    }

    private lastIndex: number = -1;
    private frame: number = Math.floor(Math.random() * 10000);
    private frameStart = 65; //65~77
    private frameCount = 13;
    private _icon: UIImage;

    private _frameSpeed = 0.05 + 0.1 * Math.random();

    updateFrame() {
        this.frame++;
        let newIndex = Math.floor(this.frame * this._frameSpeed) % this.frameCount;
        if (newIndex != this.lastIndex) {
            this.lastIndex = newIndex;
            let frameKey = (this.lastIndex + this.frameStart).toString().padStart(5, '0');
            this._icon.sprite = Engine3D.res.getGUISprite(frameKey);
        }
    }

    private displayUIDetail(): void {
        let uiChild = this.objUI.addChild(new Object3D()) as Object3D;

        let r = Math.random() * 0.25 + 0.2;
        let b = Math.random() * 0.25 + 0.2;
        let g = Math.random() * 0.25 + 0.2;
        this._originColor.setTo(r, g, b, this.alpha);
        //back
        this._backImage = this.addImage(uiChild, ' ', 200, 120, r, g, b, this.alpha);
        this._backImage.uiTransform.x = 100;
        this._backImage.uiTransform.y = -60;

        uiChild.addEventListener(
            PointerEvent3D.PICK_CLICK_GUI,
            () => {
                this._remainTime = 500;
                sampleUIPanelClick.data = this.objUI;
                sampleUIPanelDispatcher.dispatchEvent(sampleUIPanelClick);
            },
            this,
        );

        uiChild.addEventListener(
            PointerEvent3D.PICK_OVER_GUI,
            () => {
                this._backImage.color = this._outColor;
            },
            this,
        );

        uiChild.addEventListener(
            PointerEvent3D.PICK_OUT_GUI,
            () => {
                this._backImage.color = this._originColor;
            },
            this,
        );

        let button = uiChild.addComponent(UIInteractive);
        button.interactive = true;

        //icon
        {
            let iconNode = uiChild.addChild(new Object3D()) as Object3D;
            let icon = this.addImage(iconNode, '', 100, 100, 1, 1, 1);
            icon.uiTransform.x = 30;
            icon.uiTransform.y = -30;
            this._icon = icon;
            this.updateFrame();
        }

        //text
        {
            let textChild = this.objUI.addChild(new Object3D()) as Object3D;
            let text = textChild.addComponent(UITextField);
            text.uiTransform.resize(120, 60);
            text.uiTransform.x = 110;
            text.uiTransform.y = -48;
            text.alignment = TextAnchor.UpperLeft;
            text.text = 'Orilussion';
            text.fontSize = 22;
            text.color = new Color(0.9, 0.9, 0.9, 1.0);
        }

        //text
        {
            let textChild = this.objUI.addChild(new Object3D()) as Object3D;
            let text = textChild.addComponent(UITextField);
            text.uiTransform.resize(140, 60);
            text.uiTransform.x = 110;
            text.uiTransform.y = -100;
            text.alignment = TextAnchor.UpperLeft;
            text.text = '次时代WebGPU 3D Engine';
            text.fontSize = 18;
            text.color = new Color(0.8, 0.8, 0.8, 1.0);
        }
    }

    private addImage(obj: Object3D, texture: string, w: number, h: number, r: number, g: number, b: number, a: number = 1): UIImage {
        let image = obj.addComponent(UIImage);
        image.sprite = Engine3D.res.getGUISprite(texture);
        image.uiTransform.resize(w, h);
        image.imageType = ImageType.Sliced;
        image.color.setTo(r, g, b, a);
        return image;
    }
}

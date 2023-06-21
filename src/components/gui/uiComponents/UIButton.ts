import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { ImageType } from '../GUIConfig';
import { GUISprite } from '../core/GUISprite';
import { UIInteractiveStyle } from './IUIInteractive';
import { UIImage } from './UIImage';
import { UIInteractive } from './UIInteractive';

export enum UIButtonTransition {
    NONE = 0,
    COLOR = 1 << 0,
    SPRITE = 1 << 1,
}

/**
 * The basic components used in the GUI to respond to user interaction behavior and have an image component
 * @group GPU GUI
 */
export class UIButton extends UIInteractive {
    protected _spriteMap: Map<UIInteractiveStyle, GUISprite>;
    protected _colorMap: Map<UIInteractiveStyle, Color>;
    protected _image: UIImage;
    private _isCreateImage: boolean;
    private _transition: UIButtonTransition = UIButtonTransition.SPRITE;

    init(param?: any) {
        super.init(param);
        this._interactive = true;
        this._spriteMap = new Map<UIInteractiveStyle, GUISprite>();
        this._colorMap = new Map<UIInteractiveStyle, Color>();
        this._image = this.object3D.getComponent(UIImage);
        this._isCreateImage = this._image == null;
        if (!this._image) {
            this._image = this.object3D.addComponent(UIImage);
        }
        this.imageType = ImageType.Sliced;
    }

    onEnable() {
        this.mouseStyle = UIInteractiveStyle.NORMAL;
    }

    onDisable() {
        this.mouseStyle = UIInteractiveStyle.DISABLE;
    }

    public set transition(value: UIButtonTransition) {
        if (this._transition != value) {
            this._transition = value;
            this.validateStyle(this._style, true);
        }
    }

    public get transition() {
        return this._transition;
    }

    public get imageType() {
        return this._image.imageType;
    }

    public set imageType(value: ImageType) {
        this._image.imageType = value;
    }

    public setStyleColor(style: UIInteractiveStyle, color: Color): this {
        this._colorMap.set(style, color);
        if (this._style == style) {
            this.validateStyle(this._style, true);
        }
        return this;
    }

    public getStyleColor(style: UIInteractiveStyle): Color {
        return this._colorMap.get(style);
    }

    public set mouseStyle(value: UIInteractiveStyle) {
        super.mouseStyle = value;
        this.validateStyle(value, true);
    }

    public get normalSprite() {
        return this._spriteMap.get(UIInteractiveStyle.NORMAL);
    }

    public set normalSprite(value: GUISprite) {
        this._spriteMap.set(UIInteractiveStyle.NORMAL, value);
        if (this._style == UIInteractiveStyle.NORMAL) {
            this.validateStyle(this._style, true);
        }
    }

    public get overSprite() {
        return this._spriteMap.get(UIInteractiveStyle.OVER);
    }

    public set overSprite(value: GUISprite) {
        this._spriteMap.set(UIInteractiveStyle.OVER, value);
        if (this._style == UIInteractiveStyle.OVER) {
            this.validateStyle(this._style, true);
        }
    }

    public set downSprite(value: GUISprite) {
        this._spriteMap.set(UIInteractiveStyle.DOWN, value);
        if (this._style == UIInteractiveStyle.DOWN) {
            this.validateStyle(this._style, true);
        }
    }

    public get downSprite() {
        return this._spriteMap.get(UIInteractiveStyle.DOWN);
    }

    public set disableSprite(value: GUISprite) {
        this._spriteMap.set(UIInteractiveStyle.DISABLE, value);
        if (this._style == UIInteractiveStyle.DISABLE) {
            this.validateStyle(this._style, true);
        }
    }

    public get disableSprite() {
        return this._spriteMap.get(UIInteractiveStyle.DISABLE);
    }

    protected validateStyle(style: UIInteractiveStyle, force?: boolean) {
        if (this._transition & UIButtonTransition.SPRITE) {
            let texture = this._spriteMap.get(style);
            this._image.sprite = texture;
        }

        if (this._transition & UIButtonTransition.COLOR) {
            let color = this._colorMap.get(style);
            color && (this._image.color = color);
        }
    }

    public cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIButton);
        component.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);

        this.imageType = from.imageType;
        this.transition = from.transition;
        //clone sprite map
        from._spriteMap.forEach((v, k) => {
            v && this._spriteMap.set(k, v);
        })
        //clone color map
        from._colorMap.forEach((v, k) => {
            v && this._colorMap.set(k, v.clone());
        })
        //
        this.mouseStyle = from.mouseStyle;
        return this;
    }

    public destroy(): void {
        if (this._isCreateImage && this._image) {
            this.object3D.removeComponent(UIImage);
            this._image = null;
        }
        super.destroy();
    }
}

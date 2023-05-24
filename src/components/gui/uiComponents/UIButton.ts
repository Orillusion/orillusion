import { Object3D } from '../../../core/entities/Object3D';
import { ImageType } from '../GUIConfig';
import { GUISprite } from '../core/GUISprite';
import { UIInteractiveStyle } from './IUIInteractive';
import { UIImage } from './UIImage';
import { UIInteractive } from './UIInteractive';

export class UIButton extends UIInteractive {
    protected _spriteMap: Map<UIInteractiveStyle, GUISprite>;
    protected _image: UIImage;
    private _isCreateImage: boolean;
    init(param?: any) {
        super.init(param);
        this._interactive = true;
        this._spriteMap = new Map<UIInteractiveStyle, GUISprite>();
        this._image = this.object3D.getComponent(UIImage);
        this._isCreateImage = this._image == null;
        if (!this._image) {
            this._image = this.object3D.addComponent(UIImage);
        }
    }

    onEnable() {
        this.mouseStyle = UIInteractiveStyle.NORMAL;
    }

    onDisable() {
        this.mouseStyle = UIInteractiveStyle.DISABLE;
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
        if (this._style != style || force) {
            if (!this._image) {
                this._image = this.object3D.getComponent(UIImage);
                this._image && (this._image.imageType = ImageType.Sliced);
            }
            let texture = this._spriteMap.get(style);
            this._image && (this._image.sprite = texture);
        }
    }

    cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIButton);
        component.copyComponent(this);
        component.downSprite = this.downSprite;
        component.normalSprite = this.normalSprite;
        component.disableSprite = this.disableSprite;
        component.overSprite = this.overSprite;
        component.mouseStyle = this.mouseStyle;
        component.enable = this.enable;
    }

    public destroy(): void {
        if (this._isCreateImage && this._image) {
            this.object3D.removeComponent(UIImage);
            this._image = null;
        }
        super.destroy();
    }
}

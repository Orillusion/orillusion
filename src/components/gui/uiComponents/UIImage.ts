import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { GUIQuad } from '../core/GUIQuad';
import { GUISprite } from '../core/GUISprite';
import { ImageType } from '../GUIConfig';
import { Engine3D } from '../../../Engine3D';
import { UIRenderAble } from './UIRenderAble';

// A UI component to display image/sprite/video
export class UIImage extends UIRenderAble {

    init(param?: any): void {
        super.init?.(param);
        this.attachQuad(GUIQuad.spawnQuad());
    }

    public cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIImage);
        component.copyComponent(this);
        component.sprite = this.sprite;
        component.color = this.color;
        component.imageType = this.imageType;
    }

    public set sprite(value: GUISprite) {
        value ||= Engine3D.res.defaultGUISprite;
        for (let quad of this._mainQuads) {
            quad.sprite = value;
            quad.setSize(this._uiTransform.width, this._uiTransform.height);
        }
        this.setShadowDirty();
    }

    protected onTransformResize(): void {
        this.applyTransformSize();
    }

    private applyTransformSize(): void {
        for (let quad of this._mainQuads) {
            quad.setSize(this._uiTransform.width, this._uiTransform.height);
        }
        this.setShadowDirty();
    }

    public get sprite(): GUISprite {
        return this._mainQuads[0].sprite;
    }

    protected onUIComponentVisible(visible: boolean): void {
        this.applyComponentVisible();
    }

    protected onUITransformVisible(visible: boolean): void {
        this.applyComponentVisible();
    }

    private applyComponentVisible(): void {
        let isHidden = !this._visible || !this._uiTransform.globalVisible;
        for (let item of this._mainQuads) {
            item.visible = !isHidden;
        }
        this.setShadowDirty();
    }

    public get color() {
        return this._mainQuads[0].color;
    }

    public set color(value: Color) {
        for (let item of this._mainQuads) {
            item.color = value;
        }
        this.setShadowDirty();
    }

    public get imageType() {
        return this._mainQuads[0].imageType;
    }

    public set imageType(value: ImageType) {
        for (let item of this._mainQuads) {
            item.imageType = value;
        }
        this.setShadowDirty();
    }
}


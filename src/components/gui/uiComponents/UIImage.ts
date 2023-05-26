import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { GUIQuad } from '../core/GUIQuad';
import { GUISprite } from '../core/GUISprite';
import { UIComponentBase } from './UIComponentBase';
import { ImageType } from '../GUIConfig';
import { Engine3D } from '../../../Engine3D';

export enum UIImageShadow {
    NONE = '',
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

// A UI component to display image/sprite/video
export class UIImage extends UIComponentBase {
    constructor() {
        super();
    }

    private _shadow: UIImageShadow;

    init(param?: any): void {
        super.init();
        let quad = GUIQuad.spawnQuad();
        this.attachQuad(quad);
    }

    public cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIImage);
        component.copyComponent(this);
        component.sprite = this.sprite;
        component.color = this.color;
        component.imageType = this.imageType;
    }

    public set shadow(value: UIImageShadow) {
        if (this._shadow != value) {
            this._shadow = value;
        }
    }
    public get shadow() {
        return this._shadow;
    }

    public set sprite(value: GUISprite) {
        value ||= Engine3D.res.defaultGUISprite;
        for (let quad of this._exlusiveQuads) {
            quad.sprite = value;
            quad.setSize(this._uiTransform.width, this._uiTransform.height);
        }
    }

    protected onTransformResize(): void {
        for (let quad of this._exlusiveQuads) {
            quad.setSize(this._uiTransform.width, this._uiTransform.height);
        }
    }

    public get sprite(): GUISprite {
        return this._exlusiveQuads[0].sprite;
    }

    protected onUIComponentVisible(visible: boolean): void {
        this.applyComponentVisible();
    }

    protected onUITransformVisible(visible: boolean): void {
        this.applyComponentVisible();
    }

    private applyComponentVisible(): void {
        let isHidden = !this._visible || !this._uiTransform.globalVisible;
        for (let item of this._exlusiveQuads) {
            item.visible = !isHidden;
        }
    }

    public get color() {
        return this._exlusiveQuads[0].color;
    }

    public set color(value: Color) {
        this._exlusiveQuads[0].color = value;
    }

    public get imageType() {
        return this._exlusiveQuads[0].imageType;
    }

    public set imageType(value: ImageType) {
        for (let item of this._exlusiveQuads) {
            item.imageType = value;
        }
    }

}


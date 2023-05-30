import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { GUIQuad } from '../core/GUIQuad';
import { GUISprite } from '../core/GUISprite';
import { UIComponentBase } from './UIComponentBase';
import { ImageType } from '../GUIConfig';
import { Engine3D } from '../../../Engine3D';

// A UI component to display a group images/sprites/videos
export class UIImageGroup extends UIComponentBase {
    private _count: number = 0;
    constructor() {
        super();
    }

    init(param?: any): void {
        super.init();
        this._count = param ? param.count : 1;
        for (let i = 0; i < this._count; i++) {
            this.attachQuad(GUIQuad.spawnQuad());
        }
    }

    public getQuad(index: number) {
        return this._exlusiveQuads[index];
    }

    public cloneTo(obj: Object3D) {
        let component = obj.addComponent(UIImageGroup, { count: this._count });
        component.copyComponent(this);
        for (let i = 0; i < this._count; i++) {
            component.setSprite(i, this.getSprite(i));
            component.setColor(i, this.getColor(i));
            component.setImageType(this.getImageType(i), i);
        }
    }

    public setSprite(index: number, value: GUISprite) {
        this._exlusiveQuads[index].sprite = value || Engine3D.res.defaultGUISprite;
    }

    public getSprite(index: number): GUISprite {
        return this._exlusiveQuads[index].sprite;
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

    public getColor(index: number) {
        return this._exlusiveQuads[index].color;
    }

    public setColor(index: number, value: Color) {
        this._exlusiveQuads[index].color = value;
    }

    public getImageType(index: number) {
        return this._exlusiveQuads[index].imageType;
    }

    public setImageType(index: number, value: ImageType) {
        this._exlusiveQuads[index].imageType = value;
    }

    public setSize(index: number, width: number, height: number) {
        this._exlusiveQuads[index].setSize(width, height);
    }

    public setXY(index: number, x: number, y: number) {
        this._exlusiveQuads[index].setXY(x, y);
    }

}


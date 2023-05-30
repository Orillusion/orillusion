import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { GUIQuad } from '../core/GUIQuad';
import { GUISprite } from '../core/GUISprite';
import { ImageType } from '../GUIConfig';
import { Engine3D } from '../../../Engine3D';
import { UIRenderAble } from './UIRenderAble';
import { Vector2 } from '../../..';

// A UI component to display a group images/sprites/videos
export class UIImageGroup extends UIRenderAble {
    private _count: number = 0;
    constructor() {
        super();
    }

    init(param?: any): void {
        super.init?.(param);
        this._count = param ? param.count : 1;
        for (let i = 0; i < this._count; i++) {
            this.attachQuad(GUIQuad.spawnQuad());
        }
    }

    public getQuad(index: number) {
        return this._mainQuads[index];
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
        this._mainQuads[index].sprite = value || Engine3D.res.defaultGUISprite;
        this.setShadowDirty();
    }

    public getSprite(index: number): GUISprite {
        return this._mainQuads[index].sprite;
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

    public getColor(index: number) {
        return this._mainQuads[index].color;
    }

    public setColor(index: number, value: Color) {
        this._mainQuads[index].color = value;
        this.setShadowDirty();
    }

    public getImageType(index: number) {
        return this._mainQuads[index].imageType;
    }

    public setImageType(index: number, value: ImageType) {
        this._mainQuads[index].imageType = value;
        this.setShadowDirty();
    }

    public setSize(index: number, width: number, height: number) {
        this._mainQuads[index].setSize(width, height);
        this.setShadowDirty();
    }

    public setXY(index: number, x: number, y: number) {
        this._mainQuads[index].setXY(x, y);
        this.setShadowDirty();
    }

    public getXY(index: number, ret?: Vector2) {
        ret ||= new Vector2();
        let quad = this._mainQuads[index];
        ret.x = quad.x;
        ret.y = quad.y;
        return ret;
    }

}


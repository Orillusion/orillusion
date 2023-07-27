import { UITransform } from "../uiComponents/UITransform";
import { GUIGeometry } from "./GUIGeometry";
import { GUISprite } from "./GUISprite";
import { ImageType } from "../GUIConfig";
import { Engine3D } from "../../../Engine3D";
import { Matrix3 } from "../../../math/Matrix3";
import { Color } from "../../../math/Color";
import { PoolNode } from "../../../core/pool/ObjectPool";
import { GUIQuadAttrEnum } from "./GUIDefine";

let gui_help_mtx3: Matrix3;

/**
 * The smallest unit in the GUI, basic information required for rendering a plane
 * @group GPU GUI
 */
export class GUIQuad {

    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    public width: number = 1;
    public height: number = 1;

    private _globalX: number = 0;
    private _globalY: number = 0;

    private _globalWidth: number = 0;
    private _globalHeight: number = 0;
    private _visible: boolean = true;
    private _offsetX: number = 0;
    private _offsetY: number = 0;
    protected _sprite: GUISprite = Engine3D.res.defaultGUISprite;
    private _color: Color = new Color(1, 1, 1, 1);
    private _imageType: ImageType = ImageType.Simple;
    public dirtyAttributes: GUIQuadAttrEnum = GUIQuadAttrEnum.MAX;

    public cacheTextureId: number = -1;
    private static textPool: PoolNode<GUIQuad>;

    static get quadPool(): PoolNode<GUIQuad> {
        this.textPool ||= new PoolNode<GUIQuad>();
        return this.textPool;
    }

    static recycleQuad(quad: GUIQuad): void {
        quad.sprite = null;
        quad.dirtyAttributes = GUIQuadAttrEnum.MAX;
        quad.x = 0;
        quad.y = 0;
        quad.z = -1;
        quad.cacheTextureId = -1;
        GUIQuad.quadPool.pushBack(quad);
    }

    static spawnQuad(): GUIQuad {
        let quad = GUIQuad.quadPool.getOne(GUIQuad);
        return quad;
    }

    public get imageType(): ImageType {
        return this._imageType;
    }

    public set imageType(value: ImageType) {
        this._imageType = value;
        this.setAttrChange(GUIQuadAttrEnum.SPRITE | GUIQuadAttrEnum.POSITION);
    }

    public get color(): Color {
        return this._color;
    }

    public set color(value: Color) {
        this._color.copyFrom(value);
        this.setAttrChange(GUIQuadAttrEnum.COLOR);
    }


    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        if (value != this._visible) {
            this._visible = value;
            this.setAttrChange(GUIQuadAttrEnum.SPRITE);
        }
    }

    public get sprite() {
        return this._sprite;
    }

    public set sprite(value: GUISprite) {
        if (this._sprite != value) {
            this._sprite = value;
            this.setAttrChange(GUIQuadAttrEnum.SPRITE | GUIQuadAttrEnum.POSITION);
        }
    }

    public get left(): number {
        return this._globalX - this._offsetX; // + this.x;
    }

    public get right(): number {
        return this.left + this._globalWidth;
    }

    public get top(): number {
        return this._globalY - this._offsetY; // + this.y;
    }

    public get bottom(): number {
        return this.top + this._globalHeight;
    }

    public setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.setAttrChange(GUIQuadAttrEnum.POSITION);
    }

    public setXY(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.setAttrChange(GUIQuadAttrEnum.POSITION);
    }

    public setAttrChange(attr: GUIQuadAttrEnum) {
        this.dirtyAttributes = this.dirtyAttributes | attr;
    }
    public applyTransform(transform: UITransform): this {
        this.setAttrChange(GUIQuadAttrEnum.POSITION);

        let item: GUISprite = this._sprite;
        let _worldMatrix = transform.getWorldMatrix();
        if (this.x != 0 || this.y != 0) {
            _worldMatrix = this.getQuadMatrix(_worldMatrix);
        }
        let matrixScaleX = _worldMatrix.getScaleX();
        let matrixScaleY = _worldMatrix.getScaleY();
        let isSliced = item.isSliced && this._imageType == ImageType.Sliced;
        //计算trim图偏移量
        this._offsetX = transform.width * 0.5 * matrixScaleX;
        this._offsetY = transform.height * 0.5 * matrixScaleY;

        if (isSliced) {
            //去除边缘
            this._globalWidth = matrixScaleX * (transform.width - (item.offsetSize.z - item.trimSize.x));
            this._globalHeight = matrixScaleY * (transform.height - (item.offsetSize.w - item.trimSize.y));

            this._globalX = _worldMatrix.tx + item.offsetSize.x * matrixScaleX;
            this._globalY = _worldMatrix.ty + item.offsetSize.y * matrixScaleY;
        } else {
            let transformScaleX = this.width / item.offsetSize.z;
            let transformScaleY = this.height / item.offsetSize.w;

            this._globalWidth = matrixScaleX * item.trimSize.x * transformScaleX;
            this._globalHeight = matrixScaleY * item.trimSize.y * transformScaleY;

            this._globalX = _worldMatrix.tx + item.offsetSize.x * transformScaleX * matrixScaleX;
            this._globalY = _worldMatrix.ty + item.offsetSize.y * transformScaleY * matrixScaleY;
        }
        return this;
    }

    private getQuadMatrix(world: Matrix3): Matrix3 {
        gui_help_mtx3 ||= new Matrix3();

        gui_help_mtx3.identity();
        gui_help_mtx3.setTranslate(this.x, this.y);
        gui_help_mtx3.mul(world);

        return gui_help_mtx3;
    }

    public writeToGeometry(guiGeometry: GUIGeometry, transform: UITransform): this {
        guiGeometry.fillQuad(this, transform);
        this.dirtyAttributes = GUIQuadAttrEnum.NONE;
        return this;
    }
}

import { UITransform } from "../uiComponents/UITransform";
import { GUIGeometry } from "./GUIGeometry";
import { GUISprite } from "./GUISprite";
import { ImageType } from "../GUIConfig";
import { Engine3D } from "../../../Engine3D";
import { Matrix3 } from "../../../math/Matrix3";
import { Color } from "../../../math/Color";
import { PoolNode } from "../../../core/pool/ObjectPool";

let gui_help_mtx3: Matrix3;

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
    public readonly color: Color = new Color(1, 1, 1, 1);
    public imageType: ImageType = ImageType.Simple;
    public onChange: boolean = true;

    private static textPool: PoolNode<GUIQuad>;

    static get quadPool(): PoolNode<GUIQuad> {
        if (this.textPool == null) {
            this.textPool = new PoolNode<GUIQuad>();
        }
        return this.textPool;
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        if (value != this._visible) {
            this._visible = value;
            this.onChange = true;
        }
    }

    public get sprite() {
        return this._sprite;
    }

    public set sprite(value: GUISprite) {
        if (this._sprite != value) {
            this._sprite = value;
            this.onChange = true;
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

    public transformQuad(transform: UITransform): this {
        this.onChange = true;
        let item: GUISprite = this._sprite;
        let _worldMatrix = transform.getWorldMatrix();
        if (this.x != 0 || this.y != 0) {
            _worldMatrix = this.getQuadMatrix(_worldMatrix);
        }
        let matrixScaleX = _worldMatrix.getScaleX();
        let matrixScaleY = _worldMatrix.getScaleY();
        let isSliced = item.isSliced && this.imageType == ImageType.Sliced;
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
            let transformScaleX = transform.width / item.offsetSize.z;
            let transformScaleY = transform.height / item.offsetSize.w;

            this._globalWidth = matrixScaleX * item.trimSize.x * transformScaleX * this.width;
            this._globalHeight = matrixScaleY * item.trimSize.y * transformScaleY * this.height;

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

    public updateGeometryBuffer(guiGeometry: GUIGeometry, transform: UITransform): this {
        this.onChange = false;
        guiGeometry.updateQuad(this, transform);
        return this;
    }
}

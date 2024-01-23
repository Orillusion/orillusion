import { CircleArcType, Shape3D, ShapeTypeEnum } from "./Shape3D";

/**
 * Define class for drawing Ellipse on the xz plane
 * You can use the API implemented in CanvasPath in Path2DShape3D to draw the xz plane path
 *
 * @export
 * @class EllipseShape3D
 * @extends {Shape3D}
 */
export class EllipseShape3D extends Shape3D {
    private _rx: number = 20;
    private _ry: number = 10;
    private _rotation: number = 0;
    private _segment: number = 4;//4~?
    private _startAngle: number = 0;
    private _endAngle: number = 360;
    private _arcType: CircleArcType = CircleArcType.Sector;

    public readonly shapeType: number = Number(ShapeTypeEnum.Ellipse);

    public set(rx: number, ry: number, lineWidth: number, fill: boolean, line: boolean, segment: number = 10) {
        this.rx = rx;
        this.ry = ry;
        this.lineWidth = lineWidth;
        this.line = line;
        this.fill = fill;
        this.segment = segment;
    }

    public get rx(): number {
        return this._rx;
    }
    public set rx(value: number) {
        if (this._rx != value) {
            this._rx = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get ry(): number {
        return this._ry;
    }
    public set ry(value: number) {
        if (this._ry != value) {
            this._ry = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get rotation(): number {
        return this._rotation;
    }
    public set rotation(value: number) {
        if (this._rotation != value) {
            this._rotation = value;
            this._isChange = true;
        }
    }

    public get segment(): number {
        return this._segment;
    }
    public set segment(value: number) {
        if (this._segment != value) {
            this._segment = Math.round(Math.max(4, value));
            this._isChange = true;
        }
    }

    public get startAngle(): number {
        return this._startAngle;
    }
    public set startAngle(value: number) {
        if (value < 0 || value > 360) {
            value %= 360;
            if (value < 0) {
                value += 360;
            }
        }
        if (this._startAngle != value) {
            this._startAngle = value;
            this._isChange = true;
        }
    }
    public get endAngle(): number {
        return this._endAngle;
    }
    public set endAngle(value: number) {
        if (value < 0 || value > 360) {
            value %= 360;
            if (value < 0) {
                value += 360;
            }
        }
        if (this._endAngle != value) {
            this._isChange = true;
            this._endAngle = value;
        }
    }

    public get arcType(): CircleArcType {
        return this._arcType;
    }
    public set arcType(value: CircleArcType) {
        if (this._arcType != value) {
            this._arcType = value;
            this._isChange = true;
        }
    }

    public calcRequireSource(): void {
        this._destPointCount = this._segment + 1;
        this._srcPointCount = 0;
    }

    protected writeShapeData() {
        super.writeShapeData(
            this._rx, this._ry, this._segment, this._rotation,
            this._startAngle, this._endAngle, Number(this._arcType));
    }
}